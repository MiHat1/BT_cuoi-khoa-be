import { z } from 'zod';

const productFields = {
    name: z.string().trim().min(1).max(255),
    price: z.coerce.number().finite().positive().max(9999999999.99),
    stock: z.coerce.number().int().nonnegative(),
    description: z.string().trim().max(2000).nullable().optional(),
    category_id: z.coerce.number().int().positive().nullable().optional(),
};

export const createProductSchema = z.object(productFields);

export const updateProductSchema = z.object({
    ...productFields,
    is_active: z.boolean().optional(),
}).partial().refine((product) => Object.keys(product).length > 0, {
    message: 'At least one product field is required',
});

export const productIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});
