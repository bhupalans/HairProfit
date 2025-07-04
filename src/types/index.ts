export interface ProcessingStep {
  name: string;
  cost: number;
}

export interface TransactionData {
  purchaseQuantity: number;
  purchasePrice: number;
  processingSteps: ProcessingStep[];
  sellingPrice: number;
}

export interface Transaction extends TransactionData {
  id: string;
  totalCost: number;
  profit: number;
  margin: number;
}
