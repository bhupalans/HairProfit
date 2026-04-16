import * as z from 'zod';

const emptyOrNumber = z.preprocess(
  (val) => (val === null ? '' : val), // convert null to empty string
  z.union([z.string(), z.number()]).optional().default('')
);

export const processingStepSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional().default(''),
  cost: emptyOrNumber,
  wastage: emptyOrNumber,
});

export const nonRemyHairProductSchema = z.object({
  id: z.string().optional(),
  size: z.string().optional().default(''),
  quantity: emptyOrNumber,
  price: emptyOrNumber,
});

export const hairProfitDataSchema = z.object({
  hairType: z.string().optional().default(''),
  purchaseQuantity: emptyOrNumber,
  purchasePrice: emptyOrNumber,
  currency: z.string().min(2, 'A currency must be selected.').optional().default('USD'),
  processingSteps: z.array(processingStepSchema).optional().default([]),
  sellingPricePerUnit: emptyOrNumber,
  enableByproductProcessing: z.boolean().optional().default(false),
  byproductProcessingCost: emptyOrNumber,
  byproductName: z.string().optional().default('Non-Remy Hair'),
  nonRemyHairProducts: z.array(nonRemyHairProductSchema).optional().default([]),
  targetByproductMargin: emptyOrNumber,
  byproductPriceIncreasePerInch: emptyOrNumber,
  byproductLowStockThreshold: emptyOrNumber,
  byproductScarcityPremium: emptyOrNumber,

  // Fields for AI Price Suggestion
  format: z.string().optional(),
  length: z.string().optional(),
  origin: z.string().optional(),
  texture: z.string().optional(),
  quality: z.string().optional(),
  color: z.string().optional(),
  targetMarket: z.string().optional(),
  laceType: z.string().optional(),
  capConstruction: z.string().optional(),
  density: z.string().optional(),
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
  crossMarketAnalysis: z.string().describe('A brief discussion on how pricing for this product might differ in at least two other major international markets (e.g., North America, Europe, Asia, Africa). The response should explain the factors for these variations and use numbered points for each market (e.g., "1. North America: ...\n2. Europe: ...").'),
  confidenceScore: z.number().min(0).max(1).describe('A score from 0 to 1 indicating the confidence in the estimation.'),
});
export type MarketComparisonOutput = z.infer<typeof MarketComparisonOutputSchema>;

export const BuyerPersonaSchema = z.object({
  market: z.string().describe('The geographical market (e.g., North America, West Africa, Europe).'),
  buyerType: z.string().describe('A title for the buyer persona (e.g., "High-End Salon Owner", "Bulk Importer", "E-commerce Brand").'),
  description: z.string().describe('A detailed description of this buyer persona, including their typical business model and what they look for.'),
  keyNeeds: z.array(z.string()).describe('A list of key needs or purchasing drivers for this buyer (e.g., "Consistent Quality", "High-Profit Margin", "Unique Textures").'),
  marketingChannels: z.array(z.string()).describe('The best channels to reach this type of buyer (e.g., "Instagram DMs", "Trade Shows", "B2B Platforms").'),
  exampleQuestions: z.array(z.string()).describe('A list of 2-3 insightful questions to ask this buyer to understand their pain points and qualify them as a potential partner.')
});

export const BuyerAnalysisOutputSchema = z.object({
  personas: z.array(BuyerPersonaSchema).describe('A list of 3-4 potential buyer personas for the specified hair product.')
});
export type BuyerAnalysisOutput = z.infer<typeof BuyerAnalysisOutputSchema>;

export const quotationItemSchema = z.object({
  id: z.string(),
  length: z.string(),
  quantity: z.union([z.string(), z.number()]),
  price: z.union([z.string(), z.number()]),
});
export type QuotationItem = z.infer<typeof quotationItemSchema>;

