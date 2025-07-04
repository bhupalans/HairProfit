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

export const MarketComparisonInputSchema = z.object({
  hairType: z.string().describe('The type or name of the hair product, e.g., "Brazilian Body Wave".'),
  currency: z.string().describe('The currency for the price estimation, e.g., "USD".'),
});
export type MarketComparisonInput = z.infer<typeof MarketComparisonInputSchema>;

export const MarketComparisonOutputSchema = z.object({
  lowerBoundPrice: z.number().describe('The lower bound of the estimated market price range per unit.'),
  upperBoundPrice: z.number().describe('The upper bound of the estimated market price range per unit.'),
  analysis: z.string().describe('A brief analysis explaining the price range, considering factors like origin, quality, and demand.'),
  confidenceScore: z.number().min(0).max(1).describe('A score from 0 to 1 indicating the confidence in the estimation.'),
});
export type MarketComparisonOutput = z.infer<typeof MarketComparisonOutputSchema>;