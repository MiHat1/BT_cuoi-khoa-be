import { z } from 'zod';

export const createOrderSchema = z.object({
    items: z.array(z.object({
        product_id: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive(),
    })).min(1).max(50).refine(
        (items) => new Set(items.map((item) => item.product_id)).size === items.length,
        { message: 'Each product can only appear once in an order' }
    ),
});

export const updateOrderStatusSchema = z.object({
    status: z.preprocess(
        (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
        z.enum(['PENDING', 'SHIPPING', 'DELIVERED', 'CANCELLED'])
    ),
});

export const orderIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});
