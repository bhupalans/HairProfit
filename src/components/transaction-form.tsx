'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Package, Wrench, Recycle, DollarSign, History, BarChart2, PlusCircle, Trash2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const formSchema = z.object({
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
  nonRemyHairProducts: z.array(
    z.object({
      size: z.string().min(1, 'Size is required.'),
      quantity: z.coerce.number().min(0, 'Quantity must be a positive number.'),
      price: z.coerce.number().min(0, 'Price must be a positive number.'),
    })
  ).optional(),
});

type TransactionFormValues = z.infer<typeof formSchema>;

export function TransactionForm() {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hairType: '',
      purchaseQuantity: 100,
      purchasePrice: 50,
      currency: 'USD',
      processingSteps: [{ name: 'Coloring', expense: 250, wastage: 5 }],
      sellingPricePerUnit: 120,
      enableByproductProcessing: false,
      chowryProcessingCost: 10,
      nonRemyHairProducts: [{ size: '5-10', quantity: 10, price: 20 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'processingSteps',
  });

  const { fields: nonRemyFields, append: appendNonRemy, remove: removeNonRemy } = useFieldArray({
    control: form.control,
    name: 'nonRemyHairProducts',
  });

  const watchedValues = form.watch();

  const purchaseQuantity = Number(watchedValues.purchaseQuantity || 0);
  const purchasePrice = Number(watchedValues.purchasePrice || 0);
  const sellingPricePerUnit = Number(watchedValues.sellingPricePerUnit || 0);
  const enableByproductProcessing = watchedValues.enableByproductProcessing;

  const totalWastageUnits = (watchedValues.processingSteps || []).reduce(
    (acc, step) => acc + Number(step.wastage || 0),
    0
  );
  
  const unitsRemaining = Math.max(0, purchaseQuantity - totalWastageUnits);

  const totalPurchaseCost = purchaseQuantity * purchasePrice;

  const totalProcessingCost = (watchedValues.processingSteps || []).reduce(
    (acc, step) => acc + Number(step.expense || 0),
    0
  );

  const chowryProcessingCostPerUnit = Number(watchedValues.chowryProcessingCost || 0);
  const totalChowryProcessingCost = enableByproductProcessing ? chowryProcessingCostPerUnit * unitsRemaining : 0;
  
  const nonRemyHairProducts = watchedValues.nonRemyHairProducts || [];
  const assignedNonRemyQuantity = nonRemyHairProducts.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
  const nonRemyRevenue = nonRemyHairProducts.reduce((acc, p) => acc + Number(p.quantity || 0) * Number(p.price || 0), 0);
  
  const grandTotalCost = totalPurchaseCost + totalProcessingCost + totalChowryProcessingCost;
  
  const totalRevenue = enableByproductProcessing ? nonRemyRevenue : sellingPricePerUnit * unitsRemaining;
  
  const projectedProfit = totalRevenue - grandTotalCost;

  const profitMargin =
    grandTotalCost > 0 ? (projectedProfit / grandTotalCost) * 100 : totalRevenue > 0 ? 100 : 0;
    
  const formatCurrency = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: watchedValues.currency || 'USD' }).format(value);
  }

  return (
    <Form {...form}>
      <form>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-primary" />
                  Purchase Details
                </CardTitle>
                <CardDescription>Enter the initial product information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="hairType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hair Type / Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Brazilian Body Wave" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="purchaseQuantity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity (units)</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price (per unit)</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 50" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Wrench className="h-6 w-6 text-primary" />
                  Processing Steps
                </CardTitle>
                <CardDescription>Add costs and wastage for processing and treatments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <AnimatePresence>
                    {fields.map((field, index) => (
                      <motion.div key={field.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="grid grid-cols-[1fr,auto,auto,auto] items-end gap-2">
                        <FormField control={form.control} name={`processingSteps.${index}.name`} render={({ field }) => (
                          <FormItem><FormLabel>Process Name</FormLabel><FormControl><Input placeholder="e.g., Coloring" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`processingSteps.${index}.expense`} render={({ field }) => (
                          <FormItem><FormLabel>Expense ({watchedValues.currency})</FormLabel><FormControl><Input type="number" className="w-28" placeholder="e.g., 250" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`processingSteps.${index}.wastage`} render={({ field }) => (
                          <FormItem><FormLabel>Wastage (units)</FormLabel><FormControl><Input type="number" className="w-28" placeholder="e.g., 5" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', expense: 0, wastage: 0 })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Processing Step
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Recycle className="h-6 w-6 text-primary" />
                  Chowry (Byproduct) Processing
                </CardTitle>
                <CardDescription>Optionally, process remaining units into sellable non-remy hair.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField control={form.control} name="enableByproductProcessing" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <FormLabel className="text-base m-0">Enable Byproduct Processing</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <AnimatePresence>
                    {enableByproductProcessing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 overflow-hidden"
                      >
                        <FormField control={form.control} name="chowryProcessingCost" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chowry Processing Cost (per unit)</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">This cost is applied to each unit remaining after initial wastage.</p>
                          </FormItem>
                        )} />
                        
                        <div className="space-y-4">
                            <Label className="font-medium">Non-Remy Hair Products</Label>
                            <div className="space-y-3">
                              <AnimatePresence>
                                {nonRemyFields.map((field, index) => (
                                  <motion.div key={field.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-[1fr,1fr,1fr,auto] items-end gap-2">
                                      <FormField control={form.control} name={`nonRemyHairProducts.${index}.size`} render={({ field }) => (
                                          <FormItem><FormLabel className="text-xs">Size (in)</FormLabel><FormControl><Input placeholder="5-10" {...field} /></FormControl><FormMessage /></FormItem>
                                      )} />
                                      <FormField control={form.control} name={`nonRemyHairProducts.${index}.quantity`} render={({ field }) => (
                                          <FormItem><FormLabel className="text-xs">Qty (units)</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>
                                      )} />
                                      <FormField control={form.control} name={`nonRemyHairProducts.${index}.price`} render={({ field }) => (
                                          <FormItem><FormLabel className="text-xs">Price/unit</FormLabel><FormControl><Input type="number" placeholder="20" {...field} /></FormControl><FormMessage /></FormItem>
                                      )} />
                                      <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeNonRemy(index)}><Trash2 className="h-4 w-4" /></Button>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => appendNonRemy({ size: '', quantity: 0, price: 0 })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Non-Remy Hair Size
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className={cn("p-4 rounded-lg text-center", assignedNonRemyQuantity > unitsRemaining ? 'bg-destructive/20' : 'bg-muted/50')}>
                                <Label className="text-muted-foreground">Total Units Available</Label>
                                <p className="text-2xl font-bold">{unitsRemaining.toFixed(2)}</p>
                            </div>
                             <div className={cn("p-4 rounded-lg text-center", assignedNonRemyQuantity > unitsRemaining ? 'bg-destructive/20' : 'bg-muted/50')}>
                                <Label className="text-muted-foreground">Quantity Assigned</Label>
                                <p className="text-2xl font-bold">{assignedNonRemyQuantity.toFixed(2)}</p>
                            </div>
                        </div>
                         {assignedNonRemyQuantity > unitsRemaining && (
                            <p className="text-sm text-destructive text-center">Assigned quantity cannot exceed available units.</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <fieldset disabled={enableByproductProcessing} className="space-y-8">
              <Card className={cn(enableByproductProcessing && "bg-muted/50")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-primary" />
                    Pricing
                  </CardTitle>
                  <CardDescription>Set your price for the primary product. Disabled when byproduct processing is active.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full"><BarChart2 className="mr-2 h-4 w-4" /> Compare to Market</Button>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="sellingPricePerUnit" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price (per unit)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 120" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div>
                        <Label>Units Remaining</Label>
                        <Input readOnly value={`${unitsRemaining.toFixed(2)} units`} className="bg-muted/50" />
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                      <Label className="text-muted-foreground">Overall Selling Price</Label>
                      <p className="text-2xl font-bold">{formatCurrency(sellingPricePerUnit * unitsRemaining)}</p>
                      <p className="text-xs text-muted-foreground">Based on {unitsRemaining.toFixed(2)} remaining units.</p>
                  </div>
                </CardContent>
              </Card>
            </fieldset>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <History className="h-6 w-6 text-primary" />
                  Summary
                </CardTitle>
                <CardDescription>Your cost and profit breakdown.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Total Purchase Cost</span><span className="font-medium">{formatCurrency(totalPurchaseCost)}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Total Processing Cost</span><span className="font-medium">{formatCurrency(totalProcessingCost)}</span></div>
                <AnimatePresence>
                  {enableByproductProcessing && (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Total Chowry Cost</span><span className="font-medium">{formatCurrency(totalChowryProcessingCost)}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Separator />
                <div className="flex justify-between items-center font-bold text-base"><span >Grand Total Cost</span><span>{formatCurrency(grandTotalCost)}</span></div>
                <div className="flex justify-between items-center font-bold text-base"><span className="text-green-600">Total Revenue</span><span className="text-green-600">{formatCurrency(totalRevenue)}</span></div>
                <Separator />
                <div className="flex justify-between items-center font-bold text-lg"><span >Projected Profit</span><span className={projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(projectedProfit)}</span></div>
                <div className="flex justify-between items-center font-bold text-lg"><span >Profit Margin</span><span className={profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>{profitMargin.toFixed(2)}%</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
