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
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Database connected successfully');

        // Ensure schema compatibility
        // 1. Categories table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL DEFAULT 'User',
                email VARCHAR(150) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                is_active TINYINT(1) NOT NULL DEFAULT 1
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 3. Products table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                price DECIMAL(12,2) NOT NULL,
                stock INT DEFAULT 0,
                category_id INT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Check if is_active exists on products
        const [prodActiveCol] = await connection.query("SHOW COLUMNS FROM products LIKE 'is_active'");
        if (prodActiveCol.length === 0) {
            await connection.query("ALTER TABLE products ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");
        }

        // Check if description exists on products
        const [prodDescCol] = await connection.query("SHOW COLUMNS FROM products LIKE 'description'");
        if (prodDescCol.length === 0) {
            await connection.query("ALTER TABLE products ADD COLUMN description TEXT NULL");
        }

        // 4. Orders table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                total_amount DECIMAL(12,2) DEFAULT '0.00',
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Update orders status column if needed
        try {
            await connection.query("ALTER TABLE orders MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING'");
        } catch (_) {}

        // 5. Orders Items table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                unit_price DECIMAL(12,2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // View alias for order_items
        try {
            await connection.query("CREATE OR REPLACE VIEW order_items AS SELECT * FROM orders_items");
        } catch (_) {}

        // Seed initial categories & products if empty
        const [catCount] = await connection.query('SELECT COUNT(*) AS count FROM categories');
        if (catCount[0].count === 0) {
            await connection.query(`
                INSERT INTO categories (name, description) VALUES
                ('Điện thoại', 'Điện thoại di động các dòng'),
                ('Laptop', 'Máy tính xách tay cao cấp'),
                ('Phụ kiện', 'Bàn phím, chuột, tai nghe')
            `);
        }

        const [prodCount] = await connection.query('SELECT COUNT(*) AS count FROM products');
        if (prodCount[0].count === 0) {
            const [cats] = await connection.query('SELECT id FROM categories ORDER BY id LIMIT 3');
            const cat1 = cats[0]?.id || null;
            const cat2 = cats[1]?.id || null;
            const cat3 = cats[2]?.id || null;
            await connection.query(`
                INSERT INTO products (name, description, price, stock, category_id, is_active) VALUES
                ('Samsung Galaxy S24 Ultra', 'Flagship phone 512GB', 1400.00, 20, ?, 1),
                ('Macbook Pro M3', 'Apple laptop 16GB RAM', 2200.00, 15, ?, 1),
                ('Tai nghe Sony XM5', 'Tai nghe chống ồn chủ động', 350.00, 10, ?, 1),
                ('Bàn phím Aula F75', 'Bàn phím cơ gõ êm', 90.00, 6, ?, 1)
            `, [cat1, cat2, cat3, cat3]);
            console.log('Sample products seeded successfully');
        }

    } catch (error) {
        console.error('Database connect / initialization failed:', error.message);
        throw error;
    } finally {
        connection?.release();
    }
};

export default pool;
