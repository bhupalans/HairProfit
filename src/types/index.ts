import * as z from 'zod';

export const transactionSchema = z.object({
  hairType: z.string().min(1, 'Hair type is required.'),
  purchaseQuantity: z.coerce.number().min(0, 'Quantity must be a positive number.'),
  purchasePrice: z.coerce.number().min(0, 'Price must be a positive number.'),
  currency: z.string().min(2, 'A currency must be selected.'),
  processingSteps: z.array(
    z.object({
      name: z.string().min(1, 'Step name is required.'),
      expense: z.coerce.number().min(0, 'Expense cannot be negative.'),
      wastage: z.coerce.number().min(0, 'Wastage cannot be negative.'),
    })
  ),
  sellingPricePerUnit: z.coerce.number().min(0, 'Selling price must be a positive number.'),
  enableByproductProcessing: z.boolean().default(false),
  chowryProcessingCost: z.coerce.number().min(0, 'Cost must be a positive number.').optional(),
  nonRemyHairProducts: z
    .array(
      z.object({
        size: z.string().min(1, 'Size is required.'),
        quantity: z.coerce.number().min(0, 'Quantity must be a positive number.'),
        price: z.coerce.number().min(0, 'Price must be a positive number.'),
      })
    )
    .optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export interface Transaction extends TransactionFormValues {
  id: string;
  totalCost: number;
  profit: number;
  margin: number;
}
