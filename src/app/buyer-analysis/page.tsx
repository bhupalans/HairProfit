'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Terminal, Users, Target, Megaphone, Info, HelpCircle } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getBuyerAnalysis } from '@/app/actions';
import type { BuyerAnalysisOutput, MarketComparisonInput } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import AuthGuard from '@/components/auth-guard';
import SubscriptionGuard from '@/components/subscription-guard';

const formats = [
    { id: 'weave', name: 'Weave', hint: 'hair weave', image: '/images/formats/weave.jpg' },
    { id: 'tape-in', name: 'Tape-in', hint: 'tape hair', image: '/images/formats/tape-in.jpg' },
    { id: 'clip-in', name: 'Clip-in', hint: 'clip hair', image: '/images/formats/clip-in.jpg' },
    { id: 'i-tip', name: 'I-Tip', hint: 'i-tip extension', image: '/images/formats/i-tip.jpg' },
    { id: 'fusion-keratin', name: 'Fusion/Keratin Bond', hint: 'keratin bond', image: '/images/formats/fusion.jpg' },
    { id: 'wig', name: 'Wig', hint: 'hair wig', image: '/images/formats/wig.jpg' },
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


export default function BuyerAnalysisPage() {
  const [formData, setFormData] = useState<Partial<Omit<MarketComparisonInput, 'currency'>>>({
    format: 'wig',
    length: '16 inches',
    origin: 'Brazilian',
    texture: 'Body Wave',
    quality: 'Virgin',
    color: 'Natural Black',
    targetMarket: 'Luxury/High-End',
    laceType: 'HD Lace',
    capConstruction: 'Lace Front',
    density: '180%',
  });
  const [currency, setCurrency] = useState('USD');
  const [result, setResult] = useState<BuyerAnalysisOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFormatChange = (value: string) => {
    setFormData(prev => {
        const newState: Partial<Omit<MarketComparisonInput, 'currency'>> = { ...prev, format: value };
        if (value === 'wig') {
            newState.laceType = prev.laceType || 'HD Lace';
            newState.capConstruction = prev.capConstruction || 'Lace Front';
            newState.density = prev.density || '150%';
        } 
        else {
            delete newState.laceType;
            delete newState.capConstruction;
            delete newState.density;
        }
        return newState;
    });
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    const input = { ...formData, currency };
    const hairDescription = `${formData.length} ${formData.origin} ${formData.texture} hair`;

    toast({
      title: 'Analyzing Buyers...',
      description: `Generating personas for ${hairDescription}`,
    });
    
    const response = await getBuyerAnalysis(input as MarketComparisonInput);
    
    setLoading(false);
    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(response.error || 'An unknown error occurred.');
    }
  };

  return (
    <AuthGuard>
      <SubscriptionGuard>
        <div className="bg-background min-h-screen">
          <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
              <Button asChild variant="ghost" className="pl-0">
                <Link href="/">
                  <ArrowLeft className="mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                <div className="lg:col-span-2">
                    <Card className="p-6 md:p-8 sticky top-8">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold tracking-tight">Buyer Analysis</h1>
                            <p className="text-muted-foreground mt-2">
                            Get an AI-powered report on potential buyer personas.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div>
                            <Label className="text-base font-medium">Format</Label>
                            <RadioGroup
                                value={formData.format}
                                onValueChange={handleFormatChange}
                                className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2"
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
                                    src={format.image}
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="length" className="text-base font-medium">Length</Label>
                                    <Select value={formData.length} onValueChange={(value) => setFormData(prev => ({...prev, length: value}))}>
                                    <SelectTrigger id="length" className="mt-2"><SelectValue /></SelectTrigger>
                                    <SelectContent>{lengths.map((len) => <SelectItem key={len} value={len}>{len}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="origin" className="text-base font-medium">Origin</Label>
                                    <Select value={formData.origin} onValueChange={(value) => setFormData(prev => ({...prev, origin: value}))}>
                                    <SelectTrigger id="origin" className="mt-2"><SelectValue /></SelectTrigger>
                                    <SelectContent>{origins.map((orig) => <SelectItem key={orig} value={orig}>{orig}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="texture" className="text-base font-medium">Texture</Label>
                                    <Select value={formData.texture} onValueChange={(value) => setFormData(prev => ({...prev, texture: value}))}>
                                    <SelectTrigger id="texture" className="mt-2"><SelectValue /></SelectTrigger>
                                    <SelectContent>{textures.map((tex) => <SelectItem key={tex} value={tex}>{tex}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="quality" className="text-base font-medium">Quality/Grade</Label>
                                    <Select value={formData.quality} onValueChange={(value) => setFormData(prev => ({...prev, quality: value}))}>
                                    <SelectTrigger id="quality" className="mt-2"><SelectValue /></SelectTrigger>
                                    <SelectContent>{qualities.map((qual) => <SelectItem key={qual} value={qual}>{qual}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="color" className="text-base font-medium">Color</Label>
                                    <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({...prev, color: value}))}>
                                    <SelectTrigger id="color" className="mt-2"><SelectValue /></SelectTrigger>
                                    <SelectContent>{colors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="targetMarket" className="text-base font-medium">Target Market</Label>
                                    <Select value={formData.targetMarket} onValueChange={(value) => setFormData(prev => ({...prev, targetMarket: value}))}>
                                    <SelectTrigger id="targetMarket" className="mt-2"><SelectValue /></SelectTrigger>
                                    <SelectContent>{targetMarkets.map((market) => <SelectItem key={market} value={market}>{market}</SelectItem>)}</SelectContent>
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
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
                            
                            <div className="text-center pt-4">
                            <Button size="lg" onClick={handleAnalyze} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Analyzing...' : 'Analyze Potential Buyers'}
                            </Button>
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-3">
                    <AnimatePresence>
                        {loading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full min-h-[500px]">
                                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                                <p className="text-lg text-muted-foreground">Generating buyer report...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                     {error && (
                        <Alert variant="destructive">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>Analysis Failed</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-8">
                        {result ? (
                           result.personas.map((persona, index) => (
                               <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                                   <Card>
                                       <CardHeader>
                                           <CardTitle className="flex items-start gap-4">
                                                <span className="bg-primary/10 text-primary p-3 rounded-lg mt-1">
                                                    <Users className="h-6 w-6" />
                                                </span>
                                                <div>
                                                    <Badge variant="secondary" className="mb-2">{persona.market}</Badge>
                                                    <h2 className="text-2xl">{persona.buyerType}</h2>
                                                </div>
                                           </CardTitle>
                                       </CardHeader>
                                       <CardContent className="space-y-6">
                                           <p className="text-muted-foreground">{persona.description}</p>
                                           
                                           <div>
                                               <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                   <Target className="h-5 w-5 text-primary/80" />
                                                   Key Needs & Drivers
                                               </h3>
                                               <div className="flex flex-wrap gap-2">
                                                   {persona.keyNeeds.map(need => (
                                                       <Badge key={need} variant="outline" className="text-sm py-1">{need}</Badge>
                                                   ))}
                                               </div>
                                           </div>

                                           <div>
                                               <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                   <Megaphone className="h-5 w-5 text-primary/80" />
                                                   Marketing Channels
                                               </h3>
                                                <div className="flex flex-wrap gap-2">
                                                   {persona.marketingChannels.map(channel => (
                                                       <Badge key={channel} variant="outline" className="text-sm py-1">{channel}</Badge>
                                                   ))}
                                               </div>
                                           </div>

                                           {persona.exampleQuestions && (
                                                <div>
                                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                        <HelpCircle className="h-5 w-5 text-primary/80" />
                                                        Example Questions to Ask
                                                    </h3>
                                                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                                        {persona.exampleQuestions.map(question => (
                                                            <li key={question}>{question}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                           )}
                                       </CardContent>
                                   </Card>
                               </motion.div>
                           )) 
                        ) : (
                            !loading && !error && (
                                <div className="flex flex-col items-center justify-center h-full min-h-[500px] rounded-lg border-2 border-dashed bg-muted/30">
                                     <Info className="h-12 w-12 text-muted-foreground mb-4" />
                                     <h2 className="text-2xl font-semibold mb-2">Buyer Report Will Appear Here</h2>
                                     <p className="text-muted-foreground max-w-md text-center">
                                         Fill out the product details on the left and click "Analyze" to generate a report on your potential customers.
                                     </p>
                                 </div>
                            )
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </SubscriptionGuard>
    </AuthGuard>
  );
}