export const quotationDataSchema = z.object({
  logo: z.string().nullable().optional(),
  quotationRef: z.string(),
  date: z.string(),
  validUntil: z.string(),
  clientInfo: z.object({
    toName: z.string(),
    toAddress: z.string(),
  }),
  myInfo: z.object({
    fromName: z.string(),
    fromAddress: z.string(),
  }),
  productFormat: z.string(),
  productOrigin: z.string(),
  productCategory: z.string().optional(),
  items: z.array(quotationItemSchema),
  shippingCost: z.union([z.string(), z.number()]),
  shippingCarrier: z.string(),
  currency: z.string(),
  displayCurrency: z.string(),
  exchangeRate: z.union([z.string(), z.number()]),
  paymentDetails: z.string(),
  termsAndConditions: z.string(),
});
export type QuotationData = z.infer<typeof quotationDataSchema>;

export const ExchangeRateInputSchema = z.object({
  baseCurrency: z.string().describe('The currency to convert from (e.g., USD).'),
  targetCurrency: z.string().describe('The currency to convert to (e.g., INR).'),
});
export type ExchangeRateInput = z.infer<typeof ExchangeRateInputSchema>;

export const ExchangeRateOutputSchema = z.object({
  rate: z.number().describe('The numerical exchange rate.'),
});
export type ExchangeRateOutput = z.infer<typeof ExchangeRateOutputSchema>;


export const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.union([z.string(), z.number()]),
  price: z.union([z.string(), z.number()]),
});
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export const invoiceDataSchema = z.object({
  logo: z.string().nullable().optional(),
  invoiceRef: z.string(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  clientInfo: z.object({ toName: z.string(), toAddress: z.string() }),
  myInfo: z.object({ fromName: z.string(), fromAddress: z.string() }),
  productFormat: z.string().optional(),
  productOrigin: z.string().optional(),
  productCategory: z.string().optional(),
  items: z.array(invoiceItemSchema),
  currency: z.string(),
  tax: z.union([z.string(), z.number()]),
  discount: z.union([z.string(), z.number()]),
  shippingCost: z.union([z.string(), z.number()]),
  amountPaid: z.union([z.string(), z.number()]),
  notes: z.string(),
  terms: z.string(),
});
export type InvoiceData = z.infer<typeof invoiceDataSchema>;

export const marketplaceListingSchema = z.object({
  id: z.string(),
  type: z.union([z.enum(['sell', 'buy']), z.string()]),
  title: z.string(),
  description: z.string(),
  price: z.union([z.number(), z.string()]),
  currency: z.enum(['USD', 'INR']).optional(),
  unit: z.enum(['bundle', 'kg']).optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  imageUrls: z.array(z.string()),
  imageHint: z.string(),
  userId: z.string().optional(),
  status: z.enum(['active', 'sold', 'fulfilled']).optional().default('active'),
  createdAt: z.string(), // ISO string date
  contact: z.string().optional(), // For backward compatibility
});
export type MarketplaceListing = z.infer<typeof marketplaceListingSchema>;

export const marketplaceListingFormSchema = z.object({
  type: z.enum(['sell', 'buy']),
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.number().positive({ message: "Price must be greater than 0." }),
  currency: z.enum(['USD', 'INR']),
  unit: z.enum(['bundle', 'kg']),
  contactEmail: z.string().email({ message: "Invalid email address." }),
  contactPhone: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  userId: z.string().optional(),
});
export type MarketplaceListingFormData = z.infer<typeof marketplaceListingFormSchema>;

export const businessProfileSchema = z.object({
  name: z.string().optional(),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  contact: z.object({
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
  }).optional(),
  tax: z.object({
    gst: z.string().optional(),
  }).optional(),
});

export type BusinessProfile = z.infer<typeof businessProfileSchema>;

// Subscription & Payment Types
export type SubscriptionPlan = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'none';

export interface UserSubscription {
  status: SubscriptionStatus;
  plan?: SubscriptionPlan;
  startDate?: string;
  expiryDate?: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  email: string;
  plan: SubscriptionPlan;
  amount: number;
  utr: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
