import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    password: process.env.DB_PASSWORD,
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'be_ck',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export const connectionDb = async () => {
    try {
        const conn = await pool.getConnection();
        console.log('Database connected successfully');
        conn.release();
    } catch (err) {
        console.error('Database connect failed: ', err.message);
        process.exit(1);
    }
};

export default pool;
