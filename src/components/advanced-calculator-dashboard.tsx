'use client';

import { useState, useMemo, useRef, useCallback, ChangeEvent } from 'react';
import { ArrowLeft, Sparkles, FileDown, FileUp, Loader2 } from 'lucide-react';
import type { HairProfitData, ProcessingStep, NonRemyHairProduct } from '@/types';
import { hairProfitDataSchema } from '@/types';
import { Button } from '@/components/ui/button';
import PurchaseDetailsCard from '@/components/purchase-details-card';
import ProcessingStepsCard from '@/components/processing-steps-card';
import AdvancedByproductCard from '@/components/advanced-byproduct-card';
import PricingCard from '@/components/pricing-card';
import SummaryCard from '@/components/summary-card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PDFReport from './pdf-report';
import Link from 'next/link';


const initialData: HairProfitData = {
  hairType: '',
  purchaseQuantity: '',
  purchasePrice: '',
  currency: 'USD',
  processingSteps: [],
  sellingPricePerUnit: '',
  enableByproductProcessing: false,
  byproductProcessingCost: '',
  nonRemyHairProducts: [],
  targetByproductMargin: 30,
};

export default function AdvancedCalculatorDashboard() {
  const [data, setData] = useState<HairProfitData>(initialData);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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
     const newProducts = [...data.nonRemyHairProducts];
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

      newProducts[index] = product;
      handleDataChange('nonRemyHairProducts', newProducts);
  }, [data.nonRemyHairProducts, handleDataChange]);


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
    grandTotalCost,
    totalRevenue,
    projectedProfit,
    profitMargin,
    costPerUnitBeforeWastage,
  } = useMemo(() => {
    const purchaseQuantity = Number(data.purchaseQuantity) || 0;
    const purchasePrice = Number(data.purchasePrice) || 0;
    const processingSteps = data.processingSteps || [];
    const byproductProcessingCost = Number(data.byproductProcessingCost) || 0;
    const nonRemyHairProducts = data.nonRemyHairProducts || [];
    const sellingPricePerUnit = Number(data.sellingPricePerUnit) || 0;

    const totalWastageUnits = processingSteps.reduce(
      (acc, step) => acc + (Number(step.wastage) || 0),
      0
    );
    const unitsRemaining = Math.max(0, purchaseQuantity - totalWastageUnits);
    const totalPurchaseCost = purchaseQuantity * purchasePrice;
    const totalProcessingCost = processingSteps.reduce(
      (acc, step) => acc + (Number(step.cost) || 0),
      0
    );

    const costPerUnitBeforeWastage = purchaseQuantity > 0 ? (totalPurchaseCost + totalProcessingCost) / purchaseQuantity : 0;
    
    const totalWastageCost = totalWastageUnits * costPerUnitBeforeWastage;
    
    const totalByproductProcessingCost = data.enableByproductProcessing
      ? byproductProcessingCost * unitsRemaining
      : 0;

    const assignedNonRemyQuantity = nonRemyHairProducts.reduce(
      (acc, p) => acc + (Number(p.quantity) || 0),
      0
    );
    
    const targetMargin = Number(data.targetByproductMargin) || 0;
    const costOfByproductUnit = costPerUnitBeforeWastage + byproductProcessingCost;
    const byproductSellingPrice = targetMargin < 100 && targetMargin >= 0
      ? costOfByproductUnit / (1 - (targetMargin / 100))
      : 0;
    
    const nonRemyRevenue = nonRemyHairProducts.reduce(
      (acc, p) => acc + (Number(p.quantity) || 0) * byproductSellingPrice,
      0
    );
    
    const grandTotalCost =
      totalPurchaseCost + totalProcessingCost + totalByproductProcessingCost;

    const totalRevenue = data.enableByproductProcessing
      ? nonRemyRevenue
      : sellingPricePerUnit * unitsRemaining;
      
    const projectedProfit = totalRevenue - grandTotalCost;
    const profitMargin =
      grandTotalCost > 0
        ? (projectedProfit / grandTotalCost) * 100
        : totalRevenue > 0
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
      nonRemyRevenue,
      grandTotalCost,
      totalRevenue,
      projectedProfit,
      profitMargin,
      costPerUnitBeforeWastage,
    };
  }, [data]);

  const handleExportJson = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hair-profit-transaction-${new Date().toISOString()}.json`;
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
        pdf.save(`hair-profit-report-${new Date().toISOString().split('T')[0]}.pdf`);
        
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
    unitsRemaining
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
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
              Advanced Profit Calculator
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
              <AdvancedByproductCard
                data={data}
                currency={data.currency}
                onDataChange={handleDataChange}
                onNumericChange={handleNumericChange}
                onProductChange={handleNonRemyProductChange}
                onAddProduct={addNonRemyProduct}
                onRemoveProduct={removeNonRemyProduct}
                unitsRemaining={unitsRemaining}
                assignedNonRemyQuantity={assignedNonRemyQuantity}
                costPerUnitBeforeWastage={costPerUnitBeforeWastage}
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
