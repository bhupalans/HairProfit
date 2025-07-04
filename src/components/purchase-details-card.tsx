'use client';

import type { HairProfitData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package } from 'lucide-react';

interface PurchaseDetailsCardProps {
  data: HairProfitData;
  initialData: HairProfitData;
  onDataChange: (field: keyof HairProfitData, value: any) => void;
  onNumericChange: (field: keyof HairProfitData, value: string) => void;
}

export default function PurchaseDetailsCard({ data, initialData, onDataChange, onNumericChange }: PurchaseDetailsCardProps) {
  const handleFocus = (field: 'hairType' | 'purchaseQuantity' | 'purchasePrice') => {
    if (data[field] === initialData[field]) {
      if (field === 'hairType') {
        onDataChange(field, '');
      } else {
        onNumericChange(field, '');
      }
    }
  };

  const handleBlur = (field: 'hairType' | 'purchaseQuantity' | 'purchasePrice') => {
    const value = data[field];
    if (value === '' || value === null || value === undefined) {
      if (field === 'hairType') {
        onDataChange(field, initialData[field]);
      } else {
        onNumericChange(field, String(initialData[field]));
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          Purchase Details
        </CardTitle>
        <CardDescription>Enter the initial product information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hairType">Hair Type / Name</Label>
            <Input
              id="hairType"
              placeholder="e.g., Brazilian Body Wave"
              value={data.hairType}
              onChange={(e) => onDataChange('hairType', e.target.value)}
              onFocus={() => handleFocus('hairType')}
              onBlur={() => handleBlur('hairType')}
            />
          </div>
          <div>
            <Label htmlFor="purchaseQuantity">Quantity (units)</Label>
            <Input
              id="purchaseQuantity"
              type="number"
              placeholder="e.g., 100"
              value={data.purchaseQuantity}
              onChange={(e) => onNumericChange('purchaseQuantity', e.target.value)}
              onFocus={() => handleFocus('purchaseQuantity')}
              onBlur={() => handleBlur('purchaseQuantity')}
            />
          </div>
          <div>
            <Label htmlFor="purchasePrice">Purchase Price (per unit)</Label>
            <Input
              id="purchasePrice"
              type="number"
              placeholder="e.g., 50"
              value={data.purchasePrice}
              onChange={(e) => onNumericChange('purchasePrice', e.target.value)}
              onFocus={() => handleFocus('purchasePrice')}
              onBlur={() => handleBlur('purchasePrice')}
            />
          </div>
          <div>
            <Label>Currency</Label>
            <Select
              value={data.currency}
              onValueChange={(value) => onDataChange('currency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
