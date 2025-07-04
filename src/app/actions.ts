'use server';

import {
  runMarketComparison,
} from '@/ai/flows/market-comparison-flow';
import { runBuyerAnalysis } from '@/ai/flows/buyer-analysis-flow';
import type { MarketComparisonInput, MarketComparisonOutput, BuyerAnalysisOutput } from '@/types';

export async function getMarketComparison(
  input: MarketComparisonInput
): Promise<{ success: boolean; data?: MarketComparisonOutput; error?: string }> {
  try {
    const result = await runMarketComparison(input);
    return { success: true, data: result };
  } catch (e: any) {
    console.error('Market comparison flow failed', e);
    const errorMessage = e.message || 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}

export async function getBuyerAnalysis(
  input: MarketComparisonInput
): Promise<{ success: boolean; data?: BuyerAnalysisOutput; error?: string }> {
  try {
    const result = await runBuyerAnalysis(input);
    return { success: true, data: result };
  } catch (e: any) {
    console.error('Buyer analysis flow failed', e);
    const errorMessage = e.message || 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
