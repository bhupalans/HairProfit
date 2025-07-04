
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
- Target Currency: {{{currency}}}

Based on your knowledge, provide the following:

1.  A realistic market selling price range (lower and upper bound) per unit/bundle in {{{currency}}}.
2.  A confidence score between 0 and 1 for your estimation.
3.  A comprehensive analysis that includes:
    - The reasoning for your price estimation, considering factors like hair origin (e.g., Brazilian, Indian), format (e.g. Weave, Tape-in), length, texture, perceived quality, and typical market demand.
    - A brief discussion on how pricing for this product might differ in at least two other major international markets (e.g., North America, Europe, Asia, Africa), explaining the factors for these variations.
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
