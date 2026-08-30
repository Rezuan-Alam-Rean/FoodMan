// zod validation schema for guest and customer checkout form
import { z } from 'zod';

export const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'name must be at least 2 characters'),
  customer_phone: z
    .string()
    .min(11, 'valid bangladesh mobile number is required')
    .regex(/^\+?[0-9]{11,15}$/, 'mobile number must contain valid digits'),
  delivery_zone_id: z.string().min(1, 'please select a delivery zone'),
  delivery_subzone_id: z.string().min(1, 'please select a delivery subzone'),
  delivery_address_text: z
    .string()
    .min(5, 'detailed street address must be at least 5 characters'),
  special_notes: z.string().optional(),
  payment_method: z.enum(['COD', 'BKASH', 'NAGAD', 'ROCKET', 'UPAY']),
  mfs_sender_number: z.string().optional(),
  mfs_transaction_id: z.string().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

