export interface ProcessingStep {
  name: string;
  expense: number;
  wastage: number; // in units, not percentage
}

export interface NonRemyHairProduct {
  size: string;
  quantity: number;
  price: number;
}

export interface TransactionData {
  hairType: string;
  purchaseQuantity: number;
  purchasePrice: number;
  currency: string;
  processingSteps: ProcessingStep[];
  sellingPricePerUnit: number;
  enableByproductProcessing: boolean;
  chowryProcessingCost?: number;
  nonRemyHairProducts?: NonRemyHairProduct[];
}

// Kept for compatibility with other components that might exist, though the main view no longer creates a list of transactions.
export interface Transaction extends TransactionData {
  id: string;
  totalCost: number;
  profit: number;
  margin: number;
}
