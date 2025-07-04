'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lightbulb, Loader2, Terminal } from 'lucide-react';

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

const currencies = [
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
];


export default function MarketComparisonPage() {
  const [formData, setFormData] = useState<Omit<MarketComparisonInput, 'currency'>>({
    format: 'tape-in',
    length: '10 inches',
    origin: 'Indian',
    texture: 'Straight',
    quality: 'Virgin',
    color: 'Natural Black',
  });
  const [currency, setCurrency] = useState('INR');
  const [result, setResult] = useState<MarketComparisonOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
    
    const response = await getMarketComparison(input);
    
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
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
                <AlertDescription className="text-foreground/80 space-y-2">
                   <p className="font-semibold text-lg">
                     Suggested Range: {formatCurrency(result.lowerBoundPrice)} - {formatCurrency(result.upperBoundPrice)} (per bundle)
                   </p>
                   <p>{result.analysis}</p>
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
