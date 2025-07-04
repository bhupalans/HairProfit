
'use server';
/**
 * @fileOverview An AI flow for market price comparison of hair products.
 *
 * - runMarketComparison - A function that estimates the market price for a given hair type.
 */

import { ai } from '@/ai/genkit';
import {
  MarketComparisonInputSchema,
  MarketComparisonOutputSchema,
  type MarketComparisonInput,
  type MarketComparisonOutput,
} from '@/types';


const prompt = ai.definePrompt({
  name: 'marketComparisonPrompt',
  input: { schema: MarketComparisonInputSchema },
  output: { schema: MarketComparisonOutputSchema },
  prompt: `You are a market analyst AI specializing in the human hair industry. Your analysis is based on your extensive training data, which includes a wide range of market information. You do not have live access to the internet.

Analyze the following hair product:
- Format: {{{format}}}
- Length: {{{length}}}
- Origin: {{{origin}}}
- Texture: {{{texture}}}
- Quality: {{{quality}}}
- Color: {{{color}}}
- Target Currency: {{{currency}}}

Based on your knowledge, provide a structured analysis for the user.

First, provide a realistic market selling price range (lower and upper bound) per unit/bundle in {{{currency}}}.

Second, provide your detailed reasoning for this price estimation into the 'reasoning' field. Consider all provided factors like hair origin, format, length, texture, quality/grade, color, and typical market demand.

Third, provide a brief discussion on how pricing for this product might differ in at least two other major international markets (e.g., North America, Europe, Asia, Africa) into the 'crossMarketAnalysis' field. Explain the factors for these variations and use numbered points for each market (e.g., "1. North America: ...\\n2. Europe: ...").

Finally, provide a confidence score between 0 and 1 for your estimation.
  `,
});

const marketComparisonFlow = ai.defineFlow(
  {
    name: 'marketComparisonFlow',
    inputSchema: MarketComparisonInputSchema,
    outputSchema: MarketComparisonOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function runMarketComparison(input: MarketComparisonInput): Promise<MarketComparisonOutput> {
    return marketComparisonFlow(input);
}
