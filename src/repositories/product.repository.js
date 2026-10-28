import pool from '../config/db.config.js';

const productColumns = 'id, name, description, price, stock, category_id, is_active, created_at';

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
            'INSERT INTO products (name, description, price, stock, category_id, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [
                product.name,
                product.description ?? null,
                product.price,
                product.stock,
                product.category_id ?? null,
                product.is_active !== undefined ? (product.is_active ? 1 : 0) : 1
            ]
        );
        return result.insertId;
    },

    async update(id, product) {
        const fields = [];
        const values = [];

        for (const field of ['name', 'description', 'price', 'stock', 'category_id', 'is_active']) {
            if (product[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(field === 'is_active' ? (product[field] ? 1 : 0) : product[field]);
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

    async delete(id) {
        await pool.query('DELETE FROM products WHERE id = ?', [id]);
    },
};
