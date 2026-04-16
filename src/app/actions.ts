import {
  runMarketComparison,
} from '@/ai/flows/market-comparison-flow';
import { runBuyerAnalysis } from '@/ai/flows/buyer-analysis-flow';
import { getFxRates, lastUpdated } from '@/lib/fx';
import type { MarketComparisonInput, MarketComparisonOutput, BuyerAnalysisOutput, MarketplaceListing, MarketplaceListingFormData } from '@/types';

import { db, auth } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, getDoc, updateDoc, where, deleteDoc } from 'firebase/firestore';

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

      // Mapping normalized fields for backward compatibility
      let listingType = data.type;
      if (listingType === 'For Sale') listingType = 'sell';
      if (listingType === 'Looking to Buy') listingType = 'buy';

      listings.push({
        id: doc.id,
        type: listingType,
        title: data.title,
        description: data.description,
        price: data.price, // Might be number or string
        currency: data.currency,
        unit: data.unit,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        imageUrls: imageUrls,
        imageHint: data.imageHint,
        userId: data.userId,
        status: data.status || 'active',
        createdAt: createdAt,
        contact: data.contact, // Fallback
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

      // Mapping normalized fields
      let listingType = data.type;
      if (listingType === 'For Sale') listingType = 'sell';
      if (listingType === 'Looking to Buy') listingType = 'buy';

      const listing: MarketplaceListing = {
        id: docSnap.id,
        type: listingType,
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency,
        unit: data.unit,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        imageUrls: imageUrls,
        imageHint: data.imageHint,
        userId: data.userId,
        status: data.status || 'active',
        createdAt: createdAt,
        contact: data.contact,
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
    
    if (!listingData.userId) {
      throw new Error('User authentication is required to create a listing.');
    }

    // A simple way to get more relevant keywords for the image hint
    const titleWords = listingData.title.toLowerCase().replace(/[^a-z\s]/gi, '').split(' ');
    const commonWords = new Set(['hair', 'for', 'sale', 'and', 'the', 'a', 'in', 'to', 'buy', 'looking']);
    const keywords = titleWords.filter(word => word && !commonWords.has(word));
    const imageHint = `${keywords[0] || 'hair'} ${keywords[1] || 'product'}`;
    
    // No await here to leverage instant local cache update for responsive UI
    addDoc(listingsRef, {
      title: listingData.title,
      description: listingData.description,
      type: listingData.type,
      price: listingData.price,
      currency: listingData.currency,
      unit: listingData.unit,
      contactEmail: listingData.contactEmail,
      contactPhone: listingData.contactPhone || null,
      imageUrls: listingData.imageUrls || [],
      imageHint: imageHint,
      userId: listingData.userId,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(error => {
      console.error('Firestore write failed in background:', error);
    });

    return { success: true };
  } catch (e: any) {
    console.error('Failed to initiate listing creation:', e);
    return { success: false, error: e.message || 'Failed to create listing.' };
  }
}

export async function updateListingStatus(listingId: string, status: 'active' | 'sold' | 'fulfilled'): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, 'listings', listingId);
    updateDoc(docRef, {
      status: status,
      updatedAt: serverTimestamp(),
    }).catch(error => console.error('Status update failed:', error));
    return { success: true };
  } catch (e: any) {
    console.error('Failed to update status', e);
    return { success: false, error: e.message };
  }
}

export async function deleteListing(listingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, 'listings', listingId);
    deleteDoc(docRef).catch(error => console.error('Delete failed:', error));
    return { success: true };
  } catch (e: any) {
    console.error('Failed to delete listing', e);
    return { success: false, error: e.message };
  }
}

// Bookmark Actions
export async function addBookmark(userId: string, listingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const bookmarksRef = collection(db, 'bookmarks');
    addDoc(bookmarksRef, {
      userId,
      listingId,
      createdAt: serverTimestamp(),
    }).catch(error => console.error('Bookmark add failed:', error));
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function removeBookmark(userId: string, listingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const bookmarksRef = collection(db, 'bookmarks');
    const q = query(bookmarksRef, where('userId', '==', userId), where('listingId', '==', listingId));
    getDocs(q).then(querySnapshot => {
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      return Promise.all(deletePromises);
    }).catch(error => console.error('Bookmark removal failed:', error));
    
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getUserBookmarks(userId: string): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const bookmarksRef = collection(db, 'bookmarks');
    const q = query(bookmarksRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const listingIds = querySnapshot.docs.map(doc => doc.data().listingId as string);
    return { success: true, data: listingIds };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
