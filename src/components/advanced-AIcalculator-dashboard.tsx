'use client';

import { useState, useMemo, useRef, useCallback, ChangeEvent } from 'react';
import { ArrowLeft, Bot, FileDown, FileUp, Loader2 } from 'lucide-react';
import type { HairProfitData, ProcessingStep, NonRemyHairProduct } from '@/types';
import { hairProfitDataSchema } from '@/types';
import { Button } from '@/components/ui/button';
import PurchaseDetailsCard from '@/components/purchase-details-card';
import ProcessingStepsCard from '@/components/processing-steps-card';
import AdvancedAIByproductCard from '@/components/advanced-AI-byproduct-card';
import PricingCard from '@/components/pricing-card';
import SummaryCard from '@/components/summary-card';
import BusinessInsightsCard from '@/components/business-insights-card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PDFReport from './pdf-report';
import Link from 'next/link';

// Helper for category weights
const getSizeWeight = (size: number, category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('non-remy')) {
    if (size <= 6) return 0.5;
    if (size <= 8) return 0.6;
    if (size <= 10) return 0.75;
    if (size <= 12) return 0.85;
    if (size <= 14) return 1.0;
    if (size <= 16) return 1.1;
    if (size <= 18) return 1.25;
    if (size <= 20) return 1.4;
    if (size <= 22) return 1.6;
    if (size <= 24) return 1.8;
    if (size <= 26) return 2.0;
    return 2.2;
  }
  if (cat.includes('remy')) {
    if (size <= 6) return 0.7;
    if (size <= 8) return 0.8;
    if (size <= 10) return 0.95;
    if (size <= 12) return 1.05;
    if (size <= 14) return 1.2;
    if (size <= 16) return 1.4;
    if (size <= 18) return 1.6;
    if (size <= 20) return 1.9;
    if (size <= 22) return 2.2;
    if (size <= 24) return 2.5;
    if (size <= 26) return 2.8;
    return 3.2;
  }
  if (cat.includes('wig')) {
    if (size <= 10) return 0.9;
    if (size <= 14) return 1.0;
    if (size <= 18) return 1.1;
    if (size <= 22) return 1.2;
    return 1.3;
  }
  if (cat.includes('extension')) {
    if (size <= 8) return 0.7;
    if (size <= 12) return 1.0;
    if (size <= 16) return 1.4;
    if (size <= 20) return 1.9;
    if (size <= 24) return 2.5;
    return 3.0;
  }
  return 1.0;
};

const initialData: HairProfitData = {
  hairType: '',
  purchaseQuantity: '',
  purchasePrice: '',
  currency: 'USD',
  processingSteps: [],
  sellingPricePerUnit: '',
  enableByproductProcessing: false,
  byproductProcessingCost: '',
  byproductName: 'Non-Remy Hair',
  nonRemyHairProducts: [],
  targetByproductMargin: 30,
  byproductPriceIncreasePerInch: 3,
  byproductLowStockThreshold: 10,
  byproductScarcityPremium: 15,
};

