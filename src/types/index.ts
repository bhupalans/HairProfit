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
  hairType: z.string(),
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
  format: z.string().describe('The format of the hair product, e.g., "Tape-in", "Weave".'),
  length: z.string().describe('The length of the hair, e.g., "10 inches".'),
  origin: z.string().describe('The origin of the hair, e.g., "Indian", "Brazilian".'),
  texture: z.string().describe('The texture of the hair, e.g., "Straight", "Wavy".'),
  quality: z.string().describe('The quality grade of the hair, e.g., "Virgin", "Remy".'),
  color: z.string().describe('The color of the hair, e.g., "Natural Black", "#613 Blonde".'),
  currency: z.string().describe('The currency for the price estimation, e.g., "USD", "INR".'),
});
export type MarketComparisonInput = z.infer<typeof MarketComparisonInputSchema>;

export const MarketComparisonOutputSchema = z.object({
  lowerBoundPrice: z.number().describe('The lower bound of the estimated market price range per unit.'),
  upperBoundPrice: z.number().describe('The upper bound of the estimated market price range per unit.'),
  reasoning: z.string().describe('The detailed reasoning for the price estimation, considering all provided factors like hair origin, format, length, texture, quality, color, and typical market demand.'),
  crossMarketAnalysis: z.string().describe('A brief discussion on how pricing for this product might differ in at least two other major international markets (e.g., North America, Europe, Asia, Africa). The response should explain the factors for these variations and use numbered points for each market (e.g., "1. North America: ...\\n2. Europe: ...").'),
  confidenceScore: z.number().min(0).max(1).describe('A score from 0 to 1 indicating the confidence in the estimation.'),
});
export type MarketComparisonOutput = z.infer<typeof MarketComparisonOutputSchema>;
