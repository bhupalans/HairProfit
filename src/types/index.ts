import * as z from 'zod';

export const processingStepSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Step name is required.'),
  cost: z.union([z.string(), z.number()]),
  wastage: z.union([z.string(), z.number()]),
});

export const nonRemyHairProductSchema = z.object({
  id: z.string(),
  size: z.string().min(1, 'Size is required.'),
  quantity: z.union([z.string(), z.number()]),
  price: z.union([z.string(), z.number()]),
});

export const hairProfitDataSchema = z.object({
  hairType: z.string().min(1, 'Hair type is required.'),
  purchaseQuantity: z.union([z.string(), z.number()]),
  purchasePrice: z.union([z.string(), z.number()]),
  currency: z.string().min(2, 'A currency must be selected.'),
  processingSteps: z.array(processingStepSchema),
  sellingPricePerUnit: z.union([z.string(), z.number()]),
  enableByproductProcessing: z.boolean().default(false),
  byproductProcessingCost: z.union([z.string(), z.number()]).optional(),
  nonRemyHairProducts: z.array(nonRemyHairProductSchema).optional(),
});

export type ProcessingStep = z.infer<typeof processingStepSchema>;
export type NonRemyHairProduct = z.infer<typeof nonRemyHairProductSchema>;
export type HairProfitData = z.infer<typeof hairProfitDataSchema>;
