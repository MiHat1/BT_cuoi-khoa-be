import { z } from 'zod';

const emailSchema = z.string().trim().email().max(255).transform((email) => email.toLowerCase());

export const registerSchema = z.object({
    username: z.string().trim().min(3).max(50),
    email: emailSchema,
    password: z.string().min(8).max(72).refine(
        (password) => Buffer.byteLength(password, 'utf8') <= 72,
        { message: 'Password must not exceed 72 bytes' }
    ),
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1).max(72),
});
