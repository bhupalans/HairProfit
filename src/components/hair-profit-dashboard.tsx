'use client';

import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TransactionFormValues } from '@/types';
import { transactionSchema } from '@/types';
import { TransactionForm } from '@/components/transaction-form';
import { Sparkles, FileJson, FileUp, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HairProfitDashboard() {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      hairType: 'Brazilian Body Wave',
      purchaseQuantity: 100,
      purchasePrice: 50,
      currency: 'USD',
      processingSteps: [{ name: 'Coloring', expense: 250, wastage: 5 }],
      sellingPricePerUnit: 120,
      enableByproductProcessing: false,
      chowryProcessingCost: 10,
      nonRemyHairProducts: [{ size: '5-10', quantity: 10, price: 20 }],
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    const data = form.getValues();
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
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          // You might want to add validation here with the zod schema
          const parsedData = transactionSchema.safeParse(json);
          if (parsedData.success) {
            form.reset(parsedData.data);
          } else {
            console.error('Invalid JSON file:', parsedData.error);
            alert('Invalid file format.');
          }
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          alert('Could not parse the file. Please ensure it is a valid JSON.');
        }
      };
      reader.readAsText(file);
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
          <TransactionForm form={form} />
        </main>
      </div>
    </div>
  );
}
