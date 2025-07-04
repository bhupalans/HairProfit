'use server';
/**
 * @fileOverview An AI flow for identifying potential buyer personas for hair products.
 *
 * - runBuyerAnalysis - A function that generates profiles of potential buyers.
 */

import { ai } from '@/ai/genkit';
import {
  MarketComparisonInputSchema,
  BuyerAnalysisOutputSchema,
  type MarketComparisonInput,
  type BuyerAnalysisOutput,
} from '@/types';


const prompt = ai.definePrompt({
  name: 'buyerAnalysisPrompt',
  input: { schema: MarketComparisonInputSchema },
  output: { schema: BuyerAnalysisOutputSchema },
  prompt: `You are a world-class market research consultant with deep expertise in the global human hair industry. Your task is to identify and profile potential buyer personas for a specific hair product.

Analyze the following hair product:
- Format: {{{format}}}
- Length: {{{length}}}
- Origin: {{{origin}}}
- Texture: {{{texture}}}
- Quality: {{{quality}}}
- Color: {{{color}}}
{{#if targetMarket}}- Target Market: {{{targetMarket}}}{{/if}}

{{#if laceType}}
This is a wig with the following specifications:
- Lace Type: {{{laceType}}}
- Cap Construction: {{{capConstruction}}}
- Density: {{{density}}}
{{/if}}

Based on the product's characteristics, generate a list of 3-4 distinct potential buyer personas from different international markets.

For each persona, you must provide:
1.  **market**: The geographical region (e.g., North America, Europe, West Africa, Brazil).
2.  **buyerType**: A descriptive title for the persona (e.g., "Luxury Salon Owners," "E-commerce Drop Shippers," "Local Hair Braiding Stylists").
3.  **description**: A paragraph detailing who this buyer is, their business model, and what they're looking for in a product.
4.  **keyNeeds**: A list of 2-3 primary purchasing drivers for this persona. What is most important to them? (e.g., "Consistent Quality," "High-Profit Margins," "Brand Exclusivity," "Bulk Discounts").
5.  **marketingChannels**: A list of 2-3 effective channels to reach this buyer persona (e.g., "Instagram DMs," "AliBaba," "Hair & Beauty Trade Shows," "Local Beauty Supply Distributors").

Provide a diverse range of personas that reflect different scales of business and market segments.
  `,
});

const buyerAnalysisFlow = ai.defineFlow(
  {
    name: 'buyerAnalysisFlow',
    inputSchema: MarketComparisonInputSchema,
    outputSchema: BuyerAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function runBuyerAnalysis(input: MarketComparisonInput): Promise<BuyerAnalysisOutput> {
    return buyerAnalysisFlow(input);
}
