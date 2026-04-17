'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getUserPayments } from '@/app/actions';
import type { PaymentRecord } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  ChevronRight,
  History,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AccountClient() {
  const { user, subscription } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchPayments = async () => {
        const response = await getUserPayments(user.uid);
        if (response.success && response.data) {
          setPayments(response.data);
        }
        setLoading(false);
      };
      fetchPayments();
    }
  }, [user]);

  const subscriptionDetails = useMemo(() => {
    if (!subscription || subscription.status === 'none') return null;

    const isActive = subscription.status === 'active' && new Date(subscription.expiryDate) > new Date();
    const expiryDate = new Date(subscription.expiryDate);
    const daysRemaining = differenceInDays(expiryDate, new Date());
    const isExpiringSoon = daysRemaining <= 5 && daysRemaining > 0;

    return {
      isActive,
      plan: subscription.plan,
      expiryDate,
      daysRemaining,
      isExpiringSoon,
      status: isActive ? 'active' : 'expired'
    };
  }, [subscription]);

  const showRenewButton = !subscriptionDetails || !subscriptionDetails.isActive || subscriptionDetails.daysRemaining <= 5;

  return (
    <div className="bg-muted/30 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">My Account</h1>
          <p className="text-muted-foreground mt-2">Manage your subscription and view payment history.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="overflow-hidden border-primary/10 shadow-md">
              <div className="bg-primary h-2" />
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Pro Subscription
                </CardTitle>
                <CardDescription>Your current access level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!subscriptionDetails ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">No active subscription found.</p>
                    <Badge variant="outline" className="mb-4">Free Plan</Badge>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</span>
                      <Badge 
                        variant={subscriptionDetails.isActive ? "default" : "destructive"}
                        className={cn(subscriptionDetails.isActive && "bg-green-600 hover:bg-green-700")}
                      >
                        {subscriptionDetails.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Plan</span>
                      <span className="font-bold capitalize">{subscriptionDetails.plan}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Expires</span>
                      <span className="font-semibold text-sm">
                        {format(subscriptionDetails.expiryDate, 'MMM dd, yyyy')}
                      </span>
                    </div>
                    
                    {subscriptionDetails.isActive && (
                      <div className={cn(
                        "mt-6 p-4 rounded-lg flex items-center gap-3",
                        subscriptionDetails.isExpiringSoon ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-primary/5 text-primary-foreground/80"
                      )}>
                        {subscriptionDetails.isExpiringSoon ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        <div>
                          <p className="text-xs font-bold uppercase">Time Remaining</p>
                          <p className="text-lg font-bold">{subscriptionDetails.daysRemaining} days left</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                {showRenewButton && (
                  <Button asChild className="w-full shadow-lg hover:shadow-xl transition-all">
                    <Link href="/subscribe">
                      {subscriptionDetails?.isActive ? 'Extend Subscription' : 'Upgrade to Pro'}
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card className="bg-muted/50 border-dashed">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Payment Support
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Manual verification takes 2-4 hours. For urgent issues, please email support@hairprofit.com.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment History Section */}
          <div className="lg:col-span-2">
            <Card className="h-full shadow-sm">
              <CardHeader className="border-b bg-muted/10">
                <CardTitle className="text-xl flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-foreground" />
                  Billing History
                </CardTitle>
                <CardDescription>Track your UPI payment submissions and approvals.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="bg-muted p-4 rounded-full mb-4">
                      <CreditCard className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No payments yet</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                      When you upgrade your plan, your payment history will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {payments.map((p) => (
                      <div key={p.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "p-2 rounded-lg shrink-0",
                            p.status === 'approved' ? "bg-green-100 text-green-700" :
                            p.status === 'pending' ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          )}>
                            {p.status === 'approved' ? <CheckCircle2 className="h-6 w-6" /> : 
                             p.status === 'pending' ? <Clock className="h-6 w-6" /> : 
                             <XCircle className="h-6 w-6" />}
                          </div>
                          <div>
                            <p className="font-bold capitalize">{p.plan} Plan</p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">UTR: {p.utr}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(p.createdAt), 'MMM dd, yyyy')} ({formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })})
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                          <p className="text-lg font-bold">₹{p.amount}</p>
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "capitalize text-[10px] px-2",
                              p.status === 'approved' && "bg-green-100 text-green-700 hover:bg-green-100",
                              p.status === 'pending' && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                              p.status === 'rejected' && "bg-red-100 text-red-700 hover:bg-red-100"
                            )}
                          >
                            {p.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
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
