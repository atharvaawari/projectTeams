import {z} from 'zod';

export const emailSchema = z.string().trim().email("Invalid email address").min(1).max(255);

export const passwordSchema = z.string().trim().min(6).max(12);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(225),
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

