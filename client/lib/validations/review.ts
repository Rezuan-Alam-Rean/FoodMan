// zod validation schema for customer order review
import { z } from 'zod';

export const reviewSchema = z.object({
  food_rating: z.coerce.number().min(1).max(5).optional(),
  food_review: z.string().max(500, 'review cannot exceed 500 characters').optional(),
  rider_rating: z.coerce.number().min(1).max(5).optional(),
  rider_review: z.string().max(500, 'review cannot exceed 500 characters').optional(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
