'use client';

import { useState, useEffect } from 'react';
import { getPendingPayments, approvePayment, rejectPayment } from '@/app/actions';
import type { PaymentRecord } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Clock, User, Hash } from 'lucide-react';
import AuthGuard from '@/components/auth-guard';
import { formatDistanceToNow } from 'date-fns';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPayments = async () => {
    setLoading(true);
    const response = await getPendingPayments();
    if (response.success && response.data) {
      setPayments(response.data);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: response.error || 'Failed to load payments.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (id: string, userId: string, plan: any) => {
    setProcessingId(id);
    const response = await approvePayment(id, userId, plan);
    setProcessingId(null);

    if (response.success) {
      toast({ title: 'Payment Approved', description: 'Subscription activated for user.' });
      setPayments(prev => prev.filter(p => p.id !== id));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: response.error });
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    const response = await rejectPayment(id);
    setProcessingId(null);

    if (response.success) {
      toast({ title: 'Payment Rejected' });
      setPayments(prev => prev.filter(p => p.id !== id));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: response.error });
    }
  };

  return (
    <AuthGuard>
      <div className="bg-muted/30 min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Payment Verification Panel</h1>
            <p className="text-muted-foreground mt-2">Approve or reject pending subscription payments.</p>
          </header>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : payments.length === 0 ? (
            <Card className="p-12 text-center border-dashed bg-transparent">
              <CardTitle className="text-xl mb-2 text-muted-foreground">No pending payments</CardTitle>
              <p className="text-muted-foreground">Everything is up to date!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {payments.map((p) => (
                <Card key={p.id} className="relative">
                  <Badge variant="outline" className="absolute top-4 right-4 capitalize">
                    {p.plan}
                  </Badge>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {p.email}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs truncate">UID: {p.userId}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-end border-b pb-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Amount</p>
                        <p className="text-2xl font-bold">₹{p.amount}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Transaction ID (UTR)</p>
                      <div className="bg-muted p-2 rounded flex items-center justify-between gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-bold text-sm">{p.utr}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="grid grid-cols-2 gap-3 border-t pt-6">
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleReject(p.id)}
                      disabled={processingId === p.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(p.id, p.userId, p.plan)}
                      disabled={processingId === p.id}
                    >
                      {processingId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
