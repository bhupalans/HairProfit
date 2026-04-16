'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Check, Copy, Loader2, QrCode, CreditCard } from 'lucide-react';
import { submitPayment } from '@/app/actions';
import type { SubscriptionPlan } from '@/types';
import AuthGuard from '@/components/auth-guard';

const PLANS = [
  { id: 'monthly', name: 'Monthly', price: 499, duration: '30 days' },
  { id: 'quarterly', name: 'Quarterly', price: 1299, duration: '90 days' },
  { id: 'yearly', name: 'Yearly', price: 3999, duration: '365 days' },
];

const UPI_ID = "hairprofit@upi";

export default function SubscribePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
  const [utr, setUtr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const planDetails = PLANS.find(p => p.id === selectedPlan)!;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast({ title: 'UPI ID Copied', description: 'Paste it in your payment app.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!utr.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter the 12-digit UTR/Transaction ID.' });
      return;
    }

    setIsSubmitting(true);
    const response = await submitPayment({
      userId: user.uid,
      email: user.email || '',
      plan: selectedPlan,
      amount: planDetails.price,
      utr: utr,
    });

    setIsSubmitting(false);

    if (response.success) {
      toast({
        title: 'Payment Submitted',
        description: 'Your request is being verified. Access will be granted within 2-4 hours.',
      });
      router.push('/');
    } else {
      toast({ variant: 'destructive', title: 'Submission Failed', description: response.error });
    }
  };

  return (
    <AuthGuard>
      <div className="bg-muted/30 min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Upgrade to HairProfit Pro</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              You need a Pro subscription to access <strong>{from.replace('/', '').replace('-', ' ')}</strong> and other advanced features.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary p-1.5 rounded-full text-xs">1</span>
                  Choose a Plan
                </h2>
                <RadioGroup value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as SubscriptionPlan)} className="grid grid-cols-1 gap-4">
                  {PLANS.map((plan) => (
                    <Label
                      key={plan.id}
                      htmlFor={plan.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPlan === plan.id ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={plan.id} id={plan.id} />
                        <div>
                          <p className="font-bold">{plan.name}</p>
                          <p className="text-xs text-muted-foreground">Valid for {plan.duration}</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold">₹{plan.price}</p>
                    </Label>
                  ))}
                </RadioGroup>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary p-1.5 rounded-full text-xs">2</span>
                  Pay via UPI
                </h2>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="bg-muted p-4 rounded-lg flex flex-col items-center gap-4 mb-6">
                      <QrCode className="h-40 w-40 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground italic">Scan QR code in any UPI App (GPay, PhonePe, Paytm)</p>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                      <span className="font-mono text-sm">{UPI_ID}</span>
                      <Button variant="ghost" size="sm" onClick={handleCopyUPI}>
                        <Copy className="h-4 w-4 mr-2" /> Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="bg-primary/10 text-primary p-1.5 rounded-full text-xs">3</span>
                Submit Transaction ID
              </h2>
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Verify Payment
                  </CardTitle>
                  <CardDescription>
                    After paying <strong>₹{planDetails.price}</strong>, enter the 12-digit UTR/Transaction ID below.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="utr">12-Digit Transaction ID (UTR)</Label>
                      <Input
                        id="utr"
                        placeholder="e.g., 412388776655"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        required
                      />
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="text-sm font-bold text-blue-800 mb-2">Pro Features Unlocked:</h4>
                      <ul className="text-xs text-blue-700 space-y-1.5">
                        <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Hair Marketplace Access</li>
                        <li className="flex items-center gap-2"><Check className="h-3 w-3" /> AI-Powered Market Analysis</li>
                        <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Advanced Profit Calculations</li>
                        <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Professional PDF Quotes & Invoices</li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'I Have Paid'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
