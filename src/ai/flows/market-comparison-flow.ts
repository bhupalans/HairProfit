
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
  prompt: `You are a market analyst AI specializing in the human hair industry.
Your task is to provide a market price estimation for a given hair product based on your extensive training data, which includes a wide range of market information. You do not have live access to the internet.

Analyze the following hair type: {{{hairType}}}

Based on your knowledge of general market trends, provide a realistic market selling price range (lower and upper bound) per unit in {{{currency}}}.

Also, provide a brief analysis explaining your reasoning. Your analysis should be based on common knowledge about factors like hair origin (e.g., Brazilian, Indian), texture (e.g., Body Wave, Straight), perceived quality, and typical market demand for such products.

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
