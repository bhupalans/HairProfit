'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { TransactionData } from '@/types';
import {
  ShoppingCart,
  Wrench,
  Calculator,
  PlusCircle,
  Trash2,
  Save,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const formSchema = z.object({
  purchaseQuantity: z.coerce
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Quantity must be at least 1.'),
  purchasePrice: z.coerce
    .number({ invalid_type_error: 'Must be a number' })
    .min(0.01, 'Price must be positive.'),
  processingSteps: z.array(
    z.object({
      name: z.string().min(1, 'Step name is required.'),
      cost: z.coerce
        .number({ invalid_type_error: 'Must be a number' })
        .min(0, 'Cost cannot be negative.'),
      wastage: z.coerce
        .number({ invalid_type_error: 'Must be a number' })
        .min(0, 'Wastage must be between 0 and 100.')
        .max(100, 'Wastage must be between 0 and 100.'),
    })
  ),
  sellingPrice: z.coerce
    .number({ invalid_type_error: 'Must be a number' })
    .min(0.01, 'Selling price must be positive.'),
});

type TransactionFormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  onSaveTransaction: (data: TransactionData) => void;
}

export function TransactionForm({ onSaveTransaction }: TransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchaseQuantity: 1,
      purchasePrice: undefined,
      processingSteps: [],
      sellingPrice: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'processingSteps',
  });

  const watchedValues = form.watch();

  const purchaseCost =
    (watchedValues.purchaseQuantity || 0) * (watchedValues.purchasePrice || 0);

  const processingCost = (watchedValues.processingSteps || []).reduce(
    (acc, step) => acc + (step.cost || 0),
    0
  );

  let cumulativeQuantity = watchedValues.purchaseQuantity || 0;
  let totalQuantityLost = 0;
  (watchedValues.processingSteps || []).forEach(step => {
    const wastagePercent = step.wastage || 0;
    if (cumulativeQuantity > 0 && wastagePercent > 0) {
      const quantityLost = cumulativeQuantity * (wastagePercent / 100);
      totalQuantityLost += quantityLost;
      cumulativeQuantity -= quantityLost;
    }
  });

  const wastageCost = totalQuantityLost * (watchedValues.purchasePrice || 0);

  const totalCost = purchaseCost + processingCost + wastageCost;
  const profit = (watchedValues.sellingPrice || 0) - totalCost;
  const margin =
    totalCost > 0 ? (profit / totalCost) * 100 : (watchedValues.sellingPrice || 0) > 0 ? 100 : 0;
    
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const onSubmit = (data: TransactionFormValues) => {
    onSaveTransaction(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>New Transaction</CardTitle>
            <CardDescription>
              Enter the details below to calculate cost and profit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <fieldset className="space-y-4">
              <legend className="text-lg font-medium flex items-center gap-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Purchase
              </legend>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchaseQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Item ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 15.50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>

            <Separator />

            <fieldset className="space-y-4">
              <legend className="text-lg font-medium flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Processing
              </legend>
              <div className="space-y-4">
                <AnimatePresence>
                  {fields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-end gap-2"
                    >
                      <FormField
                        control={form.control}
                        name={`processingSteps.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-grow">
                            <FormLabel>Step Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Treatment" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name={`processingSteps.${index}.cost`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost ($)</FormLabel>
                            <FormControl>
                              <Input type="number" className="w-24" placeholder="e.g., 5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`processingSteps.${index}.wastage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wastage (%)</FormLabel>
                            <FormControl>
                              <Input type="number" className="w-24" placeholder="e.g., 10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', cost: 0, wastage: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Processing Step
              </Button>
            </fieldset>

            <Separator />

            <div>
              <div className="text-lg font-medium flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-primary" />
                Profit Calculation
              </div>
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Purchase Cost</span>
                  <span className="font-medium">{formatCurrency(purchaseCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Processing Cost</span>
                  <span className="font-medium">{formatCurrency(processingCost)}</span>
                </div>
                 <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Wastage Cost</span>
                  <span className="font-medium">{formatCurrency(wastageCost)}</span>
                </div>
                 <Separator/>
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total Cost</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="sellingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium">Selling Price ($)</FormLabel>
                   <FormControl>
                        <Input type="number" placeholder="e.g., 50.00" {...field} className="text-base py-6" />
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2 p-4 bg-primary/10 rounded-lg">
                <div className="flex justify-between items-center font-bold text-xl">
                  <span>Profit</span>
                  <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(profit)}</span>
                </div>
                 <div className="flex justify-between items-center text-muted-foreground">
                  <span>Profit Margin</span>
                  <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>{margin.toFixed(2)}%</span>
                </div>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6">
              <Save className="mr-2 h-5 w-5" />
              Save Transaction
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
