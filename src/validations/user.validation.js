import { z } from 'zod';

export const updateProfileSchema = z.object({
    username: z.string().trim().min(3).max(50).optional(),
    email: z.string().trim().email().max(255).transform((email) => email.toLowerCase()).optional(),
}).refine((profile) => Object.keys(profile).length > 0, {
    message: 'At least one profile field is required',
});
