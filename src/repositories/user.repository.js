import pool from '../config/db.config.js';

export const userRepository = {
    async findAll() {
        const [rows] = await pool.query(
            'SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY id'
        );
        return rows;
    },

    async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] ?? null;
    },

    async findAuthUserById(id) {
        const [rows] = await pool.query(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [id]
        );
        return rows[0] ?? null;
    },

    async findByEmail(email) {
        const [rows] = await pool.query(
            'SELECT id, email FROM users WHERE email = ?',
            [email]
        );
        return rows[0] ?? null;
    },

    async updateProfile(id, profile) {
        const fields = [];
        const values = [];

        for (const field of ['username', 'email']) {
            if (profile[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(profile[field]);
            }
        }

        if (fields.length === 0) return;

        values.push(id);
        await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    },
};