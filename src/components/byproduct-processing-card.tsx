
'use client';

import { useState, useEffect } from 'react';
import type { HairProfitData, NonRemyHairProduct } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusCircle, Recycle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ByproductProcessingCardProps {
  data: HairProfitData;
  onDataChange: (field: keyof HairProfitData, value: any) => void;
  onNumericChange: (field: keyof HairProfitData, value: string) => void;
  onProductChange: (index: number, field: keyof Omit<NonRemyHairProduct, 'id'>, value: string | number) => void;
  onAddProduct: () => void;
  onRemoveProduct: (index: number) => void;
  unitsRemaining: number;
  assignedNonRemyQuantity: number;
}

export default function ByproductProcessingCard({
  data,
  onDataChange,
  onNumericChange,
  onProductChange,
  onAddProduct,
  onRemoveProduct,
  unitsRemaining,
  assignedNonRemyQuantity
}: ByproductProcessingCardProps) {
  const { enableByproductProcessing, byproductProcessingCost, nonRemyHairProducts = [], byproductName } = data;

  const [byproductType, setByproductType] = useState(byproductName || "Non-Remy Hair");
  const [customName, setCustomName] = useState("");

  const finalByproductName = byproductType === "Other" ? customName : byproductType;

  useEffect(() => {
    onDataChange('byproductName', finalByproductName);
  }, [finalByproductName, onDataChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Recycle className="h-6 w-6 text-primary" />
          Chowry (Byproduct) Processing
        </CardTitle>
        <CardDescription>
          Optionally, process remaining units into sellable non-remy hair.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <Label htmlFor="byproduct-switch" className="text-base m-0">
            Enable Byproduct Processing
          </Label>
          <Switch
            id="byproduct-switch"
            checked={enableByproductProcessing}
            onCheckedChange={(checked) => onDataChange('enableByproductProcessing', checked)}
          />
        </div>

        <AnimatePresence>
          {enableByproductProcessing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="byproduct-cost">Byproduct Processing Cost (per unit)</Label>
                  <Input
                    id="byproduct-cost"
                    type="number"
                    value={byproductProcessingCost}
                    onChange={(e) => onNumericChange('byproductProcessingCost', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This cost is applied to each remaining unit to process it into a different sellable product.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Byproduct Category</Label>
                  <div className="flex flex-col gap-2">
                    <select
                      value={byproductType}
                      onChange={(e) => setByproductType(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option>Non-Remy Hair</option>
                      <option>Remy Hair</option>
                      <option>Wigs</option>
                      <option>Hair Extensions</option>
                      <option>Other</option>
                    </select>
                    {byproductType === "Other" && (
                      <Input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Enter custom product name"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="font-medium">{finalByproductName + " Products"}</Label>
                <div className="space-y-3">
                  <AnimatePresence>
                    {nonRemyHairProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-3"
                      >
                        <div className="flex-1 min-w-[100px]">
                          <Label htmlFor={`nr-size-${index}`} className="text-xs">Size (in)</Label>
                          <Input
                            id={`nr-size-${index}`}
                            placeholder="5-10"
                            value={product.size}
                            onChange={(e) => onProductChange(index, 'size', e.target.value)}
                          />
                        </div>
                        <div className="flex-1 min-w-[100px]">
                          <Label htmlFor={`nr-quantity-${index}`} className="text-xs">Qty (units)</Label>
                          <Input
                            id={`nr-quantity-${index}`}
                            type="number"
                            placeholder="10"
                            value={product.quantity}
                            onChange={(e) => onProductChange(index, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="flex-1 min-w-[100px]">
                          <Label htmlFor={`nr-price-${index}`} className="text-xs">Price/unit</Label>
                          <Input
                            id={`nr-price-${index}`}
                            type="number"
                            placeholder="20"
                            value={product.price}
                            onChange={(e) => onProductChange(index, 'price', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => onRemoveProduct(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={onAddProduct}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Non-Remy Hair Size
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className={cn(
                    'p-4 rounded-lg text-center',
                    assignedNonRemyQuantity > unitsRemaining ? 'bg-destructive/20' : 'bg-muted/50'
                  )}
                >
                  <Label className="text-muted-foreground">Total Units Available</Label>
                  <p className="text-2xl font-bold">{unitsRemaining.toFixed(0)}</p>
                </div>
                <div
                  className={cn(
                    'p-4 rounded-lg text-center',
                    assignedNonRemyQuantity > unitsRemaining ? 'bg-destructive/20' : 'bg-muted/50'
                  )}
                >
                  <Label className="text-muted-foreground">Quantity Assigned</Label>
                  <p className="text-2xl font-bold">{assignedNonRemyQuantity.toFixed(0)}</p>
                </div>
              </div>
              {assignedNonRemyQuantity > unitsRemaining && (
                <p className="text-sm text-destructive text-center">
                  Assigned quantity cannot exceed available units.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
