'use client';

import { useState, useMemo, useRef, useCallback, ChangeEvent } from 'react';
import { Sparkles, FileDown, FileUp } from 'lucide-react';
import type { HairProfitData, ProcessingStep, NonRemyHairProduct } from '@/types';
import { hairProfitDataSchema } from '@/types';
import { Button } from '@/components/ui/button';
import PurchaseDetailsCard from '@/components/purchase-details-card';
import ProcessingStepsCard from '@/components/processing-steps-card';
import ByproductProcessingCard from '@/components/byproduct-processing-card';
import PricingCard from '@/components/pricing-card';
import SummaryCard from '@/components/summary-card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const initialData: HairProfitData = {
  hairType: 'Brazilian Body Wave',
  purchaseQuantity: 100,
  purchasePrice: 50,
  currency: 'USD',
  processingSteps: [],
  sellingPricePerUnit: 120,
  enableByproductProcessing: false,
  byproductProcessingCost: 10,
  nonRemyHairProducts: [],
};

export default function HairProfitDashboard() {
  const [data, setData] = useState<HairProfitData>(initialData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDataChange = (field: keyof HairProfitData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProcessingStepChange = (
    index: number,
    field: keyof Omit<ProcessingStep, 'id'>,
    value: string | number
  ) => {
    const newSteps = [...(data.processingSteps ?? [])];
    const step = { ...newSteps[index] };

    if (field === 'cost' || field === 'wastage') {
      step[field] = Number(value);
    } else {
      step[field] = value as string;
    }

    newSteps[index] = step;
    handleDataChange('processingSteps', newSteps);
  };

  const addProcessingStep = () => {
    const newSteps = [
      ...(data.processingSteps ?? []),
      { id: crypto.randomUUID(), name: '', cost: 0, wastage: 0 },
    ];
    handleDataChange('processingSteps', newSteps);
  };

  const removeProcessingStep = (index: number) => {
    const newSteps = [...(data.processingSteps ?? [])].filter((_, i) => i !== index);
    handleDataChange('processingSteps', newSteps);
  };
  
  const handleNonRemyProductChange = (
    index: number,
    field: keyof Omit<NonRemyHairProduct, 'id'>,
    value: string | number
  ) => {
    const newProducts = [...(data.nonRemyHairProducts ?? [])];
    const product = { ...newProducts[index] };
    if (field === 'quantity' || field === 'price') {
       product[field] = Number(value);
    } else {
       product[field] = value as string;
    }
    newProducts[index] = product;
    handleDataChange('nonRemyHairProducts', newProducts);
  };

  const addNonRemyProduct = () => {
    const newProducts = [
      ...(data.nonRemyHairProducts ?? []),
      { id: crypto.randomUUID(), size: '', quantity: 0, price: 0 },
    ];
    handleDataChange('nonRemyHairProducts', newProducts);
  };

  const removeNonRemyProduct = (index: number) => {
    const newProducts = [...(data.nonRemyHairProducts ?? [])].filter(
      (_, i) => i !== index
    );
    handleDataChange('nonRemyHairProducts', newProducts);
  };


  const {
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
    const totalWastageCost = totalWastageUnits * purchasePrice;
    const totalByproductProcessingCost = data.enableByproductProcessing
      ? byproductProcessingCost * unitsRemaining
      : 0;

    const assignedNonRemyQuantity = nonRemyHairProducts.reduce(
      (acc, p) => acc + (Number(p.quantity) || 0),
      0
    );
    const nonRemyRevenue = nonRemyHairProducts.reduce(
      (acc, p) => acc + (Number(p.quantity) || 0) * (Number(p.price) || 0),
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

  return (
    <div className="bg-background min-h-screen text-foreground font-body">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
              HairProfit
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
            <Button>
              <FileDown className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </header>

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <PurchaseDetailsCard data={data} onDataChange={handleDataChange} />
              <ProcessingStepsCard
                steps={data.processingSteps ?? []}
                currency={data.currency}
                onStepChange={handleProcessingStepChange}
                onAddStep={addProcessingStep}
                onRemoveStep={removeProcessingStep}
              />
              <ByproductProcessingCard
                data={data}
                onDataChange={handleDataChange}
                onProductChange={handleNonRemyProductChange}
                onAddProduct={addNonRemyProduct}
                onRemoveProduct={removeNonRemyProduct}
                unitsRemaining={unitsRemaining}
                assignedNonRemyQuantity={assignedNonRemyQuantity}
              />
            </div>
            <div className="lg:col-span-1 space-y-8">
              <PricingCard
                data={data}
                onDataChange={handleDataChange}
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
    </div>
  );
}
