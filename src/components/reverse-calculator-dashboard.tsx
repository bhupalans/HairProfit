'use client';

import { useState, useMemo, useEffect, useRef, ChangeEvent } from 'react';
import { 
  ArrowLeft, 
  ArrowRight,
  ArrowRightLeft, 
  PlusCircle, 
  Trash2, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingDown,
  Coins,
  RefreshCw,
  Loader2,
  FilePlus2,
  Globe,
  Weight,
  Layers,
  ChevronRight,
  ChevronLeft,
  Info,
  Scale,
  FileUp,
  FileDown
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { fetchExchangeRate } from '@/app/actions';
import { useAuth } from '@/contexts/auth-context';
import { Separator } from '@/components/ui/separator';

// Standard Industry Yield Profile
const YIELD_PROFILE: Record<string, number> = {
  '6"': 90, '8"': 88, '10"': 85, '12"': 82, '14"': 80, '16"': 78,
  '18"': 75, '20"': 72, '22"': 70, '24"': 68, '26"': 65, '28"': 62, '30"': 60,
};

const lengths = Object.keys(YIELD_PROFILE);

interface QuoteRow {
  id: string;
  length: string;
  quantity: number;
  buyerPriceUSD: number;
  yield: number;
}

export default function ReverseCalculatorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [exchangeRate, setExchangeRate] = useState(83.50);
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  // Data States
  const [quoteRows, setQuoteRows] = useState<QuoteRow[]>([
    { id: crypto.randomUUID(), length: '16"', quantity: 10, buyerPriceUSD: 75, yield: 78 },
  ]);

  const [costs, setCosts] = useState({
    totalRawPurchase: 100,
    rawHairPrice: 2000,
    processing: 1200,
    logistics: 400,
    other: 200,
  });

  const [yieldMode, setYieldMode] = useState<'individual' | 'global'>('individual');
  const [globalWastage, setGlobalWastage] = useState(20); // 20% wastage
  const [finalOverrides, setFinalOverrides] = useState<Record<string, number>>({});

  // Formatting helpers
  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Calculations
  const calculations = useMemo(() => {
    const totalOutput = quoteRows.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
    
    // Step 1 Grand Total
    const buyerQuoteGrandTotal = quoteRows.reduce((acc, r) => acc + (Number(r.quantity) || 0) * (Number(r.buyerPriceUSD) || 0), 0);

    // Step 2 Raw Cost
    const totalRawCostINR = (Number(costs.totalRawPurchase) || 0) * (Number(costs.rawHairPrice) || 0);
    
    // Step 3 Overhead
    const totalOverheadINR = totalOutput * (
      (Number(costs.processing) || 0) + 
      (Number(costs.logistics) || 0) + 
      (Number(costs.other) || 0)
    );

    const totalCostPoolINR = totalRawCostINR + totalOverheadINR;
    const sharedCostPerKgINR = totalOutput > 0 ? totalCostPoolINR / totalOutput : 0;
    const sharedCostPerKgUSD = exchangeRate > 0 ? sharedCostPerKgINR / exchangeRate : 0;

    // Yield Analysis
    let rawRequired = 0;
    if (yieldMode === 'global') {
      const yieldFactor = (100 - globalWastage) / 100;
      rawRequired = yieldFactor > 0 ? totalOutput / yieldFactor : 0;
    } else {
      rawRequired = quoteRows.reduce((acc, r) => {
        const y = Number(r.yield) || 80;
        return acc + (Number(r.quantity) || 0) / (y / 100);
      }, 0);
    }

    const rawDifference = (Number(costs.totalRawPurchase) || 0) - rawRequired;
    const isShortage = rawDifference < 0;

    const items = quoteRows.map(row => {
      const fPrice = finalOverrides[row.id] !== undefined 
        ? finalOverrides[row.id] 
        : Number((sharedCostPerKgUSD * 1.20).toFixed(2));

      const minPrice = sharedCostPerKgUSD * 1.08;
      const targetPrice = sharedCostPerKgUSD * 1.20;

      let status: 'Reject' | 'Negotiate' | 'Accept' = 'Reject';
      if (fPrice >= targetPrice) status = 'Accept';
      else if (fPrice >= minPrice) status = 'Negotiate';

      return {
        ...row,
        costUSD: sharedCostPerKgUSD,
        minPrice,
        targetPrice,
        finalPrice: fPrice,
        status,
        margin: fPrice > 0 ? ((fPrice - sharedCostPerKgUSD) / fPrice) * 100 : 0
      };
    });

    const avgMargin = items.length > 0 
      ? items.reduce((acc, i) => acc + i.margin, 0) / items.length 
      : 0;

    return {
      totalOutput,
      buyerQuoteGrandTotal,
      totalCostPoolINR,
      sharedCostPerKgUSD,
      rawRequired,
      rawDifference,
      isShortage,
      items,
      avgMargin
    };
  }, [quoteRows, costs, yieldMode, globalWastage, finalOverrides, exchangeRate]);

  // Handlers
  const handleFetchRate = async () => {
    setIsFetchingRate(true);
    const response = await fetchExchangeRate({ baseCurrency: 'USD', targetCurrency: 'INR' });
    setIsFetchingRate(false);
    if (response.success && response.data) {
      setExchangeRate(response.data.rate);
      toast({ title: 'Rate Updated', description: `1 USD = ${response.data.rate.toFixed(2)} INR` });
    }
  };

  const addQuoteRow = () => {
    setQuoteRows(prev => [
      ...prev,
      { id: crypto.randomUUID(), length: '12"', quantity: 5, buyerPriceUSD: 0, yield: 82 },
    ]);
  };

  const updateQuoteRow = (id: string, field: keyof QuoteRow, value: any) => {
    setQuoteRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'length') updated.yield = YIELD_PROFILE[value] || 80;
      return updated;
    }));
  };

  const removeQuoteRow = (id: string) => {
    setQuoteRows(prev => prev.filter(r => r.id !== id));
  };

  const handleCreateQuotation = () => {
    if (!user?.uid) return;
    const quotationData = {
      items: calculations.items.map(row => ({
        length: row.length,
        quantity: row.quantity,
        price: row.finalPrice
      })),
      currency: 'USD',
      displayCurrency: 'USD',
      exchangeRate: 1
    };
    localStorage.setItem(`u_${user.uid}_profitToQuotation`, JSON.stringify(quotationData));
    router.push('/price-quotation');
  };

  const handleExportJson = () => {
    const exportData = {
      quoteRows,
      costs,
      yieldMode,
      globalWastage,
      finalOverrides,
      exchangeRate,
      exportedAt: new Date().toISOString(),
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reverse-calc-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Export Successful', description: 'Calculation saved to JSON file.' });
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const data = JSON.parse(result);
        
        if (data.quoteRows) setQuoteRows(data.quoteRows);
        if (data.costs) setCosts(data.costs);
        if (data.yieldMode) setYieldMode(data.yieldMode);
        if (data.globalWastage !== undefined) setGlobalWastage(data.globalWastage);
        if (data.finalOverrides) setFinalOverrides(data.finalOverrides);
        if (data.exchangeRate) setExchangeRate(data.exchangeRate);

        toast({ title: 'Import Successful', description: 'Calculation state restored.' });
      } catch (err) {
        console.error('Import failed', err);
        toast({ variant: 'destructive', title: 'Import Failed', description: 'The JSON file is invalid.' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="bg-muted/30 min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-body">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Button asChild variant="ghost" className="pl-0">
            <Link href="/">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">1 USD = {exchangeRate.toFixed(2)} INR</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFetchRate} disabled={isFetchingRate}>
              {isFetchingRate ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Stepper Header */}
        <div className="mb-12">
            <div className="flex items-center justify-center gap-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                <span className={cn("flex items-center gap-2", step === 1 && "text-primary")}>
                    <span className={cn("w-6 h-6 rounded-full border flex items-center justify-center", step === 1 && "border-primary bg-primary text-white")}>1</span>
                    Buyer Quote
                </span>
                <ChevronRight className="h-4 w-4" />
                <span className={cn("flex items-center gap-2", step === 2 && "text-primary")}>
                    <span className={cn("w-6 h-6 rounded-full border flex items-center justify-center", step === 2 && "border-primary bg-primary text-white")}>2</span>
                    Costs
                </span>
                <ChevronRight className="h-4 w-4" />
                <span className={cn("flex items-center gap-2", step === 3 && "text-primary")}>
                    <span className={cn("w-6 h-6 rounded-full border flex items-center justify-center", step === 3 && "border-primary bg-primary text-white")}>3</span>
                    Yield
                </span>
                <ChevronRight className="h-4 w-4" />
                <span className={cn("flex items-center gap-2", step === 4 && "text-primary")}>
                    <span className={cn("w-6 h-6 rounded-full border flex items-center justify-center", step === 4 && "border-primary bg-primary text-white")}>4</span>
                    Analysis
                </span>
            </div>
        </div>

        <main className="space-y-8">
          {/* STEP 1: BUYER QUOTE */}
          {step === 1 && (
            <Card className="shadow-xl">
              <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <ArrowRightLeft className="h-6 w-6 text-primary" />
                    Step 1: Buyer Offer Details
                  </CardTitle>
                  <CardDescription>Enter the lengths and quantities your customer is asking for.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <FileUp className="h-4 w-4 mr-2" /> Import JSON
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="application/json" onChange={handleImportJson} />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                        <TableHead>Length</TableHead>
                        <TableHead className="text-right">Quantity (kg)</TableHead>
                        <TableHead className="text-right">Buyer Offer ($/kg)</TableHead>
                        <TableHead className="text-right">Total ($)</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quoteRows.map(row => (
                        <TableRow key={row.id}>
                            <TableCell className="p-2">
                                <Select value={row.length} onValueChange={(v) => updateQuoteRow(row.id, 'length', v)}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>{lengths.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell className="p-2">
                                <Input type="number" className="h-9 text-right" value={row.quantity} onChange={e => updateQuoteRow(row.id, 'quantity', Number(e.target.value))} />
                            </TableCell>
                            <TableCell className="p-2">
                                <Input type="number" className="h-9 text-right font-bold" value={row.buyerPriceUSD} onChange={e => updateQuoteRow(row.id, 'buyerPriceUSD', Number(e.target.value))} />
                            </TableCell>
                            <TableCell className="p-2 text-right font-medium">
                                {formatUSD((Number(row.quantity) || 0) * (Number(row.buyerPriceUSD) || 0))}
                            </TableCell>
                            <TableCell className="p-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => removeQuoteRow(row.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={3} className="text-right font-bold py-4">Grand Total Offer:</TableCell>
                            <TableCell className="text-right font-bold py-4 text-primary text-lg">
                                {formatUSD(calculations.buyerQuoteGrandTotal)}
                            </TableCell>
                            <TableCell />
                        </TableRow>
                    </TableFooter>
                    </Table>
                </div>
                <Button onClick={addQuoteRow} variant="outline" className="mt-4 w-full border-dashed">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Another Length
                </Button>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t justify-end pt-6">
                <Button onClick={nextStep} size="lg" className="px-12">Next: Costing <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          )}

          {/* STEP 2: COST INPUTS */}
          {step === 2 && (
            <Card className="shadow-xl">
               <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Coins className="h-6 w-6 text-primary" />
                  Step 2: Shared Batch Costs
                </CardTitle>
                <CardDescription>Enter procurement and processing costs in INR.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-primary font-bold">Material Procurement</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rawPurchase">Raw Hair Bought (kg)</Label>
                                <Input id="rawPurchase" type="number" value={costs.totalRawPurchase} onChange={e => setCosts(c => ({...c, totalRawPurchase: Number(e.target.value)}))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rawPrice">Price per kg (₹)</Label>
                                <Input id="rawPrice" type="number" value={costs.rawHairPrice} onChange={e => setCosts(c => ({...c, rawHairPrice: Number(e.target.value)}))} />
                                <p className="text-[10px] text-muted-foreground mt-1">≈ {formatUSD(costs.rawHairPrice / exchangeRate)}</p>
                            </div>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <Label className="text-primary font-bold">Operational Overheads (₹/kg)</Label>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <Label>Processing/Labor</Label>
                                <div className="space-y-1">
                                    <Input type="number" value={costs.processing} onChange={e => setCosts(c => ({...c, processing: Number(e.target.value)}))} />
                                    <p className="text-[10px] text-muted-foreground text-right">≈ {formatUSD(costs.processing / exchangeRate)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <Label>Logistics/Shipping</Label>
                                <div className="space-y-1">
                                    <Input type="number" value={costs.logistics} onChange={e => setCosts(c => ({...c, logistics: Number(e.target.value)}))} />
                                    <p className="text-[10px] text-muted-foreground text-right">≈ {formatUSD(costs.logistics / exchangeRate)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <Label>Other/Customs</Label>
                                <div className="space-y-1">
                                    <Input type="number" value={costs.other} onChange={e => setCosts(c => ({...c, other: Number(e.target.value)}))} />
                                    <p className="text-[10px] text-muted-foreground text-right">≈ {formatUSD(costs.other / exchangeRate)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-6 flex flex-col justify-center items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                        <Weight className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-xl">Total Batch Cost Pool</h4>
                        <p className="text-3xl font-black text-primary mt-1">
                          {formatINR(calculations.totalCostPoolINR)}
                        </p>
                        <p className="text-lg font-bold text-muted-foreground">≈ {formatUSD(calculations.totalCostPoolINR / exchangeRate)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground px-8 leading-relaxed italic">
                        This pool is distributed equally across the {calculations.totalOutput} kg of final output you intend to produce.
                    </p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t justify-between pt-6">
                <Button onClick={prevStep} variant="outline"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={nextStep} size="lg" className="px-12">Next: Yield Validation <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          )}

          {/* STEP 3: YIELD/WASTAGE */}
          {step === 3 && (
            <Card className="shadow-xl">
               <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Scale className="h-6 w-6 text-primary" />
                  Step 3: Wastage & Yield Analysis
                </CardTitle>
                <CardDescription>Determine how much raw material is needed for this production.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="flex gap-4 mb-8">
                    <Button 
                        variant={yieldMode === 'individual' ? 'default' : 'outline'} 
                        className="flex-1 h-auto py-4 flex-col gap-1"
                        onClick={() => setYieldMode('individual')}
                    >
                        <Layers className="h-5 w-5 mb-1" />
                        <span>Individual Yields</span>
                        <span className="text-[10px] opacity-70">Based on Hair Length</span>
                    </Button>
                    <Button 
                        variant={yieldMode === 'global' ? 'default' : 'outline'} 
                        className="flex-1 h-auto py-4 flex-col gap-1"
                        onClick={() => setYieldMode('global')}
                    >
                        <TrendingDown className="h-5 w-5 mb-1" />
                        <span>Global Wastage %</span>
                        <span className="text-[10px] opacity-70">Apply Single Rate</span>
                    </Button>
                </div>

                {yieldMode === 'global' ? (
                    <div className="max-w-xs mx-auto space-y-4 p-8 border rounded-xl bg-muted/20 text-center">
                        <Label className="text-lg">Overall Wastage %</Label>
                        <div className="flex items-center gap-4">
                            <Input 
                                type="number" 
                                value={globalWastage} 
                                onChange={e => setGlobalWastage(Number(e.target.value))} 
                                className="text-3xl h-16 text-center font-black"
                            />
                            <span className="text-2xl font-bold">%</span>
                        </div>
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                         <Table>
                            <TableHeader><TableRow className="bg-muted/50">
                                <TableHead>Length</TableHead>
                                <TableHead className="text-right">Qty (kg)</TableHead>
                                <TableHead className="text-right">Yield %</TableHead>
                                <TableHead className="text-right">Raw Required (kg)</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {quoteRows.map(row => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-bold">{row.length}</TableCell>
                                        <TableCell className="text-right">{row.quantity} kg</TableCell>
                                        <TableCell className="p-2">
                                            <Input 
                                                type="number" 
                                                className="h-8 w-24 ml-auto text-right" 
                                                value={row.yield} 
                                                onChange={e => updateQuoteRow(row.id, 'yield', Number(e.target.value))} 
                                            />
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {(row.quantity / (row.yield / 100)).toFixed(2)} kg
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </div>
                )}

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-xl border bg-muted/10 text-center">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Total Output</Label>
                        <p className="text-2xl font-black">{calculations.totalOutput} kg</p>
                    </div>
                    <div className="p-4 rounded-xl border bg-muted/10 text-center">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Raw Material Needed</Label>
                        <p className="text-2xl font-black">{calculations.rawRequired.toFixed(2)} kg</p>
                    </div>
                    <div className={cn(
                        "p-4 rounded-xl border text-center transition-colors",
                        calculations.isShortage ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                    )}>
                        <Label className={cn("text-xs uppercase font-bold", calculations.isShortage ? "text-red-700" : "text-green-700")}>
                            {calculations.isShortage ? "Raw Shortage" : "Raw Excess"}
                        </Label>
                        <p className={cn("text-2xl font-black", calculations.isShortage ? "text-red-800" : "text-green-800")}>
                            {Math.abs(calculations.rawDifference).toFixed(2)} kg
                        </p>
                    </div>
                </div>

                {calculations.isShortage && (
                    <div className="mt-4 p-4 rounded-lg bg-red-100 border border-red-200 flex items-center gap-3 text-red-800">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">Warning: You are {Math.abs(calculations.rawDifference).toFixed(2)} kg short on raw material to fulfill this production run.</p>
                    </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/10 border-t justify-between pt-6">
                <Button onClick={prevStep} variant="outline"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={nextStep} size="lg" className="px-12">Calculate Results <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          )}

          {/* STEP 4: ANALYSIS RESULT */}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <Card className="shadow-2xl overflow-hidden border-primary/20">
                    <CardHeader className="bg-primary text-primary-foreground">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-3xl font-black">Final Analysis</CardTitle>
                                <CardDescription className="text-primary-foreground/80">Profitability overview per length based on shared batch costs.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleExportJson} variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold">
                                <FileDown className="mr-2 h-5 w-5" /> Export JSON
                              </Button>
                              <Button onClick={handleCreateQuotation} variant="secondary" size="lg" className="font-bold">
                                  <FilePlus2 className="mr-2 h-5 w-5" /> Generate Professional Quote
                              </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                             <Table>
                                <TableHeader><TableRow className="bg-muted/50 border-b-2">
                                    <TableHead className="font-black text-xs uppercase">Length</TableHead>
                                    <TableHead className="text-right font-black text-xs uppercase">Offer ($/kg)</TableHead>
                                    <TableHead className="text-right font-black text-xs uppercase bg-muted/20">Our Cost ($/kg)</TableHead>
                                    <TableHead className="text-right font-black text-xs uppercase">Min ($/kg)</TableHead>
                                    <TableHead className="text-right font-black text-xs uppercase">Target ($/kg)</TableHead>
                                    <TableHead className="text-right font-black text-xs uppercase bg-primary/5">Final Negotiated ($/kg)</TableHead>
                                    <TableHead className="text-center font-black text-xs uppercase">Decision</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {calculations.items.map(row => (
                                        <TableRow key={row.id} className="hover:bg-muted/10">
                                            <TableCell className="font-black text-lg">{row.length}</TableCell>
                                            <TableCell className="text-right font-medium text-muted-foreground text-lg">${row.buyerPriceUSD.toFixed(0)}</TableCell>
                                            <TableCell className="text-right font-bold text-lg bg-muted/20">${row.costUSD.toFixed(2)}</TableCell>
                                            <TableCell className="text-right text-xs text-red-600 font-bold">${row.minPrice.toFixed(0)}</TableCell>
                                            <TableCell className="text-right text-xs text-green-600 font-bold">${row.targetPrice.toFixed(0)}</TableCell>
                                            <TableCell className="p-2 bg-primary/5">
                                                <Input 
                                                    type="number" 
                                                    className="h-10 text-right font-black text-lg border-primary/20 focus-visible:ring-primary focus:bg-white"
                                                    value={row.finalPrice}
                                                    onChange={e => setFinalOverrides(prev => ({...prev, [row.id]: Number(e.target.value)}))}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={cn(
                                                    "px-3 py-1 uppercase text-[10px] font-black tracking-tighter",
                                                    row.status === 'Accept' ? "bg-green-600" :
                                                    row.status === 'Negotiate' ? "bg-amber-500" : "bg-red-600"
                                                )}>
                                                    {row.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                             </Table>
                        </div>
                    </CardContent>
                 </Card>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-muted/5 border-dashed">
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground flex items-center gap-2"><TrendingDown className="h-3 w-3" /> Efficiency</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black">{(calculations.totalOutput / calculations.rawRequired * 100).toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Production Yield Rate</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/5 border-dashed">
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground flex items-center gap-2"><Info className="h-3 w-3" /> Average Margin</CardTitle></CardHeader>
                        <CardContent>
                            <p className={cn("text-3xl font-black", calculations.avgMargin >= 20 ? "text-green-600" : "text-amber-500")}>
                                {calculations.avgMargin.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">On negotiated prices</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/10 border-primary/30">
                        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-primary flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Total Profit</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black text-primary">
                                ${(calculations.items.reduce((acc, r) => acc + r.quantity * (r.finalPrice - r.costUSD), 0)).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Estimated Batch Return</p>
                        </CardContent>
                    </Card>
                 </div>

                 <div className="flex justify-between items-center pt-8">
                    <Button onClick={() => setStep(3)} variant="ghost"><ChevronLeft className="mr-2 h-4 w-4" /> Re-check Yields</Button>
                    <div className="flex gap-4">
                         <Button onClick={() => setStep(1)} variant="outline">Start Over</Button>
                    </div>
                 </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
