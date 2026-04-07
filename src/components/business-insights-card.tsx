'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Lightbulb, Zap, AlertTriangle, ArrowRight, Activity, BarChart3 } from 'lucide-react';
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
  const isLoss = projectedProfit < 0;
  
  // 1. Correct break-even based procurement logic
  const breakEvenPurchasePrice = unitsRemaining > 0 ? totalRevenue / unitsRemaining : 0;
  
  // 2. Break-even selling price
  const breakEvenPrice = unitsRemaining > 0 ? totalCost / unitsRemaining : 0;

  // 3. Profit Quality Indicator
  let profitQuality = "";
  let healthColor = "";
  if (profitMargin < 0) {
    profitQuality = "Loss";
    healthColor = "text-red-600 bg-red-50 border-red-200";
  } else if (profitMargin < 10) {
    profitQuality = "Low Margin";
    healthColor = "text-amber-600 bg-amber-50 border-amber-200";
  } else if (profitMargin < 25) {
    profitQuality = "Healthy";
    healthColor = "text-blue-600 bg-blue-50 border-blue-200";
  } else {
    profitQuality = "High Profit";
    healthColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
  }

  // 4. Dynamic Strategy Engine
  let strategyTitle = "";
  let strategyText = "";
  if (isLoss) {
    strategyTitle = "Loss Reduction Strategy";
    strategyText = "Your current pricing shows losses driven by low-value sizes. Short lengths (6–10 inches) typically have weak market demand and lower prices. Consider shifting your strategy: convert longer hair (14+ inches) into premium Remy or extension products while minimizing bulk sales.";
  } else {
    strategyTitle = "Profit Optimization Strategy";
    strategyText = "Your business is profitable. To improve margins further, focus on increasing output of high-value lengths (16+ inches) and optimize pricing for premium categories like Remy and extensions.";
  }

  // 5. Cost vs Market Reality
  const avgRevenuePerUnit = unitsRemaining > 0 ? totalRevenue / unitsRemaining : 0;
  const isMarketMismatch = breakEvenPrice > avgRevenuePerUnit;

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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          Business Advisor
        </CardTitle>
        <CardDescription>
          Intelligent decision engine for your hair trade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Business Health Badge */}
        <div className={cn("flex items-center justify-between p-3 rounded-lg border font-bold text-sm", healthColor)}>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Business Health
          </div>
          <span>{profitQuality}</span>
        </div>

        {/* Profitability Warning */}
        {isLoss && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Financial Warning</p>
              <p className="text-xs text-red-600/80">
                Current strategy results in a loss of {formatCurrency(Math.abs(projectedProfit))}. Immediate adjustment recommended.
              </p>
            </div>
          </div>
        )}

        {/* Break-even Insight */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex gap-3 items-start">
          <TrendingDown className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-700">Break-even Point</p>
            <p className="text-xs text-blue-600/80">
              You must sell at least <span className="font-bold">{formatCurrency(breakEvenPrice)}</span> per unit to cover your total cost.
            </p>
          </div>
        </div>

        {/* Procurement Target */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 flex gap-3 items-start">
          <Zap className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-purple-700">Procurement Guidance</p>
            <p className="text-xs text-purple-600/80 leading-snug">
              To be profitable at your current selling prices, you should procure raw hair below <span className="font-bold">{formatCurrency(breakEvenPurchasePrice)}</span> per unit.
            </p>
          </div>
        </div>

        {/* Market Mismatch */}
        {isMarketMismatch && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 flex gap-3 items-start">
            <BarChart3 className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-orange-700">Cost vs Market Reality</p>
              <p className="text-xs text-orange-600/80">
                Your cost structure is higher than current average returns. This indicates a sourcing or pricing imbalance.
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Strategy */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex gap-3 items-start">
          <ArrowRight className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-700">{strategyTitle}</p>
            <p className="text-xs text-emerald-600/80 leading-relaxed">
              {strategyText}
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
