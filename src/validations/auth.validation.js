import { z } from 'zod';

const emailSchema = z.string().trim().email().max(255).transform((email) => email.toLowerCase());

export const registerSchema = z.object({
    full_name: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: z.string().min(6).max(72),
});

export const loginSchema = z.object({
    email: z.string().trim().optional(),
    full_name: z.string().trim().optional(),
    identifier: z.string().trim().optional(),
    password: z.string().min(1).max(72),
}).refine((data) => data.email || data.full_name || data.identifier, {
    message: 'Either full_name or email is required to login',
});
