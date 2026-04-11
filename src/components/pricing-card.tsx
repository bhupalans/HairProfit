'use client';

import type { HairProfitData, MarketComparisonOutput } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Info, Lightbulb, Loader2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

interface PricingCardProps {
  data: HairProfitData;
  onDataChange: (field: keyof HairProfitData, value: any) => void;
  onNumericChange: (field: keyof HairProfitData, value: string) => void;
  unitsRemaining: number;
  onGetAiSuggestion?: () => void;
  isGeneratingSuggestion?: boolean;
  suggestionResult?: MarketComparisonOutput | null;
  description?: string;
}

export default function PricingCard({ 
  data, 
  onDataChange, 
  onNumericChange, 
  unitsRemaining,
  onGetAiSuggestion,
  isGeneratingSuggestion,
  suggestionResult,
  description
}: PricingCardProps) {
  const { sellingPricePerUnit, currency, enableByproductProcessing } = data;
  const numSellingPricePerUnit = Number(sellingPricePerUnit) || 0;

  const formatCurrency = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  return (
    <Card className="relative overflow-hidden">
      <AnimatePresence>
        {enableByproductProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 p-4 text-center backdrop-blur-sm"
          >
            <Info className="mb-4 h-10 w-10 text-primary" />
            <h3 className="mb-1 text-lg font-bold">Pricing Handled by Byproduct</h3>
            <p className="text-sm text-muted-foreground">
              Disable 'Byproduct Processing' to set a price for the main product.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <fieldset disabled={enableByproductProcessing}>
        <div className={cn('transition-filter', enableByproductProcessing && 'blur-[3px]')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-primary" />
              Pricing
            </CardTitle>
            <CardDescription>
              {description || "Set the selling price for your main product."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sellingPricePerUnit">Selling Price (per unit)</Label>
                <Input
                  id="sellingPricePerUnit"
                  type="number"
                  placeholder="e.g., 120"
                  value={sellingPricePerUnit}
                  onChange={(e) => onNumericChange('sellingPricePerUnit', e.target.value)}
                />
              </div>
              <div>
                <Label>Units Remaining</Label>
                <Input
                  readOnly
                  value={`${unitsRemaining.toFixed(0)} units`}
                  className="bg-muted/50"
                />
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <Label className="text-muted-foreground">Overall Selling Price</Label>
              <p className="text-2xl font-bold">
                {formatCurrency(numSellingPricePerUnit * unitsRemaining)}
              </p>
              <p className="text-xs text-muted-foreground">
                Based on {unitsRemaining.toFixed(0)} remaining units.
              </p>
            </div>

            {onGetAiSuggestion && (
                <div className="pt-4 border-t">
                    <Button onClick={onGetAiSuggestion} disabled={isGeneratingSuggestion} className="w-full">
                        {isGeneratingSuggestion ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Market...</>
                        ) : (
                            <><Bot className="mr-2 h-4 w-4" /> Get AI Suggestion</>
                        )}
                    </Button>
                </div>
            )}
            
            {suggestionResult && (
              <Alert className="border-primary/50 bg-primary/5 mt-4">
                <Lightbulb className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">AI Market Analysis</AlertTitle>
                <AlertDescription className="text-foreground/80 space-y-4 !mt-4">
                  <p className="font-semibold text-lg">
                    Suggested Range: {formatCurrency(suggestionResult.lowerBoundPrice)} - {formatCurrency(suggestionResult.upperBoundPrice)}
                  </p>
                  
                  <div>
                    <h3 className="font-semibold mb-1 text-sm">Reasoning</h3>
                    <p className="text-xs leading-relaxed">{suggestionResult.reasoning}</p>
                  </div>

                  <p className="text-xs text-muted-foreground pt-2">Confidence: {(suggestionResult.confidenceScore * 100).toFixed(0)}%</p>
                </AlertDescription>
              </Alert>
            )}

          </CardContent>
        </div>
      </fieldset>
    </Card>
  );
}
