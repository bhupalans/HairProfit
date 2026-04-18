'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  ArrowLeft, 
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
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

// Standard Industry Yield Profile
const YIELD_PROFILE: Record<string, number> = {
  '6"': 90,
  '8"': 88,
  '10"': 85,
  '12"': 82,
  '14"': 80,
  '16"': 78,
  '18"': 75,
  '20"': 72,
  '22"': 70,
  '24"': 68,
  '26"': 65,
  '28"': 62,
  '30"': 60,
};

const lengths = Object.keys(YIELD_PROFILE);

interface Row {
  id: string;
  length: string;
  quantity: string | number;
  buyerPrice: string | number;
  yield: string | number;
  finalPriceOverride?: string | number;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
};

export default function ReverseCalculatorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [config, setConfig] = useState({
    rawHairPrice: 2000, // INR/kg
    usdRate: 83.5, // 1 USD = X INR
    processingCost: 15, // In Pricing Currency/kg
    logisticsCost: 5, // In Pricing Currency/kg
    otherCost: 2, // In Pricing Currency/kg
    pricingCurrency: 'USD',
    displayCurrency: 'USD',
    exchangeRate: 1, // 1 Display = X Pricing
  });

  const [rows, setRows] = useState<Row[]>([
    { id: crypto.randomUUID(), length: '16"', quantity: 10, buyerPrice: 75, yield: 78 },
  ]);

  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const addRow = () => {
    setRows(prev => [
      ...prev,
      { id: crypto.randomUUID(), length: '12"', quantity: 1, buyerPrice: 0, yield: 82 },
    ]);
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof Row, value: string | number) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const newRow = { ...r, [field]: value };
      
      // Auto-fill yield if length changes
      if (field === 'length' && typeof value === 'string') {
        newRow.yield = YIELD_PROFILE[value] || 80;
      }
      
      return newRow;
    }));
  };

  const handleFetchRate = async () => {
    setIsFetchingRate(true);
    const response = await fetchExchangeRate({ 
      baseCurrency: config.displayCurrency, 
      targetCurrency: config.pricingCurrency 
    });
    setIsFetchingRate(false);

    if (response.success && response.data) {
      handleConfigChange('exchangeRate', response.data.rate);
      toast({ title: 'Rate Updated', description: `1 ${config.displayCurrency} = ${response.data.rate.toFixed(4)} ${config.pricingCurrency}` });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch rate.' });
    }
  };

  const calculatedRows = useMemo(() => {
    // 1. Core Logic in Pricing Currency
    const rawPriceInput = (Number(config.rawHairPrice) || 0);
    const usdRate = (Number(config.usdRate) || 1);
    
    // We assume rawPriceInput is always INR based on UI label
    let rawCostPricing = rawPriceInput;
    if (config.pricingCurrency === 'USD') {
        rawCostPricing = rawPriceInput / usdRate;
    }
    
    const rate = Number(config.exchangeRate) || 1;
    
    return rows.map(row => {
      const yieldVal = (Number(row.yield) || 0) / 100;
      const effectiveRawCost = yieldVal > 0 ? rawCostPricing / yieldVal : 0;
      
      // All costs added here are already in Pricing Currency
      const finalCostPricing = effectiveRawCost + (Number(config.processingCost) || 0) + (Number(config.logisticsCost) || 0) + (Number(config.otherCost) || 0);
      
      const minPricePricing = finalCostPricing * 1.08;
      const targetPricePricing = finalCostPricing * 1.20;

      // Convert to Display Currency for UI
      // Value(Display) = Value(Pricing) / Rate
      const finalCostDisp = rate !== 0 ? finalCostPricing / rate : 0;
      const minPriceDisp = rate !== 0 ? minPricePricing / rate : 0;
      const targetPriceDisp = rate !== 0 ? targetPricePricing / rate : 0;

      // Final Price Logic: Editable but defaults to target
      const fPriceDisp = row.finalPriceOverride !== undefined 
        ? Number(row.finalPriceOverride) 
        : Number(targetPriceDisp.toFixed(2));

      let status: 'Reject' | 'Negotiate' | 'Accept' = 'Reject';
      if (fPriceDisp >= targetPriceDisp) status = 'Accept';
      else if (fPriceDisp >= minPriceDisp) status = 'Negotiate';

      return {
        ...row,
        finalCostDisp,
        minPriceDisp,
        targetPriceDisp,
        finalPriceDisp: fPriceDisp,
        status,
      };
    });
  }, [rows, config]);

  const handleCreateQuotation = () => {
    if (!user?.uid) return;
    if (calculatedRows.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Add some lengths first.' });
      return;
    }

    const quotationData = {
      items: calculatedRows.map(row => ({
        length: row.length,
        quantity: Number(row.quantity) || 0,
        price: row.finalPriceDisp
      })),
      currency: config.pricingCurrency,
      displayCurrency: config.displayCurrency,
      exchangeRate: config.exchangeRate
    };

    localStorage.setItem(`u_${user.uid}_profitToQuotation`, JSON.stringify(quotationData));
    toast({ title: 'Transferring...', description: 'Opening Price Quotation Builder.' });
    router.push('/price-quotation');
  };

  const dispSym = currencySymbols[config.displayCurrency] || '$';
  const pricingSym = currencySymbols[config.pricingCurrency] || '$';

  return (
    <div className="bg-muted/30 min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <Button asChild variant="ghost" className="pl-0">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-2 rounded-lg">
              <ArrowRightLeft className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Reverse Pricing Calculator</h1>
              <p className="text-muted-foreground mt-1">Validate buyer quotes and convert them to professional quotations.</p>
            </div>
          </div>
          <Button onClick={handleCreateQuotation} size="lg" className="shadow-lg hover:shadow-xl transition-all">
            <FilePlus2 className="mr-2 h-5 w-5" />
            Create Quotation
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Global Config Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Currency & Exchange
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                 <div className="space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Pricing Currency</Label>
                    <Select value={config.pricingCurrency} onValueChange={v => handleConfigChange('pricingCurrency', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Display Currency</Label>
                    <Select value={config.displayCurrency} onValueChange={v => handleConfigChange('displayCurrency', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 {config.pricingCurrency !== config.displayCurrency && (
                     <div className="space-y-1.5">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Rate (1 {config.displayCurrency} = ?)</Label>
                        <div className="flex gap-2">
                            <Input 
                                type="number" 
                                value={config.exchangeRate} 
                                onChange={e => handleConfigChange('exchangeRate', e.target.value)} 
                            />
                            <Button variant="outline" size="icon" onClick={handleFetchRate} disabled={isFetchingRate}>
                                {isFetchingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                        </div>
                     </div>
                 )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Raw Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="rawPrice">Raw Hair Price (₹/kg)</Label>
                  <Input 
                    id="rawPrice" 
                    type="number" 
                    value={config.rawHairPrice} 
                    onChange={e => handleConfigChange('rawHairPrice', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usdRate">USD Rate (₹ to $)</Label>
                  <Input 
                    id="usdRate" 
                    type="number" 
                    value={config.usdRate} 
                    onChange={e => handleConfigChange('usdRate', e.target.value)} 
                  />
                </div>
                <div className="space-y-2 pt-2 border-t">
                   <div className="flex items-center gap-1.5">
                    <Label htmlFor="procCost">Processing ({pricingSym}/kg)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>Labor, chemical, and electricity costs.</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input 
                    id="procCost" 
                    type="number" 
                    value={config.processingCost} 
                    onChange={e => handleConfigChange('processingCost', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logCost">Logistics ({pricingSym}/kg)</Label>
                  <Input 
                    id="logCost" 
                    type="number" 
                    value={config.logisticsCost} 
                    onChange={e => handleConfigChange('logisticsCost', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherCost">Other Costs ({pricingSym}/kg)</Label>
                  <Input 
                    id="otherCost" 
                    type="number" 
                    value={config.otherCost} 
                    onChange={e => handleConfigChange('otherCost', e.target.value)} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Table Area */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5">
                <div>
                  <CardTitle className="text-xl">BUYER&apos;S QUOTE</CardTitle>
                  <CardDescription>Manage offers and adjust final selling prices in {config.displayCurrency}.</CardDescription>
                </div>
                <Button onClick={addRow} size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Length
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20">
                        <TableHead className="w-[120px]">Length</TableHead>
                        <TableHead className="text-right w-[80px]">Qty (kg)</TableHead>
                        <TableHead className="text-right w-[110px]">Buyer ({dispSym}/kg)</TableHead>
                        <TableHead className="text-right w-[90px]">Yield (%)</TableHead>
                        <TableHead className="text-right w-[100px]">Cost ({dispSym}/kg)</TableHead>
                        <TableHead className="text-right w-[100px]">Min ({dispSym}/kg)</TableHead>
                        <TableHead className="text-right w-[100px]">Target ({dispSym}/kg)</TableHead>
                        <TableHead className="text-right w-[110px] bg-primary/5 font-bold">Final ({dispSym}/kg)</TableHead>
                        <TableHead className="w-[110px]">Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculatedRows.map(row => (
                        <TableRow key={row.id}>
                          <TableCell className="p-2">
                            <Select 
                                value={row.length} 
                                onValueChange={(v) => updateRow(row.id, 'length', v)}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lengths.map(l => (
                                        <SelectItem key={l} value={l}>{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                                type="number" 
                                className="h-9 text-right" 
                                value={row.quantity} 
                                onChange={e => updateRow(row.id, 'quantity', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                             <Input 
                                type="number" 
                                className="h-9 text-right" 
                                value={row.buyerPrice} 
                                onChange={e => updateRow(row.id, 'buyerPrice', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                             <Input 
                                type="number" 
                                className="h-9 text-right text-muted-foreground" 
                                value={row.yield} 
                                onChange={e => updateRow(row.id, 'yield', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="p-2 text-right font-medium text-xs">
                            {dispSym}{row.finalCostDisp.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2 text-right text-muted-foreground text-[10px]">
                            {dispSym}{row.minPriceDisp.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2 text-right text-muted-foreground text-[10px]">
                            {dispSym}{row.targetPriceDisp.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2 bg-primary/5">
                             <Input 
                                type="number" 
                                className="h-9 text-right font-bold border-primary/20 focus-visible:ring-primary" 
                                value={row.finalPriceDisp} 
                                onChange={e => updateRow(row.id, 'finalPriceOverride', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                             {row.status === 'Accept' ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px] px-2 py-0">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Accept
                                </Badge>
                             ) : row.status === 'Negotiate' ? (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-[10px] px-2 py-0">
                                    <AlertCircle className="h-3 w-3 mr-1" /> Negotiate
                                </Badge>
                             ) : (
                                <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-[10px] px-2 py-0">
                                    <XCircle className="h-3 w-3 mr-1" /> Reject
                                </Badge>
                             )}
                          </TableCell>
                          <TableCell className="p-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeRow(row.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {rows.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                        No rows added yet. Click &quot;Add Length&quot; to start.
                    </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6 text-sm space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold mb-2">
                            <TrendingDown className="h-4 w-4" />
                            Strategy Guide
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            <strong>Min Price</strong> is calculated at <strong>8% margin</strong>. 
                            <strong>Target Price</strong> is calculated at <strong>20% margin</strong>.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            All values above are converted to <strong>{config.displayCurrency}</strong> based on the set exchange rate. Adjust the <strong>Final Price</strong> column to set your actual selling quote.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-muted/10 border-dashed">
                    <CardContent className="pt-6 space-y-4">
                         <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Pricing Currency</span>
                            <span className="font-bold">{config.pricingCurrency}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Display Currency</span>
                            <span className="font-bold">{config.displayCurrency}</span>
                         </div>
                         <div className="flex justify-between items-center border-t pt-4">
                            <span className="text-sm font-bold uppercase">Estimated Quote Total</span>
                            <span className="text-xl font-black text-primary">
                                {dispSym}{calculatedRows.reduce((acc, r) => acc + (Number(r.quantity) || 0) * r.finalPriceDisp, 0).toLocaleString()}
                            </span>
                         </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
