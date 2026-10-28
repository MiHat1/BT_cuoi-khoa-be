import pool from '../config/db.config.js';

export const userRepository = {
    async findAll() {
        const [rows] = await pool.query(
            'SELECT id, full_name, full_name AS username, email, role, is_active, created_at FROM users ORDER BY id'
        );
        return rows;
    },

    async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, full_name, full_name AS username, email, role, is_active, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] ?? null;
    },

    async findAuthUserById(id) {
        const [rows] = await pool.query(
            'SELECT id, full_name, full_name AS username, email, role, is_active FROM users WHERE id = ?',
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

        if (profile.full_name !== undefined || profile.username !== undefined) {
            fields.push('full_name = ?');
            values.push(profile.full_name ?? profile.username);
        }

        if (profile.email !== undefined) {
            fields.push('email = ?');
            values.push(profile.email);
        }

        if (fields.length === 0) return;

        values.push(id);
        await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    },
};
