import { z } from 'zod';

const productFields = {
    sku: z.string().trim().min(1).max(50),
    name: z.string().trim().min(1).max(150),
    description: z.string().trim().max(2000).nullable().optional(),
    price: z.number().finite().positive().max(9999999999.99),
    stock: z.number().int().nonnegative(),
};

export const createProductSchema = z.object(productFields);

export const updateProductSchema = z.object({
    ...productFields,
    is_active: z.boolean(),
}).partial().refine((product) => Object.keys(product).length > 0, {
    message: 'At least one product field is required',
});

export const productIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});
