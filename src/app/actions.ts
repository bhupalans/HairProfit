'use server';

import {
  runMarketComparison,
} from '@/ai/flows/market-comparison-flow';
import type { MarketComparisonInput, MarketComparisonOutput } from '@/types';

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
