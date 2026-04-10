'use client';

import { useState, useMemo, useRef, ChangeEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, Trash2, Upload, FileDown, Loader2, FileUp, RefreshCw, Eye, FilePlus2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import type { QuotationItem, QuotationData } from '@/types';
import { quotationDataSchema } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import QuotationPdfReport from './quotation-pdf-report';
import { fetchExchangeRate } from '@/app/actions';
import { useIsMobile } from '@/hooks/use-mobile';

const initialItem: QuotationItem = {
  id: crypto.randomUUID(),
  length: '16 inches',
  quantity: 10,
  price: 55,
};

const getInitialData = (): QuotationData => ({
  logo: null,
  quotationRef: '', // This will be set in useEffect
  date: new Date().toISOString().split('T')[0],
  validUntil: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  })(),
  clientInfo: { toName: '', toAddress: '' },
  myInfo: { fromName: '', fromAddress: '' },
  productFormat: 'Rubber Band',
  productOrigin: 'Indian',
  items: [
    initialItem,
    { id: crypto.randomUUID(), length: '18 inches', quantity: 20, price: 60 }
  ],
  shippingCost: 50,
  shippingCarrier: 'DHL Express',
  currency: 'USD',
  displayCurrency: 'INR',
  exchangeRate: 0.0107,
  paymentDetails: 'Bank: [Your Bank Name]\nAccount #: [Your Account #]\nUPI: [your-upi@okbank]',
  termsAndConditions: `• Payment: 50% advance (Bank Transfer / Wise / PayPal)
• Delivery Time: 3-7 business days after payment confirmation.
• Packaging: Standard polybag (custom branding available on bulk orders).`,
});


const QuotationInput = (props: React.ComponentProps<typeof Input>) => (
    <Input {...props} className="bg-muted/50 border-none h-auto py-1 px-2 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" />
);

const QuotationTextarea = (props: React.ComponentProps<typeof Textarea>) => (
    <Textarea {...props} className="bg-muted/50 border-none py-1 px-2 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 leading-snug text-sm" rows={3} />
);

const currencySymbols: { [key: string]: string } = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
};


function getTimeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day(s) ago`;
}

export default function PriceQuotationForm() {
  const [data, setData] = useState<QuotationData>(getInitialData());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [rateUpdatedAt, setRateUpdatedAt] = useState<number | null>(null);

  const pdfRef = useRef<HTMLDivElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    const lastRef = localStorage.getItem('lastQuotationRef');
    let nextRef = '';
    const currentYear = new Date().getFullYear().toString();

    if (lastRef) {
      const parts = lastRef.split('-');
      if (parts.length === 3) {
        const year = parts[1];
        const num = parseInt(parts[2], 10);

        if (year === currentYear && !isNaN(num)) {
          // Same year, increment number
          const nextNum = (num + 1).toString().padStart(3, '0');
          nextRef = `Q-${currentYear}-${nextNum}`;
        } else {
          // New year or invalid format, reset for the current year
           nextRef = `Q-${currentYear}-001`;
        }
      }
    }
    
    if (!nextRef) {
      // No lastRef found, start from 1 for the current year
      nextRef = `Q-${currentYear}-001`;
    }
    
    const savedTerms = localStorage.getItem('business_terms');
    const savedPayment = localStorage.getItem('business_payment');

    setData(prev => ({ 
      ...prev, 
      quotationRef: nextRef,
      termsAndConditions: savedTerms || prev.termsAndConditions,
      paymentDetails: savedPayment || prev.paymentDetails
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setData(prev => ({...prev, logo: event.target?.result as string}));
        toast({ title: 'Logo uploaded successfully.' });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleInfoChange = (section: 'myInfo' | 'clientInfo', e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({
        ...prev,
        [section]: {
            ...prev[section],
            [name]: value
        }
    }));
  };

  const handleFieldChange = (field: keyof QuotationData, value: any) => {
      setData(prev => ({...prev, [field]: value}));
  }

  const handleItemChange = (id: string, field: keyof Omit<QuotationItem, 'id'>, value: string) => {
    setData(prev => ({
        ...prev,
        items: prev.items.map(item => {
            if (item.id !== id) return item;
            if (field === 'quantity' || field === 'price') {
                return { ...item, [field]: value === '' ? '' : Number(value) }
            }
            return { ...item, [field]: value }
        })
    }));
  };

  const addNewItem = () => {
    setData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: crypto.randomUUID(), length: '', quantity: '', price: '' },
      ]
    }));
  };

  const removeItem = (id: string) => {
    setData(prev => ({...prev, items: prev.items.filter(item => item.id !== id)}));
  };

  const subtotal = useMemo(() => {
    return data.items.reduce((acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return acc + quantity * price;
    }, 0);
  }, [data.items]);

  const grandTotal = useMemo(() => {
      return subtotal + (Number(data.shippingCost) || 0);
  }, [subtotal, data.shippingCost]);
  
  const convertedGrandTotal = useMemo(() => {
    const rate = Number(data.exchangeRate) || 1;
    if (data.currency === data.displayCurrency || rate === 0) {
      return grandTotal;
    }
    return grandTotal / rate;
  }, [grandTotal, data.currency, data.displayCurrency, data.exchangeRate]);


  const formatCurrency = (value: number, curr: string) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(value);
  };
  
  const handleDownloadPdf = async () => {
    const content = pdfRef.current;
    if (!content) {
        toast({ variant: "destructive", title: "Error", description: "Could not find content to generate PDF." });
        return;
    }

    localStorage.setItem('lastQuotationRef', data.quotationRef);

    setIsGeneratingPdf(true);
    toast({ title: 'Generating PDF...', description: 'Please wait a moment.' });

    try {
        const canvas = await html2canvas(content, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;

        let finalImgWidth = pdfWidth;
        let finalImgHeight = pdfWidth / ratio;
        
        if (finalImgHeight > pdfHeight) {
            finalImgHeight = pdfHeight;
            finalImgWidth = finalImgHeight * ratio;
        }

        const x = (pdfWidth - finalImgWidth) / 2;
        
        pdf.addImage(imgData, 'PNG', x, 0, finalImgWidth, finalImgHeight);
        pdf.save(`Quotation-${data.quotationRef}.pdf`);
        
    } catch (error) {
        console.error("Failed to generate PDF", error);
        toast({ variant: "destructive", title: "PDF Generation Failed", description: "An unexpected error occurred." });
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const handleCreateInvoice = () => {
    try {
        const jsonString = JSON.stringify(data);
        localStorage.setItem('quotationForInvoice', jsonString);
        toast({
            title: 'Quotation Data Saved',
            description: 'Redirecting to the invoice builder...',
        });
        router.push('/invoice');
    } catch (e) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not prepare data for invoice.',
        });
    }
  };

  const handleExportJson = () => {
    const exportData = { ...data, logo: undefined };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotation-${data.quotationRef || 'draft'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'Quotation data exported successfully.' });
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const jsonData = JSON.parse(result);
        
        if (jsonData.items && Array.isArray(jsonData.items)) {
            jsonData.items = jsonData.items.map((item: any) => ({
                ...item,
                id: item.id || crypto.randomUUID()
            }));
        }

        const validatedData = quotationDataSchema.parse(jsonData);

        setData(prev => ({...prev, ...validatedData}));

        toast({ title: 'Success', description: 'Quotation data imported successfully.' });
      } catch (error) {
        console.error('Import failed', error);
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description:
            error instanceof z.ZodError
              ? 'The data structure in the file is invalid.'
              : 'The selected file is not valid JSON.',
        });
      }
    };
    reader.readAsText(file);
    if (jsonFileInputRef.current) {
        jsonFileInputRef.current.value = '';
    }
  };

  const handleFetchRate = async () => {
    setIsFetchingRate(true);
    toast({ title: 'Fetching live exchange rate...'});

    const response = await fetchExchangeRate({ baseCurrency: data.displayCurrency, targetCurrency: data.currency });

    setIsFetchingRate(false);
    if (response.success && response.data) {
        handleFieldChange('exchangeRate', response.data.rate.toFixed(4));
	setRateUpdatedAt(response.data.lastUpdated || null);
        toast({ title: 'Success', description: `Exchange rate updated to ${response.data.rate.toFixed(4)}`});
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch the exchange rate.' });
    }
  };

  const isConversionActive = data.currency !== data.displayCurrency;

  const HelpInfo = ({ title, children }: { title: string, children: React.ReactNode }) => {
    if (isMobile) {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 cursor-help" type="button">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="pt-2 text-base">{children}</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
    }
    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 cursor-help" type="button">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{children}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="bg-muted min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-body">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost" className="pl-0">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-center sm:text-left">Price Quotation Builder</h1>
            <div className="flex items-center gap-2 flex-wrap justify-center">
                <Button variant="outline" size="sm" onClick={() => jsonFileInputRef.current?.click()}>
                    <FileUp className="mr-2 h-4 w-4" /> Import
                </Button>
                <input type="file" ref={jsonFileInputRef} onChange={handleImportJson} className="hidden" accept="application/json" />
                <Button variant="outline" size="sm" onClick={handleExportJson}>
                    <FileDown className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </Button>
                <Button size="sm" onClick={handleCreateInvoice}>
                    <FilePlus2 className="mr-2 h-4 w-4" /> Create Invoice
                </Button>
                <Button size="sm" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                    {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                </Button>
            </div>
        </div>

        <div className="bg-white p-6 md:p-12 shadow-lg rounded-lg">
            <header className="flex flex-col sm:flex-row justify-between items-start gap-8 sm:gap-4 pb-8 border-b">
                <div className="w-full sm:w-1/3">
                    <input ref={logoFileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <button
                      onClick={() => logoFileInputRef.current?.click()}
                      className={cn(
                        "w-48 h-24 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors",
                        !data.logo && "border-2 border-dashed"
                      )}
                    >
                        {data.logo ? <img src={data.logo} alt="Business Logo" className="max-h-full max-w-full object-contain" /> : <span className="text-muted-foreground text-sm flex items-center gap-2"><Upload className="h-4 w-4" /> Upload Logo</span>}
                    </button>
                </div>

                <div className="w-full sm:w-auto text-left sm:text-right space-y-2">
                    <h2 className="text-4xl font-bold uppercase text-primary">Quotation</h2>
                    <div className="inline-grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 text-left">
                        <Label htmlFor="quotationRef" className="font-bold text-base">Ref:</Label>
                        <QuotationInput id="quotationRef" value={data.quotationRef} onChange={e => handleFieldChange('quotationRef', e.target.value)} className="w-40 font-normal" />
                    
                        <Label htmlFor="date" className="font-bold text-base">Date:</Label>
                        <QuotationInput id="date" type="date" value={data.date} onChange={e => handleFieldChange('date', e.target.value)} className="w-40 font-normal" />
                    
                        <Label htmlFor="validUntil" className="font-bold text-base">Valid Until:</Label>
                        <QuotationInput id="validUntil" type="date" value={data.validUntil} onChange={e => handleFieldChange('validUntil', e.target.value)} className="w-40 font-normal" />
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
                <div>
                    <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-2">To:</h3>
                    <div className="space-y-2 text-sm pr-0 sm:pr-4">
                        <QuotationInput name="toName" placeholder="Buyer Name / Company" value={data.clientInfo.toName} onChange={e => handleInfoChange('clientInfo', e)} />
                        <QuotationTextarea name="toAddress" placeholder="Buyer Full Address..." value={data.clientInfo.toAddress} onChange={e => handleInfoChange('clientInfo', e)} rows={4} />
                    </div>
                </div>
                <div className="sm:text-right">
                    <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-2">From:</h3>
                     <div className="space-y-2 text-sm pl-0 sm:pl-4">
                        <QuotationInput name="fromName" placeholder="Your Business Name" value={data.myInfo.fromName} onChange={e => handleInfoChange('myInfo', e)} className="sm:text-right" />
                        <QuotationTextarea name="fromAddress" placeholder="Your Full Address..." value={data.myInfo.fromAddress} onChange={e => handleInfoChange('myInfo', e)} className="sm:text-right" rows={4} />
                    </div>
                </div>
            </section>
            
            <section className="mt-8">
                <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-2">Product Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg">
                    <div>
                        <Label htmlFor="productFormat" className="text-sm font-medium">Format</Label>
                        <QuotationInput id="productFormat" value={data.productFormat} onChange={e => handleFieldChange('productFormat', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="productOrigin" className="text-sm font-medium">Origin</Label>
                        <QuotationInput id="productOrigin" value={data.productOrigin} onChange={e => handleFieldChange('productOrigin', e.target.value)} />
                    </div>
                </div>
            </section>

            <section className="mt-8">
                <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-2">Currency & Exchange Rate</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-3 rounded-lg items-end">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Label htmlFor="pricingCurrency" className="text-sm font-medium">Pricing Currency</Label>
                            <HelpInfo title="Pricing Currency">This is your internal currency for cost calculation.</HelpInfo>
                        </div>
                        <Select value={data.currency} onValueChange={(value) => handleFieldChange('currency', value)}>
                            <SelectTrigger id="pricingCurrency" className="bg-white focus:ring-primary focus-visible:ring-1 focus-visible:ring-offset-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="INR">INR</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Label htmlFor="displayCurrency" className="text-sm font-medium">Display Currency</Label>
                            <HelpInfo title="Display Currency">This is the currency your customer will see on the final quote.</HelpInfo>
                        </div>
                        <Select value={data.displayCurrency} onValueChange={(value) => handleFieldChange('displayCurrency', value)}>
                            <SelectTrigger id="displayCurrency" className="bg-white focus:ring-primary focus-visible:ring-1 focus-visible:ring-offset-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="INR">INR</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {isConversionActive && (
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Label htmlFor="exchangeRate" className="text-sm font-medium">Rate (1 {data.displayCurrency} = ?)</Label>
                                <HelpInfo title={`Exchange Rate (1 ${data.displayCurrency} = ? ${data.currency})`}>
                                    The rate to convert from Display to Pricing currency. Example: if 1 USD = 83 INR, and INR is your pricing currency, the rate is 83.
                                </HelpInfo>
                            </div>
                            <div className="flex items-center gap-2">
                                <QuotationInput id="exchangeRate" type="number" value={data.exchangeRate} onChange={e => handleFieldChange('exchangeRate', e.target.value === '' ? '' : Number(e.target.value))} className="bg-white text-right" />
                                <Button size="icon" variant="ghost" onClick={handleFetchRate} disabled={isFetchingRate} className="h-9 w-9 flex-shrink-0">
                                    {isFetchingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                            </div>
			
			{/* ✅ ADD EXACTLY HERE */}
        			{rateUpdatedAt && (
            				<p className="text-xs text-gray-500 mt-1">
                			Updated {getTimeAgo(rateUpdatedAt)}
            				</p>
        		)}
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-6">
                <div className="rounded-lg overflow-x-auto border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="p-2 font-bold text-gray-700 min-w-[150px]">Length</TableHead>
                                <TableHead className="p-2 text-right font-bold text-gray-700">Qty</TableHead>
                                <TableHead className="p-2 text-right font-bold text-gray-700">Price ({data.currency})</TableHead>
                                <TableHead className="hidden sm:table-cell text-right p-2 font-bold text-gray-700">Total</TableHead>
                                <TableHead className="w-12 p-0"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.items.map(item => (
                                <TableRow key={item.id} className="border-b-0">
                                    <TableCell className="p-1"><QuotationInput value={item.length} onChange={e => handleItemChange(item.id, 'length', e.target.value)} placeholder="e.g., 16 inches" /></TableCell>
                                    <TableCell className="p-1"><QuotationInput type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="w-20 text-right" /></TableCell>
                                    <TableCell className="p-1"><QuotationInput type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', e.target.value)} className="w-24 text-right" /></TableCell>
                                    <TableCell className="hidden sm:table-cell text-right font-medium p-1">{formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0), data.currency)}</TableCell>
                                    <TableCell className="p-1"><Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <Button variant="ghost" onClick={addNewItem} className="mt-2 text-primary hover:text-primary hover:bg-primary/10">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </section>
            
            <section className="flex justify-end mt-8">
                 <div className="w-full sm:w-1/2 md:w-2/5 space-y-2 text-sm">
                     <div className="grid grid-cols-[1fr_auto] items-baseline">
                        <span className="font-medium text-muted-foreground">Subtotal</span>
                        <span className="font-semibold text-right">{formatCurrency(subtotal, data.currency)}</span>
                     </div>
                     <div className="grid grid-cols-[1fr_auto] items-baseline">
                        <span className="font-medium text-muted-foreground flex items-center">Shipping via <QuotationInput value={data.shippingCarrier} onChange={e => handleFieldChange('shippingCarrier', e.target.value)} className="w-24 ml-2" /></span>
                        <div className="flex items-center bg-muted/50 rounded-md w-28 justify-self-end focus-within:ring-1 focus-within:ring-primary">
                            <span className="pl-3 text-sm text-muted-foreground pointer-events-none">{currencySymbols[data.currency]}</span>
                            <Input
                                type="number"
                                value={data.shippingCost}
                                onChange={e => handleFieldChange('shippingCost', e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full text-right bg-transparent border-none h-auto py-1 px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                        </div>
                     </div>
                     <div className="border-t pt-2 mt-2 grid grid-cols-2 items-center text-xl font-bold text-primary">
                        <span>Grand Total ({data.currency})</span>
                        <span className="text-right">{formatCurrency(grandTotal, data.currency)}</span>
                     </div>
                      {isConversionActive && (
                        <div className="grid grid-cols-2 items-center text-md font-bold text-muted-foreground">
                            <span>Grand Total ({data.displayCurrency})</span>
                            <span className="text-right">{formatCurrency(convertedGrandTotal, data.displayCurrency)}</span>
                        </div>
                     )}
                </div>
            </section>
            
            <div className="flex-grow" style={{ minHeight: '50px' }}></div>

            <footer className="mt-auto pt-8 text-sm border-t">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
                    <div>
                        <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-2">Terms &amp; Conditions</h3>
                        <Textarea value={data.termsAndConditions} onChange={e => handleFieldChange('termsAndConditions', e.target.value)} rows={4} className="bg-muted/50 border-none p-2 leading-relaxed" />
                    </div>
                     <div>
                        <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-2">Payment Details</h3>
                        <Textarea value={data.paymentDetails} onChange={e => handleFieldChange('paymentDetails', e.target.value)} rows={4} className="bg-muted/50 border-none p-2 leading-relaxed" />
                    </div>
                </div>
                <p className="mt-8 text-center text-muted-foreground italic">
                    Thank you for considering {data.myInfo.fromName || '[Your Business Name]'}! Feel free to reach out for samples or bulk pricing.
                </p>
            </footer>
        </div>
      </div>
      <div className="absolute -z-10 -left-[9999px] top-0">
        <div ref={pdfRef}>
           <QuotationPdfReport
              data={data}
              subtotal={subtotal}
              grandTotal={grandTotal}
              convertedGrandTotal={convertedGrandTotal}
            />
        </div>
      </div>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-2 border-b">
            <DialogTitle>Quotation Preview</DialogTitle>
            <DialogDescription>
              This is a preview of the final PDF document. Scroll to see the full page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/40 p-8">
            <div className="mx-auto bg-white shadow-lg" style={{ width: '210mm' }}>
              <QuotationPdfReport
                data={data}
                subtotal={subtotal}
                grandTotal={grandTotal}
                convertedGrandTotal={convertedGrandTotal}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
