'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { HairProfitData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiPurchaseDetailsCardProps {
  data: HairProfitData;
  onDataChange: (field: keyof HairProfitData, value: any) => void;
  onNumericChange: (field: keyof HairProfitData, value: string) => void;
}

const formats = [
  { id: 'weave', name: 'Weave', hint: 'hair weave' },
  { id: 'tape-in', name: 'Tape-in', hint: 'tape hair' },
  { id: 'clip-in', name: 'Clip-in', hint: 'clip hair' },
  { id: 'i-tip', name: 'I-Tip', hint: 'i-tip extension' },
  { id: 'fusion-keratin', name: 'Fusion/Keratin Bond', hint: 'keratin bond' },
  { id: 'wig', name: 'Wig', hint: 'hair wig' },
];
const lengths = [ '6 inches', '8 inches', '10 inches', '12 inches', '14 inches', '16 inches', '18 inches', '20 inches', '22 inches', '24 inches', '26 inches', '28 inches', '30 inches'];
const origins = [ 'Indian', 'Brazilian', 'Peruvian', 'Malaysian', 'Vietnamese', 'Cambodian', 'Eurasian', 'Chinese', 'Russian', 'Burmese' ];
const textures = ['Straight', 'Wavy', 'Body Wave', 'Deep Wave', 'Curly', 'Kinky Curly'];
const qualities = ['Virgin', 'Remy', 'Non-Remy'];
const colors = ['Natural Black', 'Natural Brown', 'Dark Brown', '#1B (Off Black)', '#613 (Blonde)'];
const targetMarkets = ['Budget/Economy', 'Mid-Range/Salon', 'Luxury/High-End'];
const laceTypes = ['Standard Lace', 'Swiss Lace', 'Transparent Lace', 'HD Lace'];
const capConstructions = ['Lace Front', 'Full Lace', '360 Lace', 'U-Part'];
const densities = ['130%', '150%', '180%', '200%'];


export default function AiPurchaseDetailsCard({ data, onDataChange, onNumericChange }: AiPurchaseDetailsCardProps) {
  const handleFormatChange = (value: string) => {
    onDataChange('format', value);
    if (value !== 'wig') {
        onDataChange('laceType', undefined);
        onDataChange('capConstruction', undefined);
        onDataChange('density', undefined);
    } else {
        onDataChange('laceType', data.laceType || 'HD Lace');
        onDataChange('capConstruction', data.capConstruction || 'Lace Front');
        onDataChange('density', data.density || '150%');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          Purchase & Product Details
        </CardTitle>
        <CardDescription>Enter the initial product and purchase information for costing and AI analysis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">Format</Label>
          <RadioGroup
            value={data.format}
            onValueChange={handleFormatChange}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-2"
          >
            {formats.map((format) => (
              <Label
                key={format.id}
                htmlFor={`format-${format.id}`}
                className={cn(
                  "cursor-pointer rounded-lg border-2 bg-card p-4 text-center transition-all hover:bg-muted/80",
                  data.format === format.id && 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                )}
              >
                <RadioGroupItem value={format.id} id={`format-${format.id}`} className="sr-only" />
                <Image
                  src={`https://placehold.co/200x200.png`}
                  data-ai-hint={format.hint}
                  alt={format.name}
                  width={200}
                  height={200}
                  className="w-full rounded-md aspect-square object-cover"
                />
                <p className="font-medium mt-3">{format.name}</p>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
            <Label htmlFor="length">Length</Label>
            <Select value={data.length} onValueChange={(v) => onDataChange('length', v)}>
              <SelectTrigger id="length"><SelectValue /></SelectTrigger>
              <SelectContent>{lengths.map((len) => <SelectItem key={len} value={len}>{len}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="origin">Origin</Label>
             <Select value={data.origin} onValueChange={(v) => onDataChange('origin', v)}>
              <SelectTrigger id="origin"><SelectValue /></SelectTrigger>
              <SelectContent>{origins.map((orig) => <SelectItem key={orig} value={orig}>{orig}</SelectItem>)}</SelectContent>
            </Select>
          </div>
           <div>
            <Label htmlFor="texture">Texture</Label>
            <Select value={data.texture} onValueChange={(v) => onDataChange('texture', v)}>
              <SelectTrigger id="texture"><SelectValue /></SelectTrigger>
              <SelectContent>{textures.map((tex) => <SelectItem key={tex} value={tex}>{tex}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="quality">Quality/Grade</Label>
            <Select value={data.quality} onValueChange={(v) => onDataChange('quality', v)}>
              <SelectTrigger id="quality"><SelectValue /></SelectTrigger>
              <SelectContent>{qualities.map((qual) => <SelectItem key={qual} value={qual}>{qual}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Select value={data.color} onValueChange={(v) => onDataChange('color', v)}>
              <SelectTrigger id="color"><SelectValue /></SelectTrigger>
              <SelectContent>{colors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="targetMarket">Target Market</Label>
            <Select value={data.targetMarket} onValueChange={(v) => onDataChange('targetMarket', v)}>
              <SelectTrigger id="targetMarket"><SelectValue /></SelectTrigger>
              <SelectContent>{targetMarkets.map((market) => <SelectItem key={market} value={market}>{market}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <AnimatePresence>
          {data.format === 'wig' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4 mt-4">
                <h3 className="text-lg font-medium text-center">Wig Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="laceType">Lace Type</Label>
                    <Select value={data.laceType} onValueChange={(v) => onDataChange('laceType', v)}>
                      <SelectTrigger id="laceType"><SelectValue /></SelectTrigger>
                      <SelectContent>{laceTypes.map((lt) => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="capConstruction">Cap Construction</Label>
                    <Select value={data.capConstruction} onValueChange={(v) => onDataChange('capConstruction', v)}>
                      <SelectTrigger id="capConstruction"><SelectValue /></SelectTrigger>
                      <SelectContent>{capConstructions.map((cc) => <SelectItem key={cc} value={cc}>{cc}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="density">Density</Label>
                    <Select value={data.density} onValueChange={(v) => onDataChange('density', v)}>
                      <SelectTrigger id="density"><SelectValue /></SelectTrigger>
                      <SelectContent>{densities.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <Label htmlFor="purchaseQuantity">Purchase Quantity (units)</Label>
            <Input
              id="purchaseQuantity"
              type="number"
              placeholder="e.g., 100"
              value={data.purchaseQuantity}
              onChange={(e) => onNumericChange('purchaseQuantity', e.target.value)}
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
