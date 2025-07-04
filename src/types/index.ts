export interface ProcessingStep {
  name: string;
  cost: number;
  wastage: number;
}

export interface TransactionData {
  hairType: string;
  purchaseQuantity: number;
  purchasePrice: number;
  currency: string;
  processingSteps: ProcessingStep[];
  sellingPrice: number;
}

export interface Transaction extends TransactionData {
  id: string;
  totalCost: number;
  profit: number;
  margin: number;
}
