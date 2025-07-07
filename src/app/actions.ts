'use server';

import {
  runMarketComparison,
} from '@/ai/flows/market-comparison-flow';
import { runBuyerAnalysis } from '@/ai/flows/buyer-analysis-flow';
import { getExchangeRate } from '@/ai/flows/exchange-rate-flow';
import type { MarketComparisonInput, MarketComparisonOutput, BuyerAnalysisOutput, ExchangeRateInput, ExchangeRateOutput, MarketplaceListing, MarketplaceListingFormData } from '@/types';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, getDoc } from 'firebase/firestore';

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

export async function fetchExchangeRate(
  input: ExchangeRateInput
): Promise<{ success: boolean; data?: ExchangeRateOutput; error?: string }> {
  try {
    const result = await getExchangeRate(input);
    return { success: true, data: result };
  } catch (e: any) {
    console.error('Exchange rate flow failed', e);
    const errorMessage = e.message || 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}

// Marketplace Actions
export async function getListings(): Promise<{ success: boolean; data?: MarketplaceListing[]; error?: string }> {
  try {
    const listingsRef = collection(db, 'listings');
    const q = query(listingsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const listings: MarketplaceListing[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      listings.push({
        id: doc.id,
        type: data.type,
        title: data.title,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        imageHint: data.imageHint,
        contact: data.contact,
        createdAt: data.createdAt.toDate().toISOString(),
      });
    });
    return { success: true, data: listings };
  } catch (e: any) {
    console.error('Failed to fetch listings', e);
    return { success: false, error: e.message || 'Failed to fetch listings.' };
  }
}

export async function getListing(id: string): Promise<{ success: boolean; data?: MarketplaceListing; error?: string }> {
  try {
    const docRef = doc(db, 'listings', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const listing: MarketplaceListing = {
        id: docSnap.id,
        type: data.type,
        title: data.title,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        imageHint: data.imageHint,
        contact: data.contact,
        createdAt: data.createdAt.toDate().toISOString(),
      };
      return { success: true, data: listing };
    } else {
      return { success: false, error: 'Listing not found.' };
    }
  } catch (e: any) {
    console.error(`Failed to fetch listing ${id}`, e);
    return { success: false, error: e.message || 'Failed to fetch listing.' };
  }
}


export async function createListing(listingData: MarketplaceListingFormData): Promise<{ success: boolean; error?: string }> {
  try {
    const listingsRef = collection(db, 'listings');
    await addDoc(listingsRef, {
      ...listingData,
      imageUrl: 'https://placehold.co/600x400.png',
      imageHint: `${listingData.title.split(' ')[1] || 'hair'} ${listingData.title.split(' ')[2] || 'extensions'}`,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (e: any)
   {
    console.error('Failed to create listing', e);
    return { success: false, error: e.message || 'Failed to create listing.' };
  }
}
