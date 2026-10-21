import pool from '../config/db.config.js';

const mapOrdersWithItems = async (queryable, orders) => {
    if (orders.length === 0) return [];

    const ids = orders.map((order) => order.id);
    const placeholders = ids.map(() => '?').join(', ');
    const [items] = await queryable.query(
        `SELECT id, order_id, product_id, product_name, quantity, unit_price, line_total
         FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`,
        ids
    );
    const itemsByOrderId = new Map(orders.map((order) => [Number(order.id), []]));

    for (const item of items) {
        itemsByOrderId.get(Number(item.order_id)).push(item);
    }

    return orders.map((order) => ({
        ...order,
        items: itemsByOrderId.get(Number(order.id)),
    }));
};

export const orderRepository = {
    async create(userId, requestedItems) {
        const connection = await pool.getConnection();
        let transactionStarted = false;
        try {
            await connection.beginTransaction();
            transactionStarted = true;

            const productIds = requestedItems.map((item) => item.product_id).sort((a, b) => a - b);
            const placeholders = productIds.map(() => '?').join(', ');
            const [products] = await connection.query(
                `SELECT id, name, price, stock FROM products
                 WHERE id IN (${placeholders}) AND is_active = 1
                 ORDER BY id FOR UPDATE`,
                productIds
            );

            const productsById = new Map(products.map((product) => [Number(product.id), product]));
            if (productsById.size !== productIds.length) {
                throw new Error('ORDER_PRODUCT_UNAVAILABLE');
            }

            const preparedItems = requestedItems.map((item) => {
                const product = productsById.get(item.product_id);
                if (Number(product.stock) < item.quantity) {
                    throw new Error(`ORDER_INSUFFICIENT_STOCK:${product.name}`);
                }

                const unitPriceCents = toCents(product.price);
                return {
                    product,
                    quantity: item.quantity,
                    unitPrice: fromCents(unitPriceCents),
                    lineTotalCents: unitPriceCents * BigInt(item.quantity),
                };
            });

            const totalCents = preparedItems.reduce((total, item) => total + item.lineTotalCents, 0n);
            if (!isValidDecimalAmount(totalCents)) {
                throw new Error('ORDER_TOTAL_TOO_LARGE');
            }
            const [orderResult] = await connection.query(
                'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
                [userId, fromCents(totalCents), 'pending']
            );

            for (const item of preparedItems) {
                await connection.query(
                    `INSERT INTO order_items
                     (order_id, product_id, product_name, quantity, unit_price, line_total)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        orderResult.insertId,
                        item.product.id,
                        item.product.name,
                        item.quantity,
                        item.unitPrice,
                        fromCents(item.lineTotalCents),
                    ]
                );
                await connection.query(
                    'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
                    [item.quantity, item.product.id, item.quantity]
                );
            }

            await connection.commit();
            transactionStarted = false;
            return orderResult.insertId;
        } catch (error) {
            if (transactionStarted) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error('Failed to roll back order creation:', rollbackError);
                }
            }
            throw error;
        } finally {
            connection.release();
        }
    },

    async findById(id, { userId } = {}) {
        const values = [id];
        let userFilter = '';
        if (userId !== undefined) {
            userFilter = 'AND user_id = ?';
            values.push(userId);
        }
        const [orders] = await pool.query(
            `SELECT id, user_id, total_amount, status, created_at, updated_at
             FROM orders WHERE id = ? ${userFilter}`,
            values
        );
        return (await mapOrdersWithItems(pool, orders))[0] ?? null;
    },

    async findAll({ userId } = {}) {
        const values = [];
        const userFilter = userId === undefined ? '' : 'WHERE user_id = ?';
        if (userId !== undefined) values.push(userId);
        const [orders] = await pool.query(
            `SELECT id, user_id, total_amount, status, created_at, updated_at
             FROM orders ${userFilter} ORDER BY created_at DESC`,
            values
        );
        return mapOrdersWithItems(pool, orders);
    },

    async updateStatus(id, status) {
        const connection = await pool.getConnection();
        let transactionStarted = false;
        try {
            await connection.beginTransaction();
            transactionStarted = true;
            const [orders] = await connection.query(
                'SELECT id, status FROM orders WHERE id = ? FOR UPDATE',
                [id]
            );
            const order = orders[0];
            if (!order) {
                await connection.rollback();
                transactionStarted = false;
                return false;
            }

            const allowedTransitions = {
                pending: ['confirmed', 'cancelled'],
                confirmed: ['shipped', 'cancelled'],
                shipped: ['delivered'],
                delivered: [],
                cancelled: [],
            };
            if (order.status !== status && !allowedTransitions[order.status].includes(status)) {
                throw new Error('ORDER_INVALID_STATUS_TRANSITION');
            }

            if (status === 'cancelled' && order.status !== 'cancelled') {
                const [items] = await connection.query(
                    'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                    [id]
                );
                for (const item of items) {
                    await connection.query(
                        'UPDATE products SET stock = stock + ? WHERE id = ?',
                        [item.quantity, item.product_id]
                    );
                }
            }

            await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
            await connection.commit();
            transactionStarted = false;
            return true;
        } catch (error) {
            if (transactionStarted) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error('Failed to roll back order status update:', rollbackError);
                }
            }
            throw error;
        } finally {
            connection.release();
        }
    },
};
