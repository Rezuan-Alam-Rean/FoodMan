// zod validation schema for admin manual payout settlement
import { z } from 'zod';

export const payoutSchema = z.object({
  recipient_user_id: z.string().min(1, 'please select a recipient partner'),
  amount: z.coerce.number().positive('payout amount must be greater than zero'),
  payout_channel: z.enum(['BANK_TRANSFER', 'BKASH', 'NAGAD', 'ROCKET']),
  reference_txn_id: z.string().min(3, 'reference transaction id is required'),
  notes: z.string().optional(),
});

export type PayoutFormValues = z.infer<typeof payoutSchema>;
