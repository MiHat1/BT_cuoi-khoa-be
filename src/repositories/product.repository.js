import pool from '../config/db.config.js';

const productColumns = 'id, sku, name, description, price, stock, is_active, created_at, updated_at';

export const productRepository = {
    async findAll({ includeInactive = false } = {}) {
        const [rows] = await pool.query(
            `SELECT ${productColumns} FROM products ${includeInactive ? '' : 'WHERE is_active = 1'} ORDER BY id`
        );
        return rows;
    },

    async findById(id, { includeInactive = false } = {}) {
        const [rows] = await pool.query(
            `SELECT ${productColumns} FROM products WHERE id = ? ${includeInactive ? '' : 'AND is_active = 1'}`,
            [id]
        );
        return rows[0] ?? null;
    },

    async create(product) {
        const [result] = await pool.query(
            'INSERT INTO products (sku, name, description, price, stock) VALUES (?, ?, ?, ?, ?)',
            [product.sku, product.name, product.description ?? null, product.price, product.stock]
        );
        return result.insertId;
    },

    async update(id, product) {
        const fields = [];
        const values = [];

        for (const field of ['sku', 'name', 'description', 'price', 'stock', 'is_active']) {
            if (product[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(product[field]);
            }
        }

        if (fields.length > 0) {
            values.push(id);
            await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
        }
    },

    async deactivate(id) {
        await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    },
};
