// zod validation schemas for authentication forms
import { z } from 'zod';

export const loginSchema = z.object({
  phone_number: z
    .string()
    .min(11, 'mobile number must be at least 11 digits')
    .max(15, 'mobile number too long')
    .regex(/^[0-9+]+$/, 'mobile number must contain valid digits'),
  password: z.string().min(6, 'password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'name must be at least 2 characters').max(100),
  phone_number: z
    .string()
    .min(11, 'mobile number must be at least 11 digits')
    .max(15, 'mobile number too long')
    .regex(/^[0-9+]+$/, 'mobile number must contain valid digits'),
  email: z.string().email('invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'password must be at least 6 characters'),
  role: z.enum(['CUSTOMER', 'RESTAURANT_OWNER', 'RIDER', 'ADMIN']),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
