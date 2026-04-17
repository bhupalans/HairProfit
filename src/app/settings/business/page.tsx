'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Settings, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import AuthGuard from '@/components/auth-guard';
import { cn } from '@/lib/utils';

export default function BusinessSettingsPage() {
  const { user } = useAuth();
  const [terms, setTerms] = useState('');
  const [payment, setPayment] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && user?.uid) {
      const getScopedKey = (field: string) => `business_${user.uid}_${field}`;

      // Migration Logic
      ['terms', 'payment', 'logo'].forEach(field => {
        const oldKey = `business_${field}`;
        const newKey = getScopedKey(field);
        const oldValue = localStorage.getItem(oldKey);
        if (oldValue && !localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, oldValue);
          localStorage.removeItem(oldKey);
        }
      });

      const savedTerms = localStorage.getItem(getScopedKey('terms'));
      const savedPayment = localStorage.getItem(getScopedKey('payment'));
      const savedLogo = localStorage.getItem(getScopedKey('logo'));
      
      if (savedTerms) setTerms(savedTerms);
      if (savedPayment) setPayment(savedPayment);
      if (savedLogo) setLogo(savedLogo);
    }
  }, [user]);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload a logo smaller than 2MB.',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!user?.uid) return;
    const getScopedKey = (field: string) => `business_${user.uid}_${field}`;

    localStorage.setItem(getScopedKey('terms'), terms);
    localStorage.setItem(getScopedKey('payment'), payment);
    if (logo) {
      localStorage.setItem(getScopedKey('logo'), logo);
    } else {
      localStorage.removeItem(getScopedKey('logo'));
    }

    toast({
      title: 'Settings Saved',
      description: 'Your default business details have been updated.',
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
            <CardContent className="space-y-8">
              {/* Logo Section */}
              <div className="space-y-4">
                <Label className="font-bold uppercase text-xs tracking-wider text-muted-foreground">Default Business Logo</Label>
                <div className="flex flex-col items-center sm:items-start gap-4">
                  <div 
                    className={cn(
                      "w-48 h-24 rounded-lg border-2 border-dashed flex items-center justify-center relative overflow-hidden bg-background group",
                      logo ? "border-solid border-primary/20" : "border-muted-foreground/20"
                    )}
                  >
                    {logo ? (
                      <>
                        <img src={logo} alt="Business Logo" className="max-h-full max-w-full object-contain p-2" />
                        <button 
                          onClick={removeLogo}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No logo set</p>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleLogoUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {logo ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <p className="text-[10px] text-muted-foreground italic">Recommended: Horizontal logo, max 2MB.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms" className="font-bold uppercase text-xs tracking-wider text-muted-foreground">Default Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  placeholder="e.g. • Payment: 50% advance (Bank Transfer / Wise / PayPal)..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="min-h-[150px] bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment" className="font-bold uppercase text-xs tracking-wider text-muted-foreground">Default Payment Details</Label>
                <Textarea
                  id="payment"
                  placeholder="e.g. Bank: [Your Bank Name], Account #: [Your Account #]..."
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  className="min-h-[120px] bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary"
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
