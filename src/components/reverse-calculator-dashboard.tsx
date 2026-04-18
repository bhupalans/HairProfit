'use client';

import { useState, useMemo, useEffect, useRef, ChangeEvent } from 'react';
import { 
  ArrowRight,
  ArrowRightLeft, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
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
  const [globalWastageMode, setGlobalWastageMode] = useState<'percentage' | 'kg'>('percentage');
  const [globalWastage, setGlobalWastage] = useState(20); 
  const [globalWastageKg, setGlobalWastageKg] = useState(0);
  const [finalOverrides, setFinalOverrides] = useState<Record<string, number>>({});

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

  const calculations = useMemo(() => {
    const totalOutput = quoteRows.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
    const buyerQuoteGrandTotal = quoteRows.reduce((acc, r) => acc + (Number(r.quantity) || 0) * (Number(r.buyerPriceUSD) || 0), 0);
    const totalRawCostINR = (Number(costs.totalRawPurchase) || 0) * (Number(costs.rawHairPrice) || 0);
    const totalOverheadINR = totalOutput * (
      (Number(costs.processing) || 0) + 
      (Number(costs.logistics) || 0) + 
      (Number(costs.other) || 0)
    );

    const totalCostPoolINR = totalRawCostINR + totalOverheadINR;
    const totalCostPoolUSD = exchangeRate > 0 ? totalCostPoolINR / exchangeRate : 0;
    const sharedCostPerKgUSD = totalOutput > 0 ? totalCostPoolUSD / totalOutput : 0;

    let rawRequired = 0;
    if (yieldMode === 'global') {
      if (globalWastageMode === 'percentage') {
        const yieldFactor = (100 - globalWastage) / 100;
        rawRequired = yieldFactor > 0 ? totalOutput / yieldFactor : 0;
      } else {
        rawRequired = totalOutput + (Number(globalWastageKg) || 0);
      }
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

    const totalRevenueUSD = items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * i.finalPrice, 0);
    const totalProfitUSD = totalRevenueUSD - totalCostPoolUSD;
    const avgMargin = totalCostPoolUSD > 0 ? (totalProfitUSD / totalCostPoolUSD) * 100 : 0;

    return {
      totalOutput,
      buyerQuoteGrandTotal,
      totalCostPoolINR,
      totalCostPoolUSD,
      totalRevenueUSD,
      totalProfitUSD,
      sharedCostPerKgUSD,
      rawRequired,
      rawDifference,
      isShortage,
      items,
      avgMargin
    };
  }, [quoteRows, costs, yieldMode, globalWastage, globalWastageKg, globalWastageMode, finalOverrides, exchangeRate]);

  useEffect(() => {
    if (yieldMode === 'global' && calculations.totalOutput > 0) {
      if (globalWastageMode === 'percentage') {
        const currentRawRequired = calculations.totalOutput / ((100 - globalWastage) / 100);
        setGlobalWastageKg(Number((currentRawRequired - calculations.totalOutput).toFixed(2)));
      } else {
        const currentRawRequired = calculations.totalOutput + globalWastageKg;
        if (currentRawRequired > 0) {
          setGlobalWastage(Number(((globalWastageKg / currentRawRequired) * 100).toFixed(1)));
        }
      }
    }
  }, [globalWastage, globalWastageKg, globalWastageMode, yieldMode, calculations.totalOutput]);

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
    const exportData = { quoteRows, costs, yieldMode, globalWastageMode, globalWastage, globalWastageKg, finalOverrides, exchangeRate };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reverse-calc-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Export Successful' });
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.quoteRows) setQuoteRows(data.quoteRows);
        if (data.costs) setCosts(data.costs);
        if (data.yieldMode) setYieldMode(data.yieldMode);
        if (data.globalWastageMode) setGlobalWastageMode(data.globalWastageMode);
        if (data.globalWastage !== undefined) setGlobalWastage(data.globalWastage);
        if (data.globalWastageKg !== undefined) setGlobalWastageKg(data.globalWastageKg);
        if (data.finalOverrides) setFinalOverrides(data.finalOverrides);
        if (data.exchangeRate) setExchangeRate(data.exchangeRate);
        toast({ title: 'Import Successful' });
      } catch (err) {
        toast({ variant: 'destructive', title: 'Import Failed' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="bg-muted/30 min-h-screen py-6 px-4 sm:px-6 lg:px-8 font-body">
      <div className="container mx-auto max-w-7xl px-0">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" className="pl-0 h-9">
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">1 USD = {exchangeRate.toFixed(2)} INR</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFetchRate} disabled={isFetchingRate}>
              {isFetchingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="mb-8 overflow-x-auto">
            <div className="flex items-center justify-center gap-6 min-w-max text-xs font-bold uppercase tracking-widest text-muted-foreground py-2">
                <span className={cn("flex items-center gap-2", step === 1 && "text-primary")}>
                    <span className={cn("w-6 h-6 rounded-full border flex items-center justify-center", step === 1 && "border-primary bg-primary text-white")}>1</span>
                    Buyer Quote
                </span>
                <ChevronRight className="h-4 w-4 opacity-30" />
                <span className={cn("flex items-center gap-2", step === 2 && "text-primary")}>
                    <span className={cn("w-6 h-6 rounded-full border flex items-center justify-center", step === 2 && "border-primary bg-primary text-white")}>2</span>
                    Costs
                </span>
                <ChevronRight className="h-4 w-4 opacity-30" />
                <span className={cn("flex items-center gap-2", step === 3 && "text-primary")}>
                    <span className={cn("w-6 h-6 rounded-full border flex items-center justify-center", step === 3 && "border-primary bg-primary text-white")}>3</span>
                    Yield
                </span>
                <ChevronRight className="h-4 w-4 opacity-30" />
                <span className={cn("flex items-center gap-2", step === 4 && "text-primary")}>
                    <span className={cn("w-6 h-6 rounded-full border flex items-center justify-center", step === 4 && "border-primary bg-primary text-white")}>4</span>
                    Analysis
                </span>
            </div>
        </div>

        <main className="space-y-4">
          {step === 1 && (
            <Card className="shadow-sm border-none overflow-hidden">
              <CardHeader className="bg-primary/5 border-b p-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-3">
                    <ArrowRightLeft className="h-6 w-6 text-primary" />
                    Step 1: Buyer Offer Details
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="uppercase font-bold" onClick={() => fileInputRef.current?.click()}>
                    <FileUp className="h-4 w-4 mr-2" /> Import JSON
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="application/json" onChange={handleImportJson} />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="hidden md:block overflow-x-auto">
                  <Table className="table-auto w-full">
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                        <TableHead className="w-[120px]">Length</TableHead>
                        <TableHead className="w-[150px] text-right">Qty (kg)</TableHead>
                        <TableHead className="w-[180px] text-right">Offer ($/kg)</TableHead>
                        <TableHead className="w-[180px] text-right">Total ($)</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quoteRows.map(row => (
                        <TableRow key={row.id} className="hover:bg-muted/5">
                            <TableCell className="p-2">
                                <Select value={row.length} onValueChange={(v) => updateQuoteRow(row.id, 'length', v)}>
                                    <SelectTrigger className="h-9 text-base"><SelectValue /></SelectTrigger>
                                    <SelectContent>{lengths.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell className="p-2 text-right">
                                <Input type="number" className="h-9 text-right text-base font-medium" value={row.quantity} onChange={e => updateQuoteRow(row.id, 'quantity', Number(e.target.value))} />
                            </TableCell>
                            <TableCell className="p-2 text-right">
                                <Input type="number" className="h-9 text-right font-bold text-base" value={row.buyerPriceUSD} onChange={e => updateQuoteRow(row.id, 'buyerPriceUSD', Number(e.target.value))} />
                            </TableCell>
                            <TableCell className="p-2 text-right font-bold text-base">
                                {formatUSD((Number(row.quantity) || 0) * (Number(row.buyerPriceUSD) || 0))}
                            </TableCell>
                            <TableCell className="p-2">
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeQuoteRow(row.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="border-t-2">
                            <TableCell colSpan={3} className="text-right font-bold py-4 text-lg">Grand Total Offer:</TableCell>
                            <TableCell className="text-right font-black py-4 text-primary text-xl">
                                {formatUSD(calculations.buyerQuoteGrandTotal)}
                            </TableCell>
                            <TableCell />
                        </TableRow>
                    </TableFooter>
                  </Table>
                </div>
                
                <div className="md:hidden space-y-4">
                   {quoteRows.map(row => (
                     <Card key={row.id} className="p-4 bg-muted/10 border-dashed relative">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-muted-foreground" onClick={() => removeQuoteRow(row.id)}><Trash2 className="h-4 w-4" /></Button>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                           <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Length</Label>
                              <Select value={row.length} onValueChange={(v) => updateQuoteRow(row.id, 'length', v)}>
                                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>{lengths.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                </Select>
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Qty (kg)</Label>
                              <Input type="number" className="h-9 text-right text-sm" value={row.quantity} onChange={e => updateQuoteRow(row.id, 'quantity', Number(e.target.value))} />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Offer ($/kg)</Label>
                              <Input type="number" className="h-9 text-right font-bold text-sm" value={row.buyerPriceUSD} onChange={e => updateQuoteRow(row.id, 'buyerPriceUSD', Number(e.target.value))} />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Row Total</Label>
                              <p className="h-9 flex items-center justify-end font-bold text-sm"> {formatUSD((Number(row.quantity) || 0) * (Number(row.buyerPriceUSD) || 0))}</p>
                           </div>
                        </div>
                     </Card>
                   ))}
                   <div className="p-4 bg-primary/5 rounded-lg flex justify-between items-center mt-6 border-2 border-primary/20">
                      <span className="text-sm font-bold uppercase text-muted-foreground">Grand Total Offer:</span>
                      <span className="text-xl font-black text-primary">{formatUSD(calculations.buyerQuoteGrandTotal)}</span>
                   </div>
                </div>

                <Button onClick={addQuoteRow} variant="outline" size="lg" className="mt-6 w-full border-dashed text-sm font-bold">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Another Length
                </Button>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t justify-end p-4 sm:p-6">
                <Button onClick={nextStep} size="lg" className="px-10 text-sm uppercase font-black">Next: Shared Costs <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && (
            <Card className="shadow-sm border-none overflow-hidden">
               <CardHeader className="bg-primary/5 border-b p-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <Coins className="h-6 w-6 text-primary" />
                  Step 2: Shared Batch Costs (INR)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <Label className="text-primary font-black text-xs uppercase tracking-[0.2em]">Material Procurement</Label>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="rawPurchase" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Raw Hair (kg)</Label>
                                <Input id="rawPurchase" className="h-10 text-base" type="number" value={costs.totalRawPurchase} onChange={e => setCosts(c => ({...c, totalRawPurchase: Number(e.target.value)}))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rawPrice" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Price/kg (₹)</Label>
                                <Input id="rawPrice" className="h-10 text-base" type="number" value={costs.rawHairPrice} onChange={e => setCosts(c => ({...c, rawHairPrice: Number(e.target.value)}))} />
                                <p className="text-[10px] text-muted-foreground text-right italic font-medium">≈ {formatUSD(costs.rawHairPrice / exchangeRate)}</p>
                            </div>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <Label className="text-primary font-black text-xs uppercase tracking-[0.2em]">Operational Overheads (₹/kg)</Label>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { label: 'Processing & Labor', key: 'processing' },
                                { label: 'Logistics & Shipping', key: 'logistics' },
                                { label: 'Other / Customs', key: 'other' }
                            ].map((cost) => (
                                <div key={cost.key} className="grid grid-cols-[1fr_auto] gap-4 items-center">
                                    <Label className="text-sm font-medium text-muted-foreground">{cost.label}</Label>
                                    <div className="w-32 space-y-1">
                                        <Input type="number" className="h-9 text-right text-sm" value={(costs as any)[cost.key]} onChange={e => setCosts(c => ({...c, [cost.key]: Number(e.target.value)}))} />
                                        <p className="text-[10px] text-muted-foreground text-right italic">≈ {formatUSD((costs as any)[cost.key] / exchangeRate)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-muted/20 rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-4 border border-dashed border-primary/20">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shadow-inner">
                        <Weight className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-1">Total Batch Cost Pool</h4>
                        <p className="text-3xl font-black text-primary leading-tight">
                          {formatINR(calculations.totalCostPoolINR)}
                        </p>
                        <p className="text-sm font-bold text-muted-foreground opacity-60">≈ {formatUSD(calculations.totalCostPoolUSD)}</p>
                    </div>
                    <Separator className="w-1/2" />
                    <p className="text-xs text-muted-foreground px-6 leading-relaxed italic">
                        This material cost is distributed across {calculations.totalOutput} kg of final output.
                    </p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t justify-between p-4 sm:p-6">
                <Button onClick={prevStep} variant="outline" size="lg" className="text-sm uppercase font-bold"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={nextStep} size="lg" className="px-10 text-sm uppercase font-black">Next: Yield & Efficiency <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          )}

          {step === 3 && (
            <Card className="shadow-sm border-none overflow-hidden">
               <CardHeader className="bg-primary/5 border-b p-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <Scale className="h-6 w-6 text-primary" />
                  Step 3: Wastage & Yield Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <div className="flex gap-4 mb-8 max-w-lg mx-auto">
                    <Button 
                        variant={yieldMode === 'individual' ? 'default' : 'outline'} 
                        className="flex-1 h-auto py-4 flex-col gap-2 text-sm font-black uppercase tracking-tight"
                        onClick={() => setYieldMode('individual')}
                    >
                        <Layers className="h-5 w-5" />
                        <span>Individual Yields</span>
                    </Button>
                    <Button 
                        variant={yieldMode === 'global' ? 'default' : 'outline'} 
                        className="flex-1 h-auto py-4 flex-col gap-2 text-sm font-black uppercase tracking-tight"
                        onClick={() => setYieldMode('global')}
                    >
                        <TrendingDown className="h-5 w-5" />
                        <span>Global Wastage</span>
                    </Button>
                </div>

                {yieldMode === 'global' ? (
                    <div className="max-w-md mx-auto space-y-6 p-8 border-2 rounded-2xl bg-muted/5 border-dashed">
                        <div className="flex bg-background p-1 rounded-xl border shadow-sm">
                            <Button variant={globalWastageMode === 'percentage' ? 'secondary' : 'ghost'} size="sm" onClick={() => setGlobalWastageMode('percentage')} className="flex-1 h-9 text-xs uppercase font-black">Percentage (%)</Button>
                            <Button variant={globalWastageMode === 'kg' ? 'secondary' : 'ghost'} size="sm" onClick={() => setGlobalWastageMode('kg')} className="flex-1 h-9 text-xs uppercase font-black">Weight (kg)</Button>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-3">
                                {globalWastageMode === 'percentage' ? (
                                    <><Input type="number" value={globalWastage} onChange={e => setGlobalWastage(Math.min(99, Math.max(0, Number(e.target.value))))} className="text-3xl h-14 w-24 text-center font-black" /><span className="text-2xl font-black text-muted-foreground">%</span></>
                                ) : (
                                    <><Input type="number" value={globalWastageKg} onChange={e => setGlobalWastageKg(Math.max(0, Number(e.target.value)))} className="text-3xl h-14 w-32 text-center font-black" /><span className="text-2xl font-black text-muted-foreground">kg</span></>
                                )}
                            </div>
                            <p className="text-xs uppercase tracking-widest font-black text-muted-foreground mt-4 opacity-60">
                                {globalWastageMode === 'percentage' ? `Theoretical loss of ${globalWastageKg.toFixed(2)} kg` : `Yield efficiency of ${globalWastage.toFixed(1)}%`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto border-2 rounded-xl">
                        <Table className="table-auto w-full">
                            <TableHeader><TableRow className="bg-muted/30">
                                <TableHead className="h-10 py-0 font-black">Output Length</TableHead>
                                <TableHead className="h-10 py-0 text-right font-black">Requested Qty</TableHead>
                                <TableHead className="h-10 py-0 text-right w-32 font-black">Yield Efficiency %</TableHead>
                                <TableHead className="h-10 py-0 text-right font-black">Min. Raw Needed</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {quoteRows.map(row => (
                                    <TableRow key={row.id} className="hover:bg-muted/10">
                                        <TableCell className="p-3 font-black text-base">{row.length}</TableCell>
                                        <TableCell className="p-3 text-right font-medium">{row.quantity} kg</TableCell>
                                        <TableCell className="p-2">
                                            <Input type="number" className="h-9 w-24 ml-auto text-right text-base font-bold border-primary/20" value={row.yield} onChange={e => updateQuoteRow(row.id, 'yield', Number(e.target.value))} />
                                        </TableCell>
                                        <TableCell className="p-3 text-right text-muted-foreground font-medium">{(row.quantity / (row.yield / 100)).toFixed(2)} kg</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border bg-muted/5 text-center">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest block mb-2 opacity-50">Theoretical Raw Required</Label>
                        <p className="text-2xl font-black leading-tight">{calculations.rawRequired.toFixed(2)} kg</p>
                    </div>
                    <div className={cn("p-4 rounded-xl border text-center transition-colors shadow-sm", calculations.isShortage ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200")}>
                        <Label className={cn("text-[10px] uppercase font-black tracking-widest block mb-2", calculations.isShortage ? "text-red-700" : "text-green-700")}>{calculations.isShortage ? "Procurement Shortage" : "Procurement Excess"}</Label>
                        <p className={cn("text-2xl font-black leading-tight", calculations.isShortage ? "text-red-800" : "text-green-800")}>{Math.abs(calculations.rawDifference).toFixed(2)} kg</p>
                    </div>
                    <div className="p-4 rounded-xl border bg-muted/5 text-center hidden md:block">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest block mb-2 opacity-50">Total Batch Output</Label>
                        <p className="text-2xl font-black leading-tight">{calculations.totalOutput} kg</p>
                    </div>
                    <div className="p-4 rounded-xl border bg-muted/5 text-center hidden md:block">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest block mb-2 opacity-50">Overall Yield Rate</Label>
                        <p className="text-2xl font-black leading-tight">{(calculations.totalOutput / (calculations.rawRequired || 1) * 100).toFixed(1)}%</p>
                    </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t justify-between p-4 sm:p-6">
                <Button onClick={prevStep} variant="outline" size="lg" className="text-sm uppercase font-bold"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={nextStep} size="lg" className="px-12 text-sm uppercase font-black">Show Final Analysis <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                 <Card className="shadow-lg overflow-hidden border-primary/20">
                    <CardHeader className="bg-primary text-primary-foreground p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight">Final Batch Analysis</CardTitle>
                                <CardDescription className="text-primary-foreground/80 text-sm font-medium mt-1 tracking-wide">Profitability breakdown with shared cost allocation.</CardDescription>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button onClick={handleExportJson} variant="outline" className="flex-1 sm:flex-initial h-10 bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs uppercase tracking-widest">
                                <FileDown className="mr-2 h-4 w-4" /> Export JSON
                              </Button>
                              <Button onClick={handleCreateQuotation} variant="secondary" size="lg" className="flex-1 sm:flex-initial h-10 font-black text-xs uppercase tracking-widest shadow-xl border-none">
                                  <FilePlus2 className="mr-2 h-4 w-4" /> Create Quotation
                              </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="hidden md:block overflow-x-auto">
                             <Table className="table-auto w-full">
                                <TableHeader><TableRow className="bg-muted/50 border-b-2">
                                    <TableHead className="font-black h-10 py-0 uppercase text-[10px] tracking-widest">Size</TableHead>
                                    <TableHead className="text-right font-black h-10 py-0 uppercase text-[10px] tracking-widest">Buyer Offer ($)</TableHead>
                                    <TableHead className="text-right font-black h-10 py-0 uppercase text-[10px] tracking-widest bg-muted/20">Our Cost ($)</TableHead>
                                    <TableHead className="text-right font-black h-10 py-0 uppercase text-[10px] tracking-widest text-red-600">Min Price ($)</TableHead>
                                    <TableHead className="text-right font-black h-10 py-0 uppercase text-[10px] tracking-widest text-green-600">Target Price ($)</TableHead>
                                    <TableHead className="text-right font-black h-10 py-0 uppercase text-[10px] tracking-widest bg-primary/5">Final Negotiated ($)</TableHead>
                                    <TableHead className="text-center font-black h-10 py-0 uppercase text-[10px] tracking-widest">Status</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {calculations.items.map(row => (
                                        <TableRow key={row.id} className="hover:bg-muted/10 border-b">
                                            <TableCell className="font-black text-lg p-3 w-[100px]">{row.length}</TableCell>
                                            <TableCell className="text-right font-bold text-muted-foreground p-3 w-[140px] text-base">${row.buyerPriceUSD.toFixed(0)}</TableCell>
                                            <TableCell className="text-right font-black bg-muted/20 p-3 w-[140px] text-base">${row.costUSD.toFixed(2)}</TableCell>
                                            <TableCell className="text-right text-xs text-red-600 font-bold p-3 w-[120px] opacity-60">${row.minPrice.toFixed(0)}</TableCell>
                                            <TableCell className="text-right text-xs text-green-600 font-bold p-3 w-[120px] opacity-60">${row.targetPrice.toFixed(0)}</TableCell>
                                            <TableCell className="p-2 bg-primary/5 w-[160px]">
                                                <Input type="number" className="h-10 text-right font-black text-lg border-primary/20 focus-visible:ring-primary focus:bg-white w-28 ml-auto" value={row.finalPrice} onChange={e => setFinalOverrides(prev => ({...prev, [row.id]: Number(e.target.value)}))} />
                                            </TableCell>
                                            <TableCell className="text-center p-3 w-[120px]">
                                                <Badge className={cn("px-3 py-1 uppercase text-[10px] font-black tracking-widest shadow-md", row.status === 'Accept' ? "bg-green-600" : row.status === 'Negotiate' ? "bg-amber-500" : "bg-red-600")}>{row.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                             </Table>
                        </div>
                        <div className="md:hidden space-y-4 p-4">
                           {calculations.items.map(row => (
                              <Card key={row.id} className="p-4 border-2 border-dashed relative overflow-hidden bg-muted/5">
                                 <div className={cn("absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl font-black text-[10px] uppercase text-white shadow-lg", row.status === 'Accept' ? "bg-green-600" : row.status === 'Negotiate' ? "bg-amber-500" : "bg-red-600")}>{row.status}</div>
                                 <div className="flex items-center gap-3 mb-4">
                                    <span className="text-2xl font-black">{row.length}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">/ Share of Batch</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4 border-b border-dashed pb-4 mb-4">
                                    <div className="space-y-1"><Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest block opacity-50">Customer Offer</Label><span className="text-lg font-bold text-muted-foreground">${row.buyerPriceUSD.toFixed(0)}</span></div>
                                    <div className="text-right space-y-1"><Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest block opacity-50">Our Batch Cost</Label><span className="text-lg font-black text-primary">${row.costUSD.toFixed(2)}</span></div>
                                 </div>
                                 <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-primary tracking-widest block">Final Negotiated Selling Price ($/kg)</Label>
                                    <Input type="number" className="h-12 text-2xl font-black border-primary/30 text-center bg-white" value={row.finalPrice} onChange={e => setFinalOverrides(prev => ({...prev, [row.id]: Number(e.target.value)}))} />
                                 </div>
                                 <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-dashed">
                                    <div className="p-2 rounded-lg bg-red-50 text-center border border-red-100"><Label className="text-[9px] uppercase font-black text-red-700 block mb-1">Min Threshold</Label><span className="text-sm font-black text-red-800">${row.minPrice.toFixed(0)}</span></div>
                                    <div className="p-2 rounded-lg bg-green-50 text-center border border-green-100"><Label className="text-[9px] uppercase font-black text-green-700 block mb-1">Target Price</Label><span className="text-sm font-black text-green-800">${row.targetPrice.toFixed(0)}</span></div>
                                 </div>
                              </Card>
                           ))}
                        </div>
                    </CardContent>
                 </Card>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white border shadow-sm">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-muted-foreground flex items-center gap-2 font-black tracking-[0.15em]"><TrendingDown className="h-4 w-4" /> Production Yield</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-2">
                            <p className="text-3xl font-black tracking-tight">{(calculations.totalOutput / (calculations.rawRequired || 1) * 100).toFixed(1)}%</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border shadow-sm">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-muted-foreground flex items-center gap-2 font-black tracking-[0.15em]"><Info className="h-4 w-4" /> Average Batch Margin</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-2">
                            <p className={cn("text-3xl font-black tracking-tight", calculations.avgMargin >= 20 ? "text-green-600" : "text-amber-500")}>
                                {calculations.avgMargin.toFixed(1)}%
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/20 shadow-md">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-primary flex items-center gap-2 font-black tracking-[0.15em]"><CheckCircle2 className="h-4 w-4" /> Estimated Batch Profit</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-2">
                            <p className="text-3xl font-black text-primary tracking-tight">
                                {formatUSD(calculations.totalProfitUSD)}
                            </p>
                        </CardContent>
                    </Card>
                 </div>

                 <div className="flex justify-between items-center pt-6 px-2">
                    <Button onClick={() => setStep(3)} variant="ghost" className="h-10 text-xs uppercase font-black tracking-widest text-muted-foreground hover:bg-muted/50"><ChevronLeft className="mr-2 h-4 w-4" /> Adjust Yields</Button>
                    <Button onClick={() => { if(confirm('Clear all data and start a new production batch?')) setStep(1); }} variant="outline" size="lg" className="h-10 text-xs uppercase font-black tracking-widest border-dashed border-2 px-8">Start New Batch</Button>
                 </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
