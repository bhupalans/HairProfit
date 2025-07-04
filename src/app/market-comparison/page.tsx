'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lightbulb, Loader2, Terminal } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getMarketComparison } from '@/app/actions';
import type { MarketComparisonOutput, MarketComparisonInput } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const formats = [
  { id: 'weave', name: 'Weave', hint: 'hair weave' },
  { id: 'tape-in', name: 'Tape-in', hint: 'tape hair' },
  { id: 'clip-in', name: 'Clip-in', hint: 'clip hair' },
  { id: 'i-tip', name: 'I-Tip', hint: 'i-tip extension' },
  { id: 'fusion-keratin', name: 'Fusion/Keratin Bond', hint: 'keratin bond' },
  { id: 'wig', name: 'Wig', hint: 'hair wig' },
];

const lengths = [
  '6 inches', '8 inches', '10 inches', '12 inches', '14 inches', '16 inches', '18 inches', '20 inches',
  '22 inches', '24 inches', '26 inches', '28 inches', '30 inches',
];

const origins = [ 'Indian', 'Brazilian', 'Peruvian', 'Malaysian', 'Vietnamese', 'Cambodian', 'Eurasian', 'Chinese', 'Russian', 'Burmese' ];
const textures = ['Straight', 'Wavy', 'Body Wave', 'Deep Wave', 'Curly', 'Kinky Curly'];
const qualities = ['Virgin', 'Remy', 'Non-Remy'];
const colors = ['Natural Black', 'Natural Brown', 'Dark Brown', '#1B (Off Black)', '#613 (Blonde)'];
const targetMarkets = ['Budget/Economy', 'Mid-Range/Salon', 'Luxury/High-End'];
const laceTypes = ['Standard Lace', 'Swiss Lace', 'Transparent Lace', 'HD Lace'];
const capConstructions = ['Lace Front', 'Full Lace', '360 Lace', 'U-Part'];
const densities = ['130%', '150%', '180%', '200%'];


const currencies = [
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
];


