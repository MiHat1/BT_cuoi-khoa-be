import { z } from 'zod';

export const updateProfileSchema = z.object({
    full_name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().email().max(255).transform((email) => email.toLowerCase()).optional(),
}).refine((profile) => Object.keys(profile).length > 0, {
    message: 'can it nhat 1 thuoc tinh thay doi',
});
