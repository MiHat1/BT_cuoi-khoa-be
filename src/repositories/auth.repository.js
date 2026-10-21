import pool from '../config/db.config.js';

export const authRepository = {
    async findByEmail(email) {
        const [rows] = await pool.query(
            'SELECT id, username, email, password_hash, role FROM users WHERE email = ?',
            [email]
        );
        return rows[0] ?? null;
    },

    async createUser(user) {
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [user.username, user.email, user.password_hash, user.role]
        );
        return result.insertId;
    },
};