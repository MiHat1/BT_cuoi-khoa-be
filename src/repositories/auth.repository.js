import pool from '../config/db.config.js';

export const authRepository = {
    async findByEmail(email) {
        const [rows] = await pool.query(
            'SELECT id, full_name, full_name AS username, email, password AS password_hash, role, is_active, created_at FROM users WHERE email = ?',
            [email]
        );
        return rows[0] ?? null;
    },

    async createUser(user) {
        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
            [user.full_name || user.username || 'User', user.email, user.password_hash || user.password, user.role || 'user']
        );
        return result.insertId;
    },
};
