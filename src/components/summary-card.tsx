'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { History } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface SummaryCardProps {
  currency: string;
  totalPurchaseCost: number;
  totalProcessingCost: number;
  totalWastageCost: number;
  enableByproductProcessing: boolean;
  totalByproductProcessingCost: number;
  grandTotalCost: number;
  totalRevenue: number;
  projectedProfit: number;
  profitMargin: number;
}

export default function SummaryCard({
  currency,
  totalPurchaseCost,
  totalProcessingCost,
  totalWastageCost,
  enableByproductProcessing,
  totalByproductProcessingCost,
  grandTotalCost,
  totalRevenue,
  projectedProfit,
  profitMargin,
}: SummaryCardProps) {
  const formatCurrency = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <History className="h-6 w-6 text-primary" />
          Summary
        </CardTitle>
        <CardDescription>Your cost and profit breakdown.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Total Purchase Cost</span>
          <span className="font-medium">{formatCurrency(totalPurchaseCost)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Total Processing Cost</span>
          <span className="font-medium">{formatCurrency(totalProcessingCost)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Total Wastage Cost</span>
          <span className="font-medium text-red-600">({formatCurrency(totalWastageCost)})</span>
        </div>
        <AnimatePresence>
          {enableByproductProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-between items-center text-sm"
            >
              <span className="text-muted-foreground">Byproduct Processing Cost</span>
              <span className="font-medium">{formatCurrency(totalByproductProcessingCost)}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <Separator />
        <div className="flex justify-between items-center font-bold text-base">
          <span>Grand Total Cost</span>
          <span>{formatCurrency(grandTotalCost)}</span>
        </div>
        <div className="flex justify-between items-center font-bold text-base">
          <span className="text-green-600">Total Revenue</span>
          <span className="text-green-600">{formatCurrency(totalRevenue)}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center font-bold text-lg">
          <span>Projected Profit</span>
          <span className={projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(projectedProfit)}
          </span>
        </div>
        <div className="flex justify-between items-center font-bold text-lg">
          <span>Profit Margin</span>
          <span className={profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
            {profitMargin.toFixed(2)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
