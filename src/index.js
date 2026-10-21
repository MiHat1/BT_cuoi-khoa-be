import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { connectionDb } from './config/db.config.js';
import authRouter from './routes/auth.router.js';
import userRouter from './routes/user.router.js';
import productRouter from './routes/product.router.js';
import orderRouter from './routes/order.router.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { NotFoundError } from './utils/error.helper.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'OK' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);

app.use((req, res, next) => {
    next(new NotFoundError(`Route not found: ${req.originalUrl}`));
});

app.use(errorHandler);

const startServer = async () => {
    await connectionDb();

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

startServer().catch((error) => {
    console.error('Application startup failed:', error);
    process.exitCode = 1;
});
