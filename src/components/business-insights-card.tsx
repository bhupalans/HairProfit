'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Lightbulb, Zap, AlertTriangle, ArrowRight, Activity, BarChart3, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

type BusinessInsightsCardProps = {
  totalCost: number;
  totalRevenue: number;
  projectedProfit: number;
  profitMargin: number;
  purchasePrice: number;
  unitsRemaining: number;
  currency: string;
  processedNonRemyProducts?: any[];
  targetByproductMargin?: number;
  lowStockThreshold?: number;
};

export default function BusinessInsightsCard({
  totalCost,
  totalRevenue,
  projectedProfit,
  profitMargin,
  purchasePrice,
  unitsRemaining,
  currency,
  processedNonRemyProducts = [],
  targetByproductMargin,
  lowStockThreshold = 10,
}: BusinessInsightsCardProps) {
  const isLoss = projectedProfit < 0;
  
  // 1. Break-even points
  const breakEvenPrice = unitsRemaining > 0 ? totalCost / unitsRemaining : 0;
  const maxSafePurchasePrice = unitsRemaining > 0 ? totalRevenue / unitsRemaining : 0;
  
  // 2. Target procurement
  const currentMarginDecimal = profitMargin / 100;
  const targetMarginDecimal = targetByproductMargin 
    ? (targetByproductMargin / 100) 
    : Math.min(currentMarginDecimal + 0.05, 0.5);
    
  const targetPurchasePrice = unitsRemaining > 0 
    ? (totalRevenue * (1 - targetMarginDecimal)) / unitsRemaining 
    : 0;

  // 3. Size and Stock Analysis
  const sizeAnalysis = (() => {
    if (processedNonRemyProducts.length === 0) return { avgSize: 0, hasLowStock: false };
    
    let totalSize = 0;
    let count = 0;
    let hasLowStock = false;

    processedNonRemyProducts.forEach(p => {
      const parsedSize = parseInt(String(p.size).split('-')[0].trim(), 10);
      if (!isNaN(parsedSize)) {
        totalSize += parsedSize;
        count++;
      }
      if (Number(p.quantity) > 0 && Number(p.quantity) < lowStockThreshold) {
        hasLowStock = true;
      }
    });

    return {
      avgSize: count > 0 ? totalSize / count : 0,
      hasLowStock
    };
  })();

  // 4. Dynamic Strategy Engine
  const getStrategies = () => {
    const strategies = [];
    
    if (sizeAnalysis.avgSize > 0 && sizeAnalysis.avgSize < 12) {
      strategies.push({
        title: "Inventory Mix Warning",
        text: "Your average size is under 12 inches. Short hair is often low-margin. Aim to source longer lengths (14\"+) to improve total revenue."
      });
    } else if (sizeAnalysis.avgSize >= 14) {
      strategies.push({
        title: "Premium Opportunity",
        text: "You have a healthy average size (14\"+). Consider converting this inventory into premium Remy or HD-lace wig products for significantly higher margins."
      });
    }

    if (sizeAnalysis.hasLowStock) {
      strategies.push({
        title: "Scarcity Pricing",
        text: "Low stock detected on popular sizes. You can likely apply a 10-15% premium to these items without impacting demand."
      });
    }

    if (isLoss) {
      strategies.push({
        title: "Cost Correction",
        text: "Your current procurement cost exceeds market returns. You must either reduce buying price or shift your inventory to higher-value categories."
      });
    }

    return strategies;
  };

  const strategies = getStrategies();

  const formatCurrency = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  if (totalCost === 0 && totalRevenue === 0) return null;

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          Business Advisor
        </CardTitle>
        <CardDescription>
          Intelligent guidance based on your current data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Profitability Warning */}
        {isLoss && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Profitability Warning</p>
              <p className="text-xs text-red-600/80">
                Your current strategy results in a loss of <span className="font-bold">{formatCurrency(Math.abs(projectedProfit))}</span>.
              </p>
            </div>
          </div>
        )}

        {/* Break-even Insight */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex gap-3 items-start">
          <TrendingDown className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-700">Revenue Threshold</p>
            <p className="text-xs text-blue-600/80">
              You must sell at least <span className="font-bold">{formatCurrency(breakEvenPrice)}</span> per unit to cover all overhead and material costs.
            </p>
          </div>
        </div>

        {/* Procurement Guidance */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 flex gap-3 items-start">
          <Zap className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-purple-700">Procurement Strategy</p>
            {isLoss ? (
              <p className="text-xs text-purple-600/80 leading-snug">
                To reach break-even at current sales prices, you must procure raw hair below <span className="font-bold">{formatCurrency(maxSafePurchasePrice)}</span>.
              </p>
            ) : (
              <>
                <p className="text-xs text-purple-600/80 leading-snug">
                  Maximum safe purchase price: <span className="font-bold">{formatCurrency(maxSafePurchasePrice)}</span>
                </p>
                <p className="text-xs text-purple-600/80 leading-snug">
                  Target for optimal margin: <span className="font-bold">{formatCurrency(targetPurchasePrice)}</span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Strategies */}
        {strategies.map((s, idx) => (
          <div key={idx} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex gap-3 items-start">
            <ArrowRight className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-700">{s.title}</p>
              <p className="text-xs text-emerald-600/80 leading-relaxed">
                {s.text}
              </p>
            </div>
          </div>
        ))}

      </CardContent>
    </Card>
  );
}
