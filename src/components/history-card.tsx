'use client';

import type { Transaction } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface HistoryCardProps {
  transactions: Transaction[];
}

export function HistoryCard({ transactions }: HistoryCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Transaction History
        </CardTitle>
        <CardDescription>A log of all your completed transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Total Cost</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {transactions.map((t, index) => (
                    <motion.tr
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {formatCurrency(t.totalCost)}
                      </TableCell>
                      <TableCell>{formatCurrency(t.sellingPrice)}</TableCell>
                      <TableCell
                        className={t.profit >= 0 ? 'text-green-600' : 'text-red-600'}
                      >
                        {formatCurrency(t.profit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={t.margin >= 0 ? 'default' : 'destructive'}
                          className={t.margin >= 0 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}
                        >
                          {t.margin.toFixed(2)}%
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
