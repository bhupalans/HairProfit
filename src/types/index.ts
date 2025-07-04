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
  targetMarket: z.string().optional().describe('The target market segment for the product, e.g., "Budget", "Mid-Range", "Luxury".'),
  laceType: z.string().optional().describe('ONLY for wigs. The type of lace used, e.g., "HD Lace", "Transparent Lace".'),
  capConstruction: z.string().optional().describe('ONLY for wigs. The cap construction of the wig, e.g., "Lace Front", "Full Lace".'),
  density: z.string().optional().describe('ONLY for wigs. The density of the wig, e.g., "150%", "180%".'),
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

export const BuyerPersonaSchema = z.object({
  market: z.string().describe('The geographical market (e.g., North America, West Africa, Europe).'),
  buyerType: z.string().describe('A title for the buyer persona (e.g., "High-End Salon Owner", "Bulk Importer", "E-commerce Brand").'),
  description: z.string().describe('A detailed description of this buyer persona, including their typical business model and what they look for.'),
  keyNeeds: z.array(z.string()).describe('A list of key needs or purchasing drivers for this buyer (e.g., "Consistent Quality", "High-Profit Margin", "Unique Textures").'),
  marketingChannels: z.array(z.string()).describe('The best channels to reach this type of buyer (e.g., "Instagram DMs", "Trade Shows", "B2B Platforms").')
});

export const BuyerAnalysisOutputSchema = z.object({
  personas: z.array(BuyerPersonaSchema).describe('A list of 3-4 potential buyer personas for the specified hair product.')
});
export type BuyerAnalysisOutput = z.infer<typeof BuyerAnalysisOutputSchema>;