export default function AdvancedAICalculatorDashboard() {
  const [data, setData] = useState<HairProfitData>(initialData);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfReportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDataChange = useCallback((field: keyof HairProfitData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleNumericChange = useCallback((field: keyof HairProfitData, value: string) => {
    if (value === '') {
      handleDataChange(field, '');
    } else {
      const numValue = parseFloat(value);
      handleDataChange(field, isNaN(numValue) ? '' : numValue);
    }
  }, [handleDataChange]);


  const handleProcessingStepChange = useCallback(
    (
      index: number,
      field: keyof Omit<ProcessingStep, 'id'>,
      value: string | number
    ) => {
      const newSteps = [...data.processingSteps];
      const step = { ...newSteps[index] };
      
      if (field === 'name') {
        step.name = value as string;
      } else {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if(value === '') {
          (step as any)[field] = '';
        } else {
          (step as any)[field] = isNaN(numValue) ? '' : numValue;
        }
      }

      newSteps[index] = step;
      handleDataChange('processingSteps', newSteps);
    },
    [data.processingSteps, handleDataChange]
  );

  const addProcessingStep = useCallback(() => {
    const newSteps = [
      ...data.processingSteps,
      { id: crypto.randomUUID(), name: '', cost: '', wastage: '' },
    ];
    handleDataChange('processingSteps', newSteps);
  },[data.processingSteps, handleDataChange]);

  const removeProcessingStep = useCallback((index: number) => {
    const newSteps = data.processingSteps.filter((_, i) => i !== index);
    handleDataChange('processingSteps', newSteps);
  }, [data.processingSteps, handleDataChange]);
  
  const handleNonRemyProductChange = useCallback((
    index: number,
    field: keyof Omit<NonRemyHairProduct, 'id'>,
    value: string | number
  ) => {
     setData((prev) => {
        const newProducts = [...prev.nonRemyHairProducts];
        const product = {...newProducts[index]};

        if (field === 'size') {
            product.size = value as string;
        } else {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            if (value === '') {
                (product as any)[field] = '';
            } else {
                (product as any)[field] = isNaN(numValue) ? '' : numValue;
            }
        }

        // Only one anchor is active at a time. Last edited becomes anchor.
        if (field === 'price' && Number(value) > 0) {
            newProducts.forEach((p, i) => {
                if (i !== index) p.price = '';
            });
        }

        newProducts[index] = product;
        return { ...prev, nonRemyHairProducts: newProducts };
     });
  }, []);


  const addNonRemyProduct = useCallback(() => {
    const newProducts = [
      ...data.nonRemyHairProducts,
      { id: crypto.randomUUID(), size: '', quantity: '', price: '' },
    ];
    handleDataChange('nonRemyHairProducts', newProducts);
  },[data.nonRemyHairProducts, handleDataChange]);

  const removeNonRemyProduct = useCallback((index: number) => {
    const newProducts = data.nonRemyHairProducts.filter(
      (_, i) => i !== index
    );
    handleDataChange('nonRemyHairProducts', newProducts);
  }, [data.nonRemyHairProducts, handleDataChange]);

  const {
    totalWastageUnits,
    unitsRemaining,
    totalPurchaseCost,
    totalProcessingCost,
    totalWastageCost,
    totalByproductProcessingCost,
    assignedNonRemyQuantity,
    effectiveCostPerUnit,
    grandTotalCost,
    totalRevenue,
    projectedProfit,
    profitMargin,
    processedNonRemyProducts,
  } = useMemo(() => {
    const purchaseQuantity = Number(data.purchaseQuantity) || 0;
    const purchasePrice = Number(data.purchasePrice) || 0;
    const processingSteps = data.processingSteps || [];
    const byproductProcessingCost = Number(data.byproductProcessingCost) || 0;
    const nonRemyHairProducts = data.nonRemyHairProducts || [];
    const sellingPricePerUnit = Number(data.sellingPricePerUnit) || 0;
    const { 
      targetByproductMargin,
      byproductLowStockThreshold,
      byproductScarcityPremium,
      byproductName
    } = data;

    const totalWastageUnits = Math.min(
      purchaseQuantity,
      processingSteps.reduce(
        (acc, step) => acc + (Number(step.wastage) || 0),
        0
      )
    );

    const unitsRemaining = Math.max(0, purchaseQuantity - totalWastageUnits);
    const totalPurchaseCost = purchaseQuantity * purchasePrice;
    const totalProcessingCost = processingSteps.reduce(
      (acc, step) => acc + (Number(step.cost) || 0),
      0
    );

    const costPerUnitBeforeWastage = purchaseQuantity > 0 ? (totalPurchaseCost + totalProcessingCost) / purchaseQuantity : 0;
    const totalWastageCost = totalWastageUnits * costPerUnitBeforeWastage;
    
    const assignedNonRemyQuantity = nonRemyHairProducts.reduce(
      (acc, p) => acc + (Number(p.quantity) || 0),
      0
    );

    const totalByproductProcessingCost = byproductProcessingCost * unitsRemaining;
    const totalCost = totalPurchaseCost + totalProcessingCost + totalByproductProcessingCost;
    const effectiveCostPerUnit = unitsRemaining > 0 ? totalCost / unitsRemaining : 0;

    const processedNonRemyProductsResult = (() => {
        if (!data.enableByproductProcessing || !nonRemyHairProducts.length) {
            return nonRemyHairProducts.map(p => ({ ...p, calculatedPrice: Number(p.price) || 0 }));
        }

        const productsWithSizeInfo = nonRemyHairProducts.map(p => {
            const parsedSize = parseInt(String(p.size).split('-')[0].trim(), 10);
            return { ...p, firstSize: isNaN(parsedSize) ? 0 : parsedSize };
        });

        const validProducts = productsWithSizeInfo.filter(p => p.firstSize > 0);
        if (!validProducts.length) {
            return productsWithSizeInfo.map(p => ({ ...p, calculatedPrice: 0 }));
        }

        const targetMargin = Number(targetByproductMargin) || 0;
        const lowStockThreshold = Number(byproductLowStockThreshold) || 0;
        const scarcityPremium = Number(byproductScarcityPremium) || 0;
        const category = byproductName || 'Non-Remy Hair';

        const productsWithOverrides = validProducts.filter(p => (Number(p.price) || 0) > 0);
        
        let basePrice: number;

        if (productsWithOverrides.length > 0) {
            const anchorProduct = productsWithOverrides[0];
            const anchorOverridePrice = Number(anchorProduct.price);
            const anchorWeight = getSizeWeight(anchorProduct.firstSize, category);
            
            const anchorQuantity = Number(anchorProduct.quantity) || 0;
            const anchorIsScarce = anchorQuantity > 0 && lowStockThreshold > 0 && anchorQuantity < lowStockThreshold;
            
            const anchorScarcityMultiplier = anchorIsScarce ? (1 + scarcityPremium / 100) : 1;
            basePrice = anchorWeight > 0 ? anchorOverridePrice / (anchorWeight * anchorScarcityMultiplier) : 0;

        } else {
            const costOfByproductUnit = effectiveCostPerUnit;
            const marginMultiplier = targetMargin < 100 && targetMargin >= 0 && costOfByproductUnit > 0
                ? 1 / (1 - (targetMargin / 100))
                : 1;
            basePrice = costOfByproductUnit * marginMultiplier;
        }

        return productsWithSizeInfo.map(product => {
            if (product.firstSize === 0) {
                return { ...product, calculatedPrice: 0 };
            }
            
            const overridePrice = Number(product.price) || 0;
            if (overridePrice > 0) {
                return { ...product, calculatedPrice: Number(overridePrice.toFixed(2)) };
            }

            const weight = getSizeWeight(product.firstSize, category);
            let finalPrice = basePrice * weight;

            const quantity = Number(product.quantity) || 0;
            const isScarce = quantity > 0 && lowStockThreshold > 0 && quantity < lowStockThreshold;
            
            if (isScarce) {
                finalPrice *= (1 + scarcityPremium / 100);
            }
    
            return {
                ...product,
                calculatedPrice: Number(finalPrice.toFixed(2)),
            };
        });
    })();
    
    const nonRemyRevenue = processedNonRemyProductsResult.reduce(
      (acc, p) => acc + (Number(p.quantity) || 0) * (p.calculatedPrice || 0),
      0
    );
    
    const grandTotalCostResult = totalCost;

    const totalRevenueResult = data.enableByproductProcessing
      ? nonRemyRevenue
      : sellingPricePerUnit * unitsRemaining;
      
    const projectedProfitResult = totalRevenueResult - grandTotalCostResult;
    const profitMarginResult =
      grandTotalCostResult > 0
        ? (projectedProfitResult / grandTotalCostResult) * 100
        : totalRevenueResult > 0
          ? 100
          : 0;

    return {
      totalWastageUnits,
      unitsRemaining,
      totalPurchaseCost,
      totalProcessingCost,
      totalWastageCost,
      totalByproductProcessingCost,
      assignedNonRemyQuantity,
      effectiveCostPerUnit,
      nonRemyRevenue,
      grandTotalCost: grandTotalCostResult,
      totalRevenue: totalRevenueResult,
      projectedProfit: projectedProfitResult,
      profitMargin: profitMarginResult,
      processedNonRemyProducts: processedNonRemyProductsResult,
    };
  }, [data]);

  const handleAISuggest = async () => {
    if (data.nonRemyHairProducts.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one byproduct size first.' });
        return;
    }

    setIsAISuggesting(true);
    toast({ title: 'Thinking...', description: 'AI is analyzing your inventory and costs.' });

    try {
        const response = await fetch('/api/ai-pricing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                products: data.nonRemyHairProducts.map(p => ({ size: p.size, quantity: p.quantity })),
                costPerUnit: effectiveCostPerUnit,
                category: data.byproductName || 'Non-Remy Hair'
            })
        });

        if (!response.ok) throw new Error('API request failed');

        const { anchorSize, price } = await response.json();

        const newProducts = data.nonRemyHairProducts.map(p => {
            const isAnchor = p.size.toString().includes(anchorSize);
            return { ...p, price: isAnchor ? price : '' };
        });

        handleDataChange('nonRemyHairProducts', newProducts);
        toast({ title: 'Success', description: `AI suggested ${price} ${data.currency} for the ${anchorSize}" size as an anchor.` });
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not get AI suggestion.' });
    } finally {
        setIsAISuggesting(false);
    }
  };

  const handleExportJson = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hair-profit-transaction-AI-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'Data exported successfully.' });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const jsonData = JSON.parse(result);
        const validatedData = hairProfitDataSchema.parse(jsonData);

        const dataWithIds = {
          ...validatedData,
          processingSteps: validatedData.processingSteps.map(s => ({...s, id: s.id || crypto.randomUUID()})),
          nonRemyHairProducts: (validatedData.nonRemyHairProducts || []).map(p => ({...p, id: p.id || crypto.randomUUID()}))
        }
        setData(dataWithIds);
        toast({ title: 'Success', description: 'Data imported successfully.' });
      } catch (error) {
        console.error('Import failed', error);
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description:
            error instanceof z.ZodError
              ? 'The data structure in the file is invalid.'
              : 'The selected file is not valid JSON.',
        });
      }
    };
    reader.readAsText(file);
     if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDownloadPdf = async () => {
    const reportElement = pdfReportRef.current;
    if (!reportElement) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not generate PDF. Report element not found.',
        });
        return;
    }

    setIsGeneratingPdf(true);
    toast({ title: 'Generating PDF...', description: 'Please wait a moment.' });

    try {
        const canvas = await html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;
        
        if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = imgHeight * ratio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = 0;

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`hair-profit-report-AI-${new Date().toISOString().split('T')[0]}.pdf`);
        
    } catch (error) {
        console.error('Failed to generate PDF', error);
        toast({
            variant: 'destructive',
            title: 'PDF Generation Failed',
            description: 'An unexpected error occurred.',
        });
    } finally {
        setIsGeneratingPdf(false);
    }
  };
  
  const summaryForPdf = {
    totalPurchaseCost,
    totalProcessingCost,
    totalWastageCost,
    totalByproductProcessingCost,
    grandTotalCost,
    totalRevenue,
    projectedProfit,
    profitMargin,
    unitsRemaining,
    processedNonRemyProducts,
  };


  return (
    <div className="bg-background min-h-screen text-foreground font-body">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="pl-0">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
              Advanced AI Calculator
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={handleImportClick}>
              <FileUp className="mr-2 h-4 w-4" /> Import JSON
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="application/json"
            />
            <Button variant="outline" onClick={handleExportJson}>
              <FileDown className="mr-2 h-4 w-4" /> Export JSON
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
              {isGeneratingPdf ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                  <><FileDown className="mr-2 h-4 w-4" /> Download PDF</>
              )}
            </Button>
          </div>
        </header>

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <PurchaseDetailsCard
                data={data}
                onDataChange={handleDataChange}
                onNumericChange={handleNumericChange}
              />
              <ProcessingStepsCard
                steps={data.processingSteps ?? []}
                currency={data.currency}
                onStepChange={handleProcessingStepChange}
                onAddStep={addProcessingStep}
                onRemoveStep={removeProcessingStep}
              />
              <AdvancedAIByproductCard
                data={data}
                currency={data.currency}
                onDataChange={handleDataChange}
                onNumericChange={handleNumericChange}
                onProductChange={handleNonRemyProductChange}
                onAddProduct={addNonRemyProduct}
                onRemoveProduct={removeNonRemyProduct}
                unitsRemaining={unitsRemaining}
                assignedNonRemyQuantity={assignedNonRemyQuantity}
                processedNonRemyProducts={processedNonRemyProducts}
                onAISuggest={handleAISuggest}
                isAISuggesting={isAISuggesting}
              />
            </div>
            <div className="lg:col-span-1 space-y-8">
              <PricingCard
                data={data}
                onDataChange={handleDataChange}
                onNumericChange={handleNumericChange}
                unitsRemaining={unitsRemaining}
              />
              <SummaryCard
                currency={data.currency}
                totalPurchaseCost={totalPurchaseCost}
                totalProcessingCost={totalProcessingCost}
                totalWastageCost={totalWastageCost}
                enableByproductProcessing={data.enableByproductProcessing}
                totalByproductProcessingCost={totalByproductProcessingCost}
                grandTotalCost={grandTotalCost}
                totalRevenue={totalRevenue}
                projectedProfit={projectedProfit}
                profitMargin={profitMargin}
              />
              <BusinessInsightsCard
                totalCost={grandTotalCost}
                totalRevenue={totalRevenue}
                projectedProfit={projectedProfit}
                profitMargin={profitMargin}
                purchasePrice={Number(data.purchasePrice) || 0}
                unitsRemaining={unitsRemaining}
                currency={data.currency}
                processedNonRemyProducts={processedNonRemyProducts}
                targetByproductMargin={Number(data.targetByproductMargin)}
                lowStockThreshold={Number(data.byproductLowStockThreshold)}
              />
            </div>
          </div>
        </main>
      </div>
      <div className="absolute -z-10 -left-[9999px] top-0">
        <div ref={pdfReportRef}>
          <PDFReport data={data} summary={summaryForPdf} />
        </div>
      </div>
    </div>
  );
}
