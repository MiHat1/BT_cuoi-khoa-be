import pool from '../config/db.config.js';

const toCents = (amount) => {
    const num = Number(amount);
    return BigInt(Math.round(num * 100));
};

const fromCents = (cents) => {
    const isNegative = cents < 0n;
    const abs = isNegative ? -cents : cents;
    const whole = abs / 100n;
    const fraction = (abs % 100n).toString().padStart(2, '0');
    return `${isNegative ? '-' : ''}${whole}.${fraction}`;
};

const isValidDecimalAmount = (cents) => {
    return cents >= 0n && cents <= 999999999999n;
};

const mapOrdersWithItems = async (queryable, orders) => {
    if (orders.length === 0) return [];

    const ids = orders.map((order) => order.id);
    const placeholders = ids.map(() => '?').join(', ');
    const [items] = await queryable.query(
        `SELECT oi.id, oi.order_id, oi.product_id, COALESCE(p.name, 'Product') AS product_name,
                oi.quantity, oi.unit_price, CAST(oi.quantity * oi.unit_price AS DECIMAL(12, 2)) AS line_total
         FROM orders_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id IN (${placeholders})
         ORDER BY oi.id`,
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
                [userId, fromCents(totalCents), 'PENDING']
            );

            for (const item of preparedItems) {
                await connection.query(
                    `INSERT INTO orders_items
                     (order_id, product_id, quantity, unit_price)
                     VALUES (?, ?, ?, ?)`,
                    [
                        orderResult.insertId,
                        item.product.id,
                        item.quantity,
                        item.unitPrice,
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
            `SELECT id, user_id, total_amount, status, created_at
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
            `SELECT id, user_id, total_amount, status, created_at
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

            const currentStatus = String(order.status).toUpperCase();
            const targetStatus = String(status).toUpperCase();

            // Terminal states: DELIVERED or CANCELLED cannot transition further
            if (currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED') {
                throw new Error('ORDER_ALREADY_FINISHED');
            }

            const allowedTransitions = {
                PENDING: ['SHIPPING', 'CANCELLED'],
                SHIPPING: ['DELIVERED', 'CANCELLED'],
                DELIVERED: [],
                CANCELLED: [],
            };

            if (currentStatus !== targetStatus && !allowedTransitions[currentStatus]?.includes(targetStatus)) {
                throw new Error('ORDER_INVALID_STATUS_TRANSITION');
            }

            if (targetStatus === 'CANCELLED' && currentStatus !== 'CANCELLED') {
                const [items] = await connection.query(
                    'SELECT product_id, quantity FROM orders_items WHERE order_id = ?',
                    [id]
                );
                for (const item of items) {
                    await connection.query(
                        'UPDATE products SET stock = stock + ? WHERE id = ?',
                        [item.quantity, item.product_id]
                    );
                }
            }

            await connection.query('UPDATE orders SET status = ? WHERE id = ?', [targetStatus, id]);
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
