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
    <div className="bg-muted/30 min-h-screen py-4 sm:py-6 px-3 sm:px-6 lg:px-8 font-body">
      <div className="container mx-auto max-w-7xl px-0">
        <div className="mb-4 flex items-center justify-between">
          <Button asChild variant="ghost" className="pl-0 h-8 text-xs sm:text-sm">
            <Link href="/">
              <ChevronLeft className="mr-1 h-3 w-3" /> Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-1 sm:gap-2">
            <Globe className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">1 USD = {exchangeRate.toFixed(2)} INR</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleFetchRate} disabled={isFetchingRate}>
              {isFetchingRate ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <div className="mb-6 overflow-x-auto">
            <div className="flex items-center justify-center gap-2 sm:gap-4 min-w-max text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground py-2">
                <span className={cn("flex items-center gap-1.5", step === 1 && "text-primary")}>
                    <span className={cn("w-5 h-5 rounded-full border flex items-center justify-center text-[10px]", step === 1 && "border-primary bg-primary text-white")}>1</span>
                    Buyer Quote
                </span>
                <ChevronRight className="h-3 w-3 opacity-30" />
                <span className={cn("flex items-center gap-1.5", step === 2 && "text-primary")}>
                    <span className={cn("w-5 h-5 rounded-full border flex items-center justify-center text-[10px]", step === 2 && "border-primary bg-primary text-white")}>2</span>
                    Costs
                </span>
                <ChevronRight className="h-3 w-3 opacity-30" />
                <span className={cn("flex items-center gap-1.5", step === 3 && "text-primary")}>
                    <span className={cn("w-5 h-5 rounded-full border flex items-center justify-center text-[10px]", step === 3 && "border-primary bg-primary text-white")}>3</span>
                    Yield
                </span>
                <ChevronRight className="h-3 w-3 opacity-30" />
                <span className={cn("flex items-center gap-1.5", step === 4 && "text-primary")}>
                    <span className={cn("w-5 h-5 rounded-full border flex items-center justify-center text-[10px]", step === 4 && "border-primary bg-primary text-white")}>4</span>
                    Analysis
                </span>
            </div>
        </div>

        <main className="space-y-3">
          {step === 1 && (
            <Card className="shadow-sm border-none overflow-hidden">
              <CardHeader className="bg-primary/5 border-b p-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-primary" />
                    Step 1: Buyer Offer
                  </CardTitle>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={() => fileInputRef.current?.click()}>
                    <FileUp className="h-3 w-3 mr-1.5" /> Import
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="application/json" onChange={handleImportJson} />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="hidden md:block">
                  <Table className="text-sm">
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                        <TableHead className="h-9 py-0">Length</TableHead>
                        <TableHead className="h-9 py-0 text-right">Qty (kg)</TableHead>
                        <TableHead className="h-9 py-0 text-right">Offer ($/kg)</TableHead>
                        <TableHead className="h-9 py-0 text-right">Total ($)</TableHead>
                        <TableHead className="h-9 py-0 w-8"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quoteRows.map(row => (
                        <TableRow key={row.id} className="hover:bg-muted/5">
                            <TableCell className="p-1">
                                <Select value={row.length} onValueChange={(v) => updateQuoteRow(row.id, 'length', v)}>
                                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>{lengths.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell className="p-1">
                                <Input type="number" className="h-8 text-right text-sm" value={row.quantity} onChange={e => updateQuoteRow(row.id, 'quantity', Number(e.target.value))} />
                            </TableCell>
                            <TableCell className="p-1">
                                <Input type="number" className="h-8 text-right font-bold text-sm" value={row.buyerPriceUSD} onChange={e => updateQuoteRow(row.id, 'buyerPriceUSD', Number(e.target.value))} />
                            </TableCell>
                            <TableCell className="p-1 text-right font-medium text-sm">
                                {formatUSD((Number(row.quantity) || 0) * (Number(row.buyerPriceUSD) || 0))}
                            </TableCell>
                            <TableCell className="p-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeQuoteRow(row.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={3} className="text-right font-bold py-2">Grand Total Offer:</TableCell>
                            <TableCell className="text-right font-black py-2 text-primary text-base">
                                {formatUSD(calculations.buyerQuoteGrandTotal)}
                            </TableCell>
                            <TableCell />
                        </TableRow>
                    </TableFooter>
                  </Table>
                </div>
                
                <div className="md:hidden space-y-2">
                   {quoteRows.map(row => (
                     <Card key={row.id} className="p-3 bg-muted/10 border-dashed relative">
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-muted-foreground" onClick={() => removeQuoteRow(row.id)}><Trash2 className="h-3 w-3" /></Button>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                           <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Length</Label>
                              <Select value={row.length} onValueChange={(v) => updateQuoteRow(row.id, 'length', v)}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>{lengths.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                </Select>
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Qty (kg)</Label>
                              <Input type="number" className="h-8 text-right text-xs" value={row.quantity} onChange={e => updateQuoteRow(row.id, 'quantity', Number(e.target.value))} />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Offer ($/kg)</Label>
                              <Input type="number" className="h-8 text-right font-bold text-xs" value={row.buyerPriceUSD} onChange={e => updateQuoteRow(row.id, 'buyerPriceUSD', Number(e.target.value))} />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Total Row ($)</Label>
                              <p className="h-8 flex items-center justify-end font-bold text-xs"> {formatUSD((Number(row.quantity) || 0) * (Number(row.buyerPriceUSD) || 0))}</p>
                           </div>
                        </div>
                     </Card>
                   ))}
                   <div className="p-3 bg-primary/5 rounded-lg flex justify-between items-center mt-4">
                      <span className="text-xs font-bold uppercase text-muted-foreground">Grand Total Offer:</span>
                      <span className="text-base font-black text-primary">{formatUSD(calculations.buyerQuoteGrandTotal)}</span>
                   </div>
                </div>

                <Button onClick={addQuoteRow} variant="outline" size="sm" className="mt-3 w-full border-dashed text-xs h-8">
                  <PlusCircle className="mr-2 h-3.5 w-3.5" /> Add Another Length
                </Button>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t justify-end p-3 sm:p-4">
                <Button onClick={nextStep} size="sm" className="h-8 px-8 text-xs uppercase font-bold">Next: Costing <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && (
            <Card className="shadow-sm border-none overflow-hidden">
               <CardHeader className="bg-primary/5 border-b p-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Step 2: Shared Batch Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-primary font-bold text-xs uppercase tracking-wider">Material Procurement</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="rawPurchase" className="text-[10px] uppercase font-bold text-muted-foreground">Raw Hair (kg)</Label>
                                <Input id="rawPurchase" className="h-8 text-sm" type="number" value={costs.totalRawPurchase} onChange={e => setCosts(c => ({...c, totalRawPurchase: Number(e.target.value)}))} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="rawPrice" className="text-[10px] uppercase font-bold text-muted-foreground">Price/kg (₹)</Label>
                                <Input id="rawPrice" className="h-8 text-sm" type="number" value={costs.rawHairPrice} onChange={e => setCosts(c => ({...c, rawHairPrice: Number(e.target.value)}))} />
                                <p className="text-[9px] text-muted-foreground text-right italic font-medium">≈ {formatUSD(costs.rawHairPrice / exchangeRate)}</p>
                            </div>
                        </div>
                    </div>
                    <Separator className="opacity-50" />
                    <div className="space-y-2">
                        <Label className="text-primary font-bold text-xs uppercase tracking-wider">Operational Overheads (₹/kg)</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { label: 'Processing', key: 'processing' },
                                { label: 'Logistics', key: 'logistics' },
                                { label: 'Overheads', key: 'other' }
                            ].map((cost) => (
                                <div key={cost.key} className="grid grid-cols-[1fr_auto] gap-2 items-center">
                                    <Label className="text-xs font-medium text-muted-foreground">{cost.label}</Label>
                                    <div className="w-24 space-y-0.5">
                                        <Input type="number" className="h-7 text-right text-xs" value={(costs as any)[cost.key]} onChange={e => setCosts(c => ({...c, [cost.key]: Number(e.target.value)}))} />
                                        <p className="text-[8px] text-muted-foreground text-right italic">≈ {formatUSD((costs as any)[cost.key] / exchangeRate)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 flex flex-col justify-center items-center text-center space-y-2 border border-dashed">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-1">
                        <Weight className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm uppercase text-muted-foreground">Total Cost Pool</h4>
                        <p className="text-2xl font-black text-primary leading-tight">
                          {formatINR(calculations.totalCostPoolINR)}
                        </p>
                        <p className="text-xs font-bold text-muted-foreground opacity-60">≈ {formatUSD(calculations.totalCostPoolINR / exchangeRate)}</p>
                    </div>
                    <p className="text-[9px] text-muted-foreground px-4 leading-relaxed italic border-t pt-2 mt-2">
                        Allocated across {calculations.totalOutput} kg of final output.
                    </p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t justify-between p-3 sm:p-4">
                <Button onClick={prevStep} variant="outline" size="sm" className="h-8 text-xs uppercase font-bold"><ChevronLeft className="mr-1.5 h-3.5 w-3.5" /> Back</Button>
                <Button onClick={nextStep} size="sm" className="h-8 px-8 text-xs uppercase font-bold">Next: Yields <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
              </CardFooter>
            </Card>
          )}

          {step === 3 && (
            <Card className="shadow-sm border-none overflow-hidden">
               <CardHeader className="bg-primary/5 border-b p-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Step 3: Wastage & Yield
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="flex gap-2 mb-4">
                    <Button 
                        variant={yieldMode === 'individual' ? 'default' : 'outline'} 
                        className="flex-1 h-auto py-2.5 flex-col gap-0.5 text-xs font-bold uppercase tracking-tight"
                        onClick={() => setYieldMode('individual')}
                    >
                        <Layers className="h-3.5 w-3.5 mb-0.5" />
                        <span>Individual Yields</span>
                    </Button>
                    <Button 
                        variant={yieldMode === 'global' ? 'default' : 'outline'} 
                        className="flex-1 h-auto py-2.5 flex-col gap-0.5 text-xs font-bold uppercase tracking-tight"
                        onClick={() => setYieldMode('global')}
                    >
                        <TrendingDown className="h-3.5 w-3.5 mb-0.5" />
                        <span>Global Wastage</span>
                    </Button>
                </div>

                {yieldMode === 'global' ? (
                    <div className="max-w-xs mx-auto space-y-4 p-6 border rounded-xl bg-muted/10 border-dashed">
                        <div className="flex bg-background p-0.5 rounded-lg border shadow-sm">
                            <Button variant={globalWastageMode === 'percentage' ? 'secondary' : 'ghost'} size="sm" onClick={() => setGlobalWastageMode('percentage')} className="flex-1 h-7 text-[10px] uppercase font-bold">Percent</Button>
                            <Button variant={globalWastageMode === 'kg' ? 'secondary' : 'ghost'} size="sm" onClick={() => setGlobalWastageMode('kg')} className="flex-1 h-7 text-[10px] uppercase font-bold">Weight (kg)</Button>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                                {globalWastageMode === 'percentage' ? (
                                    <><Input type="number" value={globalWastage} onChange={e => setGlobalWastage(Math.min(99, Math.max(0, Number(e.target.value))))} className="text-xl h-10 w-20 text-center font-black" /><span className="text-lg font-bold">%</span></>
                                ) : (
                                    <><Input type="number" value={globalWastageKg} onChange={e => setGlobalWastageKg(Math.max(0, Number(e.target.value)))} className="text-xl h-10 w-28 text-center font-black" /><span className="text-lg font-bold">kg</span></>
                                )}
                            </div>
                            <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mt-3">
                                {globalWastageMode === 'percentage' ? `≈ ${globalWastageKg.toFixed(2)} kg lost` : `≈ ${globalWastage.toFixed(1)}% rate`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                      <div className="hidden md:block border rounded-lg overflow-hidden">
                          <Table className="text-xs">
                              <TableHeader><TableRow className="bg-muted/30">
                                  <TableHead className="h-8 py-0">Length</TableHead>
                                  <TableHead className="h-8 py-0 text-right">Qty (kg)</TableHead>
                                  <TableHead className="h-8 py-0 text-right w-24">Yield %</TableHead>
                                  <TableHead className="h-8 py-0 text-right">Theoretical Raw (kg)</TableHead>
                              </TableRow></TableHeader>
                              <TableBody>
                                  {quoteRows.map(row => (
                                      <TableRow key={row.id}>
                                          <TableCell className="p-2 font-bold">{row.length}</TableCell>
                                          <TableCell className="p-2 text-right">{row.quantity} kg</TableCell>
                                          <TableCell className="p-1">
                                              <Input type="number" className="h-7 w-20 ml-auto text-right text-xs" value={row.yield} onChange={e => updateQuoteRow(row.id, 'yield', Number(e.target.value))} />
                                          </TableCell>
                                          <TableCell className="p-2 text-right text-muted-foreground">{(row.quantity / (row.yield / 100)).toFixed(2)} kg</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                      <div className="md:hidden space-y-2">
                         {quoteRows.map(row => (
                           <Card key={row.id} className="p-2 border-dashed bg-muted/5">
                             <div className="flex justify-between items-center mb-2 border-b pb-1">
                               <span className="text-xs font-black">{row.length}</span>
                               <span className="text-xs font-medium text-muted-foreground">{row.quantity} kg requested</span>
                             </div>
                             <div className="grid grid-cols-2 gap-2 items-end">
                                <div className="space-y-1">
                                  <Label className="text-[9px] uppercase font-bold text-muted-foreground">Adjust Yield %</Label>
                                  <Input type="number" className="h-7 text-right text-xs" value={row.yield} onChange={e => updateQuoteRow(row.id, 'yield', Number(e.target.value))} />
                                </div>
                                <div className="text-right pb-1">
                                   <span className="text-[9px] uppercase font-bold text-muted-foreground block">Raw Req.</span>
                                   <span className="text-xs font-bold">{(row.quantity / (row.yield / 100)).toFixed(2)} kg</span>
                                </div>
                             </div>
                           </Card>
                         ))}
                      </div>
                    </>
                )}

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-lg border bg-muted/5 text-center">
                        <Label className="text-[9px] uppercase font-black text-muted-foreground opacity-60">Theoretical Req.</Label>
                        <p className="text-base font-black leading-tight mt-1">{calculations.rawRequired.toFixed(2)} kg</p>
                    </div>
                    <div className={cn("p-2.5 rounded-lg border text-center transition-colors", calculations.isShortage ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200")}>
                        <Label className={cn("text-[9px] uppercase font-black", calculations.isShortage ? "text-red-700" : "text-green-700")}>{calculations.isShortage ? "Shortage" : "Excess"}</Label>
                        <p className={cn("text-base font-black leading-tight mt-1", calculations.isShortage ? "text-red-800" : "text-green-800")}>{Math.abs(calculations.rawDifference).toFixed(2)} kg</p>
                    </div>
                    <div className="p-2.5 rounded-lg border bg-muted/5 text-center hidden md:block">
                        <Label className="text-[9px] uppercase font-black text-muted-foreground opacity-60">Total Output</Label>
                        <p className="text-base font-black leading-tight mt-1">{calculations.totalOutput} kg</p>
                    </div>
                    <div className="p-2.5 rounded-lg border bg-muted/5 text-center hidden md:block">
                        <Label className="text-[9px] uppercase font-black text-muted-foreground opacity-60">Efficiency Rate</Label>
                        <p className="text-base font-black leading-tight mt-1">{(calculations.totalOutput / (calculations.rawRequired || 1) * 100).toFixed(1)}%</p>
                    </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t justify-between p-3 sm:p-4">
                <Button onClick={prevStep} variant="outline" size="sm" className="h-8 text-xs uppercase font-bold"><ChevronLeft className="mr-1.5 h-3.5 w-3.5" /> Back</Button>
                <Button onClick={nextStep} size="sm" className="h-8 px-8 text-xs uppercase font-bold">Show Analysis <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
              </CardFooter>
            </Card>
          )}

          {step === 4 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-400">
                 <Card className="shadow-md overflow-hidden border-primary/20">
                    <CardHeader className="bg-primary text-primary-foreground p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight">Final Analysis</CardTitle>
                                <CardDescription className="text-primary-foreground/70 text-xs font-medium">Weighted batch cost allocation results.</CardDescription>
                            </div>
                            <div className="flex gap-1.5 w-full sm:w-auto">
                              <Button onClick={handleExportJson} variant="outline" className="flex-1 sm:flex-initial h-8 bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-[10px] uppercase">
                                <FileDown className="mr-1.5 h-3.5 w-3.5" /> Export
                              </Button>
                              <Button onClick={handleCreateQuotation} variant="secondary" size="sm" className="flex-1 sm:flex-initial h-8 font-black text-[10px] uppercase shadow-lg">
                                  <FilePlus2 className="mr-1.5 h-3.5 w-3.5" /> Create Quotation
                              </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="hidden md:block overflow-x-auto">
                             <Table className="text-xs">
                                <TableHeader><TableRow className="bg-muted/50 border-b-2">
                                    <TableHead className="font-black h-8 py-0 uppercase">Size</TableHead>
                                    <TableHead className="text-right font-black h-8 py-0 uppercase">Offer ($/kg)</TableHead>
                                    <TableHead className="text-right font-black h-8 py-0 uppercase bg-muted/20">Our Cost ($/kg)</TableHead>
                                    <TableHead className="text-right font-black h-8 py-0 uppercase text-red-600">Min ($/kg)</TableHead>
                                    <TableHead className="text-right font-black h-8 py-0 uppercase text-green-600">Target ($/kg)</TableHead>
                                    <TableHead className="text-right font-black h-8 py-0 uppercase bg-primary/5">Final Negotiated ($/kg)</TableHead>
                                    <TableHead className="text-center font-black h-8 py-0 uppercase">Status</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {calculations.items.map(row => (
                                        <TableRow key={row.id} className="hover:bg-muted/10">
                                            <TableCell className="font-black text-sm p-2">{row.length}</TableCell>
                                            <TableCell className="text-right font-medium text-muted-foreground p-2">${row.buyerPriceUSD.toFixed(0)}</TableCell>
                                            <TableCell className="text-right font-bold bg-muted/20 p-2">${row.costUSD.toFixed(2)}</TableCell>
                                            <TableCell className="text-right text-[10px] text-red-600 font-bold p-2">${row.minPrice.toFixed(0)}</TableCell>
                                            <TableCell className="text-right text-[10px] text-green-600 font-bold p-2">${row.targetPrice.toFixed(0)}</TableCell>
                                            <TableCell className="p-1 bg-primary/5">
                                                <Input type="number" className="h-7 text-right font-black text-sm border-primary/20 focus-visible:ring-primary focus:bg-white w-24 ml-auto" value={row.finalPrice} onChange={e => setFinalOverrides(prev => ({...prev, [row.id]: Number(e.target.value)}))} />
                                            </TableCell>
                                            <TableCell className="text-center p-2">
                                                <Badge className={cn("px-2 py-0.5 uppercase text-[9px] font-black tracking-tighter shadow-none", row.status === 'Accept' ? "bg-green-600" : row.status === 'Negotiate' ? "bg-amber-500" : "bg-red-600")}>{row.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                             </Table>
                        </div>
                        <div className="md:hidden space-y-3 p-3">
                           {calculations.items.map(row => (
                              <Card key={row.id} className="p-3 border-dashed relative overflow-hidden">
                                 <div className={cn("absolute top-0 right-0 px-3 py-1 rounded-bl-lg font-black text-[9px] uppercase text-white shadow-sm", row.status === 'Accept' ? "bg-green-600" : row.status === 'Negotiate' ? "bg-amber-500" : "bg-red-600")}>{row.status}</div>
                                 <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg font-black">{row.length}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">/ Shared Batch</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-3 border-b border-dashed pb-3 mb-3">
                                    <div><Label className="text-[9px] uppercase font-bold text-muted-foreground block">Customer Offer</Label><span className="text-sm font-bold text-muted-foreground">${row.buyerPriceUSD.toFixed(0)}</span></div>
                                    <div className="text-right"><Label className="text-[9px] uppercase font-bold text-muted-foreground block">Our Batch Cost</Label><span className="text-sm font-black">${row.costUSD.toFixed(2)}</span></div>
                                 </div>
                                 <div className="space-y-2">
                                    <Label className="text-[9px] uppercase font-black text-primary block">Final Negotiated Selling Price ($/kg)</Label>
                                    <Input type="number" className="h-9 text-lg font-black border-primary/30" value={row.finalPrice} onChange={e => setFinalOverrides(prev => ({...prev, [row.id]: Number(e.target.value)}))} />
                                 </div>
                                 <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                                    <div className="p-1.5 rounded bg-red-50 text-center"><Label className="text-[8px] uppercase font-bold text-red-700 block">Min Threshold</Label><span className="text-xs font-bold text-red-800">${row.minPrice.toFixed(0)}</span></div>
                                    <div className="p-1.5 rounded bg-green-50 text-center"><Label className="text-[8px] uppercase font-bold text-green-700 block">Target Selling</Label><span className="text-xs font-bold text-green-800">${row.targetPrice.toFixed(0)}</span></div>
                                 </div>
                              </Card>
                           ))}
                        </div>
                    </CardContent>
                 </Card>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card className="bg-muted/5 border-dashed shadow-none">
                        <CardHeader className="p-3 pb-1"><CardTitle className="text-[10px] uppercase text-muted-foreground flex items-center gap-1.5 font-black tracking-wider"><TrendingDown className="h-3 w-3" /> Production Yield</CardTitle></CardHeader>
                        <CardContent className="p-3 pt-1">
                            <p className="text-xl font-black">{(calculations.totalOutput / (calculations.rawRequired || 1) * 100).toFixed(1)}%</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/5 border-dashed shadow-none">
                        <CardHeader className="p-3 pb-1"><CardTitle className="text-[10px] uppercase text-muted-foreground flex items-center gap-1.5 font-black tracking-wider"><Info className="h-3 w-3" /> Average Margin</CardTitle></CardHeader>
                        <CardContent className="p-3 pt-1">
                            <p className={cn("text-xl font-black", calculations.avgMargin >= 20 ? "text-green-600" : "text-amber-500")}>
                                {calculations.avgMargin.toFixed(1)}%
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/10 border-primary/20 shadow-none">
                        <CardHeader className="p-3 pb-1"><CardTitle className="text-[10px] uppercase text-primary flex items-center gap-1.5 font-black tracking-wider"><CheckCircle2 className="h-3 w-3" /> Est. Batch Profit</CardTitle></CardHeader>
                        <CardContent className="p-3 pt-1">
                            <p className="text-xl font-black text-primary">
                                {formatUSD(calculations.totalProfitUSD)}
                            </p>
                        </CardContent>
                    </Card>
                 </div>

                 <div className="flex justify-between items-center pt-4">
                    <Button onClick={() => setStep(3)} variant="ghost" className="h-8 text-[10px] uppercase font-black tracking-tighter text-muted-foreground"><ChevronLeft className="mr-1 h-3 w-3" /> Back to Yields</Button>
                    <Button onClick={() => { if(confirm('Are you sure you want to clear all data and start over?')) setStep(1); }} variant="outline" size="sm" className="h-8 text-[10px] uppercase font-black tracking-tighter border-dashed">Start New Batch</Button>
                 </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}