export default function MarketComparisonPage() {
  const [formData, setFormData] = useState<Partial<Omit<MarketComparisonInput, 'currency'>>>({
    format: 'tape-in',
    length: '10 inches',
    origin: 'Indian',
    texture: 'Straight',
    quality: 'Virgin',
    color: 'Natural Black',
    targetMarket: 'Mid-Range/Salon',
  });
  const [currency, setCurrency] = useState('INR');
  const [result, setResult] = useState<MarketComparisonOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFormatChange = (value: string) => {
    setFormData(prev => {
        const newState: Partial<Omit<MarketComparisonInput, 'currency'>> = { ...prev, format: value };

        // If switching to wig, set defaults for wig-specific fields
        if (value === 'wig') {
            newState.laceType = prev.laceType || 'HD Lace';
            newState.capConstruction = prev.capConstruction || 'Lace Front';
            newState.density = prev.density || '150%';
        } 
        // If switching away from wig, clear wig-specific fields
        else {
            delete newState.laceType;
            delete newState.capConstruction;
            delete newState.density;
        }
        return newState;
    });
  };

  const handleCompare = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    const input = { ...formData, currency };
    const hairDescription = `${formData.length} ${formData.origin} ${formData.texture} hair`;

    toast({
      title: 'Analyzing Market...',
      description: `Getting data for ${hairDescription}`,
    });
    
    const response = await getMarketComparison(input as MarketComparisonInput);
    
    setLoading(false);
    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(response.error || 'An unknown error occurred.');
    }
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="pl-0">
            <Link href="/">
              <ArrowLeft className="mr-2" />
              Back to Calculator
            </Link>
          </Button>
        </div>
        
        <Card className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Market Price Comparison</h1>
            <p className="text-muted-foreground mt-2">
              Get an AI-powered market price estimation for '{formData.origin} {formData.texture}' hair.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <Label className="text-base font-medium">Format</Label>
              <RadioGroup
                value={formData.format}
                onValueChange={handleFormatChange}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-2"
              >
                {formats.map((format) => (
                  <Label
                    key={format.id}
                    htmlFor={format.id}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 bg-card p-4 text-center transition-all hover:bg-muted/80",
                      formData.format === format.id && 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                    )}
                  >
                    <RadioGroupItem value={format.id} id={format.id} className="sr-only" />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="length" className="text-base font-medium">Length</Label>
                <Select
                  value={formData.length}
                  onValueChange={(value) => setFormData(prev => ({...prev, length: value}))}
                >
                  <SelectTrigger id="length" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lengths.map((len) => <SelectItem key={len} value={len}>{len}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="origin" className="text-base font-medium">Origin</Label>
                 <Select
                  value={formData.origin}
                  onValueChange={(value) => setFormData(prev => ({...prev, origin: value}))}
                >
                  <SelectTrigger id="origin" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {origins.map((orig) => <SelectItem key={orig} value={orig}>{orig}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
               <div>
                <Label htmlFor="texture" className="text-base font-medium">Texture</Label>
                <Select
                  value={formData.texture}
                  onValueChange={(value) => setFormData(prev => ({...prev, texture: value}))}
                >
                  <SelectTrigger id="texture" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {textures.map((tex) => <SelectItem key={tex} value={tex}>{tex}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quality" className="text-base font-medium">Quality/Grade</Label>
                <Select
                  value={formData.quality}
                  onValueChange={(value) => setFormData(prev => ({...prev, quality: value}))}
                >
                  <SelectTrigger id="quality" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qualities.map((qual) => <SelectItem key={qual} value={qual}>{qual}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="color" className="text-base font-medium">Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData(prev => ({...prev, color: value}))}
                >
                  <SelectTrigger id="color" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetMarket" className="text-base font-medium">Target Market</Label>
                <Select
                  value={formData.targetMarket}
                  onValueChange={(value) => setFormData(prev => ({...prev, targetMarket: value}))}
                >
                  <SelectTrigger id="targetMarket" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {targetMarkets.map((market) => <SelectItem key={market} value={market}>{market}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <AnimatePresence>
              {formData.format === 'wig' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: '2rem' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-6 rounded-lg border bg-muted/30 p-6">
                    <h3 className="text-lg font-medium text-center">Wig Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="laceType" className="text-base font-medium">Lace Type</Label>
                        <Select value={formData.laceType} onValueChange={(value) => setFormData(prev => ({...prev, laceType: value}))}>
                          <SelectTrigger id="laceType" className="mt-2"><SelectValue /></SelectTrigger>
                          <SelectContent>{laceTypes.map((lt) => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="capConstruction" className="text-base font-medium">Cap Construction</Label>
                        <Select value={formData.capConstruction} onValueChange={(value) => setFormData(prev => ({...prev, capConstruction: value}))}>
                          <SelectTrigger id="capConstruction" className="mt-2"><SelectValue /></SelectTrigger>
                          <SelectContent>{capConstructions.map((cc) => <SelectItem key={cc} value={cc}>{cc}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="density" className="text-base font-medium">Density</Label>
                        <Select value={formData.density} onValueChange={(value) => setFormData(prev => ({...prev, density: value}))}>
                          <SelectTrigger id="density" className="mt-2"><SelectValue /></SelectTrigger>
                          <SelectContent>{densities.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <Label htmlFor="currency" className="text-base font-medium">Currency</Label>
                     <Select
                      value={currency}
                      onValueChange={setCurrency}
                    >
                      <SelectTrigger id="currency" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => <SelectItem key={curr.value} value={curr.value}>{curr.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
            </div>

            {result && (
              <Alert className="border-primary/50 bg-primary/5">
                <Lightbulb className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">Market Analysis</AlertTitle>
                <AlertDescription className="text-foreground/80 space-y-4 !mt-4">
                  <p className="font-semibold text-xl">
                    Suggested Range: {formatCurrency(result.lowerBoundPrice)} - {formatCurrency(result.upperBoundPrice)} (per bundle)
                  </p>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Reasoning</h3>
                    <p className="text-sm leading-relaxed">{result.reasoning}</p>
                  </div>

                  {result.crossMarketAnalysis && (
                    <div>
                      <h3 className="font-semibold mb-2">Pricing Variations in Other Markets</h3>
                      <div className="text-sm space-y-2 leading-relaxed">
                        {result.crossMarketAnalysis.split('\n').map((line, index) => (
                          line.trim() && <p key={index}>{line}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground pt-2">Confidence: {(result.confidenceScore * 100).toFixed(0)}%</p>
                </AlertDescription>
              </Alert>
            )}

            {error && (
               <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Analysis Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="text-center pt-4">
              <Button size="lg" onClick={handleCompare} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Analyzing...' : 'Compare Market Price'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
