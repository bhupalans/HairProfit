'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import AuthGuard from '@/components/auth-guard';

export default function BusinessSettingsPage() {
  const [terms, setTerms] = useState('');
  const [payment, setPayment] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTerms = localStorage.getItem('business_terms');
      const savedPayment = localStorage.getItem('business_payment');
      if (savedTerms) setTerms(savedTerms);
      if (savedPayment) setPayment(savedPayment);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('business_terms', terms);
    localStorage.setItem('business_payment', payment);
    toast({
      title: 'Settings Saved',
      description: 'Your default terms and payment details have been updated.',
    });
  };

  return (
    <AuthGuard>
      <div className="bg-muted min-h-screen py-8 sm:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button asChild variant="ghost" className="pl-0">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 text-primary p-2 rounded-lg">
                  <Settings className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold">Business Settings</CardTitle>
              </div>
              <CardDescription>
                Set default values for your quotations and invoices. These will be used to pre-fill new documents when you first open them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="terms" className="font-bold uppercase text-xs tracking-wider text-muted-foreground">Default Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  placeholder="e.g. • Payment: 50% advance (Bank Transfer / Wise / PayPal)..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="min-h-[200px] bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment" className="font-bold uppercase text-xs tracking-wider text-muted-foreground">Default Payment Details</Label>
                <Textarea
                  id="payment"
                  placeholder="e.g. Bank: [Your Bank Name], Account #: [Your Account #]..."
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  className="min-h-[150px] bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Defaults
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
