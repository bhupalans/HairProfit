
'use client';

import { useState, useEffect } from 'react';
import type { HairProfitData, NonRemyHairProduct } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusCircle, Recycle, Trash2, HelpCircle, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AdvancedAIByproductCardProps {
  data: HairProfitData;
  currency: string;
  onDataChange: (field: keyof HairProfitData, value: any) => void;
  onNumericChange: (field: keyof HairProfitData, value: string) => void;
  onProductChange: (index: number, field: keyof Omit<NonRemyHairProduct, 'id' >, value: string | number) => void;
  onAddProduct: () => void;
  onRemoveProduct: (index: number) => void;
  unitsRemaining: number;
  assignedNonRemyQuantity: number;
  processedNonRemyProducts: (NonRemyHairProduct & { calculatedPrice: number })[];
  onAISuggest: () => void;
  isAISuggesting: boolean;
}

export default function AdvancedAIByproductCard({
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
  onAISuggest,
  isAISuggesting
}: AdvancedAIByproductCardProps) {
  const { 
    enableByproductProcessing, 
    byproductProcessingCost, 
    targetByproductMargin,
    byproductPriceIncreasePerInch,
    byproductLowStockThreshold,
    byproductScarcityPremium,
    byproductName,
  } = data;
  const isMobile = useIsMobile();

  const [byproductType, setByproductType] = useState(() => {
    const options = ["Non-Remy Hair", "Remy Hair", "Wigs", "Hair Extensions"];
    if (!byproductName || options.includes(byproductName)) {
      return byproductName || "Non-Remy Hair";
    }
    return "Other";
  });
  const [customName, setCustomName] = useState(() => {
    const options = ["Non-Remy Hair", "Remy Hair", "Wigs", "Hair Extensions"];
    return options.includes(byproductName || "") ? "" : (byproductName || "");
  });

  const finalByproductName = byproductType === "Other" ? customName : byproductType;

  useEffect(() => {
    onDataChange('byproductName', finalByproductName);
  }, [finalByproductName, onDataChange]);
  
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <Recycle className="h-6 w-6 text-primary" />
            AI Byproduct Processing
          </CardTitle>
          {enableByproductProcessing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAISuggest} 
              disabled={isAISuggesting || processedNonRemyProducts.length === 0}
              className="hidden sm:flex"
            >
              {isAISuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
              AI Suggest Pricing
            </Button>
          )}
        </div>
        <CardDescription>
          Automated byproduct pricing using an anchor model and optional AI guidance.
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
                <h3 className="text-lg font-medium text-center">Byproduct Logic Controls</h3>
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
                    <div>
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
                <div className="sm:hidden pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={onAISuggest} 
                    disabled={isAISuggesting || processedNonRemyProducts.length === 0}
                  >
                    {isAISuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    AI Suggest Pricing
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{finalByproductName + " Products"}</Label>
                  <span className="text-[10px] text-muted-foreground italic uppercase">Override any row to set it as the price anchor</span>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {processedNonRemyProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "flex flex-wrap items-end gap-3 rounded-lg border p-3 transition-colors",
                          Number(product.price) > 0 ? "bg-primary/5 border-primary/30" : "bg-muted/20"
                        )}
                      >
                        <div className="flex-1 min-w-[80px]">
                          <Label htmlFor={`nr-size-${index}`} className="text-xs">Size (in)</Label>
                          <Input
                            id={`nr-size-${index}`}
                            placeholder="e.g., 8"
                            value={product.size}
                            onChange={(e) => onProductChange(index, 'size', e.target.value)}
                          />
                        </div>
                        <div className="flex-1 min-w-[80px]">
                          <Label htmlFor={`nr-quantity-${index}`} className="text-xs">Qty</Label>
                          <Input
                            id={`nr-quantity-${index}`}
                            type="number"
                            placeholder="10"
                            value={product.quantity}
                            onChange={(e) => onProductChange(index, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="flex-1 min-w-[100px]">
                          <Label htmlFor={`nr-price-${index}`} className="text-xs">Manual Price (Anchor)</Label>
                          <Input
                            id={`nr-price-${index}`}
                            type="number"
                            placeholder="Anchor"
                            value={product.price}
                            onChange={(e) => onProductChange(index, 'price', e.target.value)}
                            className={cn(Number(product.price) > 0 && "border-primary focus-visible:ring-primary")}
                          />
                        </div>
                        <div className="flex-1 min-w-[110px]">
                           <Label className="text-xs">Final Price/unit</Label>
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
                  <PlusCircle className="mr-2 h-4 w-4" /> Add {finalByproductName} Size
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
