'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Lightbulb, Zap, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type BusinessInsightsCardProps = {
  totalCost: number;
  totalRevenue: number;
  projectedProfit: number;
  profitMargin: number;
  purchasePrice: number;
  unitsRemaining: number;
  currency: string;
};

export default function BusinessInsightsCard({
  totalCost,
  totalRevenue,
  projectedProfit,
  profitMargin,
  purchasePrice,
  unitsRemaining,
  currency,
}: BusinessInsightsCardProps) {
  // Calculations
  const isLoss = projectedProfit < 0;
  
  const breakEvenPrice = unitsRemaining > 0 ? totalCost / unitsRemaining : 0;
  
  const suggestedPurchasePrice = totalCost > 0 ? purchasePrice * (totalRevenue / totalCost) : 0;

  const formatCurrency = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  // Skip rendering if no data is entered yet
  if (totalCost === 0 && totalRevenue === 0) return null;

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          Business Insights
        </CardTitle>
        <CardDescription>
          Intelligent analysis of your current pricing and procurement strategy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profitability Warning */}
        {isLoss && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-destructive">Profitability Warning</p>
              <p className="text-xs text-destructive/80">
                Your current pricing strategy results in a loss of {formatCurrency(Math.abs(projectedProfit))}.
              </p>
            </div>
          </div>
        )}

        {/* Break-even Insight */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex gap-3 items-start">
          <TrendingDown className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-700">Break-even Insight</p>
            <p className="text-xs text-blue-600/80">
              You need to sell at least <span className="font-bold">{formatCurrency(breakEvenPrice)}</span> per unit to cover all costs and avoid losses.
            </p>
          </div>
        </div>

        {/* Smart Suggestion (procurement) */}
        {isLoss && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 flex gap-3 items-start">
            <Zap className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-purple-700">Procurement Target</p>
              <p className="text-xs text-purple-600/80">
                To break even at your current selling price, consider buying raw hair at approximately <span className="font-bold">{formatCurrency(suggestedPurchasePrice)}</span> per unit.
              </p>
            </div>
          </div>
        )}

        {/* Strategy Advice */}
        {isLoss && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex gap-3 items-start">
            <ArrowRight className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-700">Optimization Strategy</p>
              <p className="text-xs text-emerald-600/80">
                Consider converting longer hair (14+ inches) into Remy products or wigs to capture higher market margins.
              </p>
            </div>
          </div>
        )}

        {!isLoss && profitMargin < 20 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-3 items-start">
            <ArrowRight className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-700">Margin Optimization</p>
              <p className="text-xs text-amber-600/80">
                Your margin is currently {profitMargin.toFixed(1)}%. Aim for 30%+ by reducing processing wastage or increasing bulk order prices for sizes above 18".
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
