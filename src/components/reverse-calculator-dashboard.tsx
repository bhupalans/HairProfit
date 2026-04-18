'use client';

import { useState, useMemo, useCallback } from 'react';
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
  Coins
} from 'lucide-react';
import Link from 'next/link';
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
}

export default function ReverseCalculatorDashboard() {
  const [config, setConfig] = useState({
    rawHairPrice: 2000, // INR/kg
    usdRate: 83.5, // 1 USD = X INR
    processingCost: 15, // USD/kg
    logisticsCost: 5, // USD/kg
    otherCost: 2, // USD/kg
  });

  const [rows, setRows] = useState<Row[]>([
    { id: crypto.randomUUID(), length: '16"', quantity: 10, buyerPrice: 75, yield: 78 },
  ]);

  const handleConfigChange = (field: string, value: string) => {
    const num = parseFloat(value);
    setConfig(prev => ({ ...prev, [field]: isNaN(num) ? '' : num }));
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

  const calculatedRows = useMemo(() => {
    const rawCostUsd = (Number(config.rawHairPrice) || 0) / (Number(config.usdRate) || 1);
    
    return rows.map(row => {
      const yieldVal = (Number(row.yield) || 0) / 100;
      const effectiveRawCost = yieldVal > 0 ? rawCostUsd / yieldVal : 0;
      
      const finalCost = effectiveRawCost + (Number(config.processingCost) || 0) + (Number(config.logisticsCost) || 0) + (Number(config.otherCost) || 0);
      
      const minPrice = finalCost * 1.08; // 8% margin
      const targetPrice = finalCost * 1.20; // 20% margin
      const bPrice = Number(row.buyerPrice) || 0;

      let status: 'Reject' | 'Negotiate' | 'Accept' = 'Reject';
      if (bPrice >= targetPrice) status = 'Accept';
      else if (bPrice >= minPrice) status = 'Negotiate';

      return {
        ...row,
        finalCost,
        minPrice,
        targetPrice,
        status,
      };
    });
  }, [rows, config]);

  return (
    <div className="bg-muted/30 min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Button asChild variant="ghost" className="pl-0">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <header className="flex items-center gap-4 mb-8">
          <div className="bg-primary/20 p-2 rounded-lg">
            <ArrowRightLeft className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Reverse Pricing Calculator</h1>
            <p className="text-muted-foreground mt-1">Validate buyer quotes instantly based on your raw costs and yields.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Global Config Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Cost Configuration
                </CardTitle>
                <CardDescription>Global inputs applied to all rows.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <div className="space-y-2">
                   <div className="flex items-center gap-1.5">
                    <Label htmlFor="procCost">Processing ($/kg)</Label>
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
                  <Label htmlFor="logCost">Logistics ($/kg)</Label>
                  <Input 
                    id="logCost" 
                    type="number" 
                    value={config.logisticsCost} 
                    onChange={e => handleConfigChange('logisticsCost', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherCost">Other Costs ($/kg)</Label>
                  <Input 
                    id="otherCost" 
                    type="number" 
                    value={config.otherCost} 
                    onChange={e => handleConfigChange('otherCost', e.target.value)} 
                  />
                </div>
              </CardContent>
            </Card>

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
                        If a buyer quote is below Min Price, you are likely losing money after overheads.
                    </p>
                </CardContent>
            </Card>
          </div>

          {/* Main Table Area */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>BUYER&apos;S QUOTE</CardTitle>
                  <CardDescription>Validate individual length offers from your client.</CardDescription>
                </div>
                <Button onClick={addRow} size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Length
                </Button>
              </CardHeader>
              <CardContent className="p-0 border-t">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-[120px]">Length</TableHead>
                        <TableHead className="text-right w-[100px]">Qty (kg)</TableHead>
                        <TableHead className="text-right w-[120px]">Buyer ($/kg)</TableHead>
                        <TableHead className="text-right w-[100px]">Yield (%)</TableHead>
                        <TableHead className="text-right w-[120px]">Cost ($/kg)</TableHead>
                        <TableHead className="text-right w-[120px]">Min ($/kg)</TableHead>
                        <TableHead className="text-right w-[120px]">Target ($/kg)</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
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
                                className="h-9 text-right font-bold" 
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
                          <TableCell className="p-2 text-right font-medium">
                            ${row.finalCost.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2 text-right text-muted-foreground text-xs">
                            ${row.minPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2 text-right text-muted-foreground text-xs">
                            ${row.targetPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="p-2">
                             {row.status === 'Accept' ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Accept
                                </Badge>
                             ) : row.status === 'Negotiate' ? (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                                    <AlertCircle className="h-3 w-3 mr-1" /> Negotiate
                                </Badge>
                             ) : (
                                <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
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
          </div>
        </div>
      </div>
    </div>
  );
}
