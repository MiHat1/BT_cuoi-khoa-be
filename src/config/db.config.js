import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    password: process.env.DB_PASSWORD,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export const connectionDb = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connect failed:', error.message);
        throw error;
    } finally {
        connection?.release();
    }
};

export default pool;