'use client';

import { TransactionForm } from '@/components/transaction-form';
import { Sparkles, FileJson, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HairProfitDashboard() {
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
            <Button variant="outline">
              <FileJson className="mr-2 h-4 w-4" /> Import JSON
            </Button>
            <Button variant="outline">
              <FileJson className="mr-2 h-4 w-4" /> Export JSON
            </Button>
            <Button>
              <FileDown className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </header>
        <main>
          <TransactionForm />
        </main>
      </div>
    </div>
  );
}
