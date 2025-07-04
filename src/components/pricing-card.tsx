'use client';

import type { HairProfitData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  data: HairProfitData;
  onDataChange: (field: keyof HairProfitData, value: any) => void;
  unitsRemaining: number;
}

export default function PricingCard({ data, onDataChange, unitsRemaining }: PricingCardProps) {
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
    <fieldset disabled={enableByproductProcessing} className="space-y-8">
      <Card className={cn(enableByproductProcessing && 'bg-muted/50')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-primary" />
            Pricing
          </CardTitle>
          <CardDescription>
            Set your price for the primary product. Disabled when byproduct processing is active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full">
            <BarChart2 className="mr-2 h-4 w-4" /> Compare to Market
          </Button>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sellingPricePerUnit">Selling Price (per unit)</Label>
              <Input
                id="sellingPricePerUnit"
                type="number"
                placeholder="e.g., 120"
                value={sellingPricePerUnit}
                onChange={(e) => onDataChange('sellingPricePerUnit', e.target.value)}
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
      </Card>
    </fieldset>
  );
}
