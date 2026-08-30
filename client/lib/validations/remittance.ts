// zod validation schema for rider cod cash remittance submission
import { z } from 'zod';

export const remittanceSchema = z.object({
  amount: z.coerce.number().positive('remittance amount must be greater than zero'),
  payment_method: z.string().min(1, 'payment method is required'),
  sender_account_no: z
    .string()
    .min(11, 'sender account number must be at least 11 digits'),
  transaction_reference: z
    .string()
    .min(4, 'transaction reference id is required'),
});

export type RemittanceFormValues = z.infer<typeof remittanceSchema>;
