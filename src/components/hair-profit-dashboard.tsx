'use client';

import { useState } from 'react';
import type { Transaction, TransactionData } from '@/types';
import { TransactionForm } from '@/components/transaction-form';
import { HistoryCard } from '@/components/history-card';
import { Sparkles } from 'lucide-react';

export default function HairProfitDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleSaveTransaction = (data: TransactionData) => {
    const purchaseCost = data.purchaseQuantity * data.purchasePrice;
    const processingCost = data.processingSteps.reduce((acc, step) => acc + step.cost, 0);

    let cumulativeQuantity = data.purchaseQuantity;
    let totalQuantityLost = 0;
    data.processingSteps.forEach(step => {
      const wastagePercent = step.wastage || 0;
      if (cumulativeQuantity > 0 && wastagePercent > 0) {
        const quantityLost = cumulativeQuantity * (wastagePercent / 100);
        totalQuantityLost += quantityLost;
        cumulativeQuantity -= quantityLost;
      }
    });

    const wastageCost = totalQuantityLost * data.purchasePrice;
    const totalCost = purchaseCost + processingCost + wastageCost;

    const revenue = data.sellingPrice;
    const profit = revenue - totalCost;
    const margin = totalCost > 0 ? (profit / totalCost) * 100 : revenue > 0 ? 100 : 0;

    const newTransaction: Transaction = {
      id: new Date().toISOString() + Math.random(),
      ...data,
      totalCost,
      profit,
      margin,
    };

    setTransactions(prev => [newTransaction, ...prev]);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <Sparkles className="h-10 w-10 text-primary" />
          <h1 className="text-5xl font-headline font-bold text-foreground tracking-tight">
            HairProfit
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Track your hair product costs and calculate profits with elegance and ease.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2">
          <TransactionForm onSaveTransaction={handleSaveTransaction} />
        </div>
        <div className="lg:col-span-3">
          <HistoryCard transactions={transactions} />
        </div>
      </div>
    </div>
  );
}
