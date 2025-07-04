'use client';

import type { HairProfitData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart2, DollarSign, Info, Loader2, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { getMarketComparison } from '@/app/actions';
import type { MarketComparisonOutput } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface PricingCardProps {
  data: HairProfitData;
  onDataChange: (field: keyof HairProfitData, value: any) => void;
  onNumericChange: (field: keyof HairProfitData, value: string) => void;
  unitsRemaining: number;
}

export default function PricingCard({ data, onDataChange, onNumericChange, unitsRemaining }: PricingCardProps) {
  const { sellingPricePerUnit, currency, enableByproductProcessing, hairType } = data;
  const numSellingPricePerUnit = Number(sellingPricePerUnit) || 0;

  const [comparisonResult, setComparisonResult] = useState<MarketComparisonOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  const handleCompareClick = async () => {
    if (!hairType) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter a hair type before comparing.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setComparisonResult(null);

    const result = await getMarketComparison({ hairType, currency });

    setIsLoading(false);
    if (result.success && result.data) {
      setComparisonResult(result.data);
    } else {
      setError(result.error || 'An unexpected error occurred while analyzing the market.');
    }
  };

  const onDialogOpenChange = (open: boolean) => {
    if (!open) {
      setComparisonResult(null);
      setError(null);
      setIsLoading(false);
    }
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
              Set your price or compare with AI-powered market analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog onOpenChange={onDialogOpenChange}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" onClick={handleCompareClick} tabIndex={-1}>
                  <BarChart2 className="mr-2 h-4 w-4" /> Compare to Market
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Market Comparison for "{hairType}"</DialogTitle>
                  <DialogDescription>
                    An AI-powered analysis of typical market prices for this hair type.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 min-h-[200px] flex items-center justify-center">
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-muted-foreground">Contacting market analyst AI...</p>
                    </div>
                  )}
                  {error && (
                    <Alert variant="destructive" className="w-full">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Analysis Failed</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {comparisonResult && (
                    <div className="space-y-4 w-full">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-muted rounded-lg">
                          <Label className="text-muted-foreground">Est. Price Range</Label>
                          <p className="text-2xl font-bold">
                            {formatCurrency(comparisonResult.lowerBoundPrice)} -{' '}
                            {formatCurrency(comparisonResult.upperBoundPrice)}
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <Label className="text-muted-foreground">Confidence</Label>
                          <p className="text-2xl font-bold">
                            {(comparisonResult.confidenceScore * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label>AI Analyst's Notes</Label>
                        <p className="text-sm p-4 bg-muted/50 rounded-lg border max-h-40 overflow-y-auto">
                          {comparisonResult.analysis}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
          </CardContent>
        </div>
      </fieldset>
    </Card>
  );
}
