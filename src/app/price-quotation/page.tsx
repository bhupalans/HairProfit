'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PriceQuotationPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="pl-0">
            <Link href="/">
              <ArrowLeft className="mr-2" />
              Back to Calculator
            </Link>
          </Button>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-4xl font-bold tracking-tight">Price Quotation</CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                    Generate a professional price quotation for your customers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-lg border-2 border-dashed bg-muted/30">
                    <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
                    <p className="text-muted-foreground max-w-md text-center">
                        This feature is under construction. Please provide the details for what you'd like to build.
                    </p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
