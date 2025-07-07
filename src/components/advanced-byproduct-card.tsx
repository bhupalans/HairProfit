'use client';

import type { HairProfitData, NonRemyHairProduct } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusCircle, Recycle, Trash2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AdvancedByproductCardProps {
  data: HairProfitData;
  currency: string;
  onDataChange: (field: keyof HairProfitData, value: any) => void;
  onNumericChange: (field: keyof HairProfitData, value: string) => void;
  onProductChange: (index: number, field: keyof Omit<NonRemyHairProduct, 'id' | 'price'>, value: string | number) => void;
  onAddProduct: () => void;
  onRemoveProduct: (index: number) => void;
  unitsRemaining: number;
  assignedNonRemyQuantity: number;
  processedNonRemyProducts: (NonRemyHairProduct & { calculatedPrice: number })[];
}

export default function AdvancedByproductCard({
  data,
  currency,
  onDataChange,
  onNumericChange,
  onProductChange,
  onAddProduct,
  onRemoveProduct,
  unitsRemaining,
  assignedNonRemyQuantity,
  processedNonRemyProducts,
}: AdvancedByproductCardProps) {
  const { 
    enableByproductProcessing, 
    byproductProcessingCost, 
    targetByproductMargin,
    byproductPriceIncreasePerInch,
    byproductLowStockThreshold,
    byproductScarcityPremium,
  } = data;
  const isMobile = useIsMobile();
  
  const formatCurrency = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  const HelpInfo = ({ title, mobileTitle, children }: { title: string, mobileTitle?: string, children: React.ReactNode }) => {
    if (isMobile) {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 cursor-help" type="button">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{mobileTitle || title}</DialogTitle>
              <DialogDescription className="pt-2 text-base">{children}</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
    }
    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 cursor-help" type="button">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{children}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Recycle className="h-6 w-6 text-primary" />
          Chowry (Byproduct) Processing
        </CardTitle>
        <CardDescription>
          Process remaining units into sellable non-remy hair with automated, tiered pricing.
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
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <h3 className="text-lg font-medium text-center">Byproduct Pricing Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="byproduct-cost">Processing Cost (per unit)</Label>
                        <Input
                        id="byproduct-cost"
                        type="number"
                        value={byproductProcessingCost}
                        onChange={(e) => onNumericChange('byproductProcessingCost', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="target-margin">Target Profit Margin (%)</Label>
                        <Input
                            id="target-margin"
                            type="number"
                            value={targetByproductMargin}
                            onChange={(e) => onNumericChange('targetByproductMargin', e.target.value)}
                            placeholder="e.g. 30"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Label htmlFor="increase-per-inch">Price Increase per Inch (%)</Label>
                          <HelpInfo title="Price Increase per Inch (%)">Additional % to add to the price for every inch longer than the shortest size.</HelpInfo>
                        </div>
                        <Input
                            id="increase-per-inch"
                            type="number"
                            value={byproductPriceIncreasePerInch}
                            onChange={(e) => onNumericChange('byproductPriceIncreasePerInch', e.target.value)}
                            placeholder="e.g. 3"
                        />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Label htmlFor="low-stock-threshold">Low Stock Threshold (units)</Label>
                        <HelpInfo title="Low Stock Threshold">If a size's quantity is below this, the scarcity premium is applied.</HelpInfo>
                      </div>
                      <Input
                          id="low-stock-threshold"
                          type="number"
                          value={byproductLowStockThreshold}
                          onChange={(e) => onNumericChange('byproductLowStockThreshold', e.target.value)}
                          placeholder="e.g. 10"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Label htmlFor="scarcity-premium">Scarcity Premium (%)</Label>
                        <HelpInfo title="Scarcity Premium (%)">Additional % to add to the price for items below the low stock threshold.</HelpInfo>
                      </div>
                      <Input
                          id="scarcity-premium"
                          type="number"
                          value={byproductScarcityPremium}
                          onChange={(e) => onNumericChange('byproductScarcityPremium', e.target.value)}
                          placeholder="e.g. 15"
                      />
                    </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="font-medium">Non-Remy Hair Products</Label>
                <div className="space-y-3">
                  <AnimatePresence>
                    {processedNonRemyProducts.map((product, index) => (
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
                            placeholder="e.g., 8 or 8-10"
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
                        <div className="flex-1 min-w-[120px]">
                           <Label className="text-xs">Suggested Price/unit</Label>
                           <Input
                              readOnly
                              value={formatCurrency(product.calculatedPrice)}
                              className="bg-primary/10 border-dashed text-primary font-semibold"
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
