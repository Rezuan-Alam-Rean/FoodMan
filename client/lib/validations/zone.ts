// zod validation schema for admin delivery zones
import { z } from 'zod';

export const zoneSchema = z.object({
  name: z.string().min(2, 'zone name must be at least 2 characters'),
  city: z.string().min(2, 'city must be at least 2 characters'),
  fixed_delivery_fee: z.coerce
    .number()
    .nonnegative('delivery fee cannot be negative'),
});

export type ZoneFormValues = z.infer<typeof zoneSchema>;
