import * as z from 'zod';

export const processingStepSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Step name is required.'),
  cost: z.coerce.number().min(0, 'Expense cannot be negative.'),
  wastage: z.coerce.number().min(0, 'Wastage cannot be negative.'),
});

export const nonRemyHairProductSchema = z.object({
  id: z.string(),
  size: z.string().min(1, 'Size is required.'),
  quantity: z.coerce.number().min(0, 'Quantity must be a positive number.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
});

export const hairProfitDataSchema = z.object({
  hairType: z.string().min(1, 'Hair type is required.'),
  purchaseQuantity: z.coerce.number().min(0, 'Quantity must be a positive number.'),
  purchasePrice: z.coerce.number().min(0, 'Price must be a positive number.'),
  currency: z.string().min(2, 'A currency must be selected.'),
  processingSteps: z.array(processingStepSchema),
  sellingPricePerUnit: z.coerce.number().min(0, 'Selling price must be a positive number.'),
  enableByproductProcessing: z.boolean().default(false),
  byproductProcessingCost: z.coerce.number().min(0, 'Cost must be a positive number.').optional(),
  nonRemyHairProducts: z.array(nonRemyHairProductSchema).optional(),
});

export type ProcessingStep = z.infer<typeof processingStepSchema>;
export type NonRemyHairProduct = z.infer<typeof nonRemyHairProductSchema>;
export type HairProfitData = z.infer<typeof hairProfitDataSchema>;
