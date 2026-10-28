import { z } from 'zod';

const emailSchema = z.string().trim().email().max(255).transform((email) => email.toLowerCase());

export const registerSchema = z.object({
    username: z.string().trim().min(2).max(50).optional(),
    full_name: z.string().trim().min(2).max(100).optional(),
    email: emailSchema,
    password: z.string().min(6).max(72),
}).refine((data) => data.username || data.full_name, {
    message: 'Either username or full_name is required',
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1).max(72),
});
