'use server';

import {
  runMarketComparison,
} from '@/ai/flows/market-comparison-flow';
import { runBuyerAnalysis } from '@/ai/flows/buyer-analysis-flow';
import { getFxRates, lastUpdated } from '@/lib/fx';
import type { MarketComparisonInput, MarketComparisonOutput, BuyerAnalysisOutput, MarketplaceListing, MarketplaceListingFormData } from '@/types';

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

export async function fetchExchangeRate(input: {
  baseCurrency: string;
  targetCurrency: string;
}): Promise<{ success: boolean; data?: { rate: number }; error?: string }> {
  try {
    const { baseCurrency, targetCurrency } = input;

    const rates = await getFxRates();

    const baseRate = rates[baseCurrency];
    const targetRate = rates[targetCurrency];

    if (!baseRate) {
      throw new Error(`Missing rate for ${baseCurrency}`);
    }

    if (!targetRate) {
      throw new Error(`Missing rate for ${targetCurrency}`);
    }

    /**
     * IMPORTANT:
     * UI shows: "Rate (1 INR = ?)"
     * So we calculate:
     * 1 baseCurrency = ? targetCurrency
     */
    const rate = targetRate / baseRate;

    return {
      success: true,
      data: {
        rate,
	lastUpdated,
      },
    };
  } catch (e: any) {
    console.error("Exchange rate API failed", e);

    return {
      success: false,
      error: e.message || "Unknown error",
    };
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
      const createdAt = data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      
      // Backward compatibility for old records with single imageUrl
      const imageUrls = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);

      listings.push({
        id: doc.id,
        type: data.type,
        title: data.title,
        description: data.description,
        price: data.price,
        imageUrls: imageUrls,
        imageHint: data.imageHint,
        contact: data.contact,
        createdAt: createdAt,
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
      const createdAt = data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      
      // Backward compatibility for old records with single imageUrl
      const imageUrls = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);

      const listing: MarketplaceListing = {
        id: docSnap.id,
        type: data.type,
        title: data.title,
        description: data.description,
        price: data.price,
        imageUrls: imageUrls,
        imageHint: data.imageHint,
        contact: data.contact,
        createdAt: createdAt,
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
    
    // A simple way to get more relevant keywords for the image hint
    const titleWords = listingData.title.toLowerCase().replace(/[^a-z\s]/gi, '').split(' ');
    const commonWords = new Set(['hair', 'for', 'sale', 'and', 'the', 'a', 'in', 'to', 'buy', 'looking']);
    const keywords = titleWords.filter(word => word && !commonWords.has(word));
    const imageHint = `${keywords[0] || 'hair'} ${keywords[1] || 'product'}`;
    
    await addDoc(listingsRef, {
      ...listingData,
      imageUrls: listingData.imageUrls || [],
      imageHint: imageHint,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (e: any) {
    console.error('Failed to create listing', e);
    return { success: false, error: e.message || 'Failed to create listing.' };
  }
}
