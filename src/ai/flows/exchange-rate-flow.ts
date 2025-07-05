'use server';
/**
 * @fileOverview An AI flow for fetching real-time currency exchange rates.
 *
 * - getExchangeRate - A function that fetches the current exchange rate between two currencies.
 * - ExchangeRateInput - The input type for the getExchangeRate function.
 * - ExchangeRateOutput - The return type for the getExchangeRate function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  ExchangeRateInputSchema,
  ExchangeRateOutputSchema,
  type ExchangeRateInput,
  type ExchangeRateOutput,
} from '@/types';

const prompt = ai.definePrompt({
  name: 'exchangeRatePrompt',
  input: { schema: ExchangeRateInputSchema },
  output: { schema: ExchangeRateOutputSchema },
  prompt: `You are a real-time currency exchange rate provider. Your task is to provide the current exchange rate between two currencies. The user will provide a base currency and a target currency. You must return the number of units of the target currency that are equivalent to one unit of the base currency.

Base Currency: {{{baseCurrency}}}
Target Currency: {{{targetCurrency}}}

Provide only the numerical exchange rate value.`,
});

const exchangeRateFlow = ai.defineFlow(
  {
    name: 'exchangeRateFlow',
    inputSchema: ExchangeRateInputSchema,
    outputSchema: ExchangeRateOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function getExchangeRate(
  input: ExchangeRateInput
): Promise<ExchangeRateOutput> {
  return exchangeRateFlow(input);
}
