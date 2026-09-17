// zod validation schemas for authentication forms
import { z } from 'zod';

export const loginSchema = z.object({
  phone_number: z
    .string()
    .min(11, 'mobile number must be at least 11 digits')
    .max(15, 'mobile number too long')
    .regex(/^\+?[0-9]{11,15}$/, 'mobile number must contain valid digits'),
  password: z.string().min(6, 'password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'name must be at least 2 characters').max(100),
  phone_number: z
    .string()
    .min(11, 'mobile number must be at least 11 digits')
    .max(15, 'mobile number too long')
    .regex(/^\+?[0-9]{11,15}$/, 'mobile number must contain valid digits'),
  email: z.string().min(1, 'email is required').email('please enter a valid email address'),
  password: z.string().min(6, 'password must be at least 6 characters'),
  role: z.enum(['CUSTOMER', 'RESTAURANT_OWNER', 'RIDER', 'ADMIN']),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'email address is required').email('please enter a valid email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().min(1, 'email address is required').email('please enter a valid email address'),
    code: z
      .string()
      .length(6, 'verification code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'code must contain only digits'),
    new_password: z.string().min(6, 'password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'passwords do not match',
    path: ['confirm_password'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
