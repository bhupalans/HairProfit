'use client';

import { useState, useMemo, useRef, ChangeEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Trash2, Upload, FileDown, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import type { QuotationItem } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';
import QuotationPdfReport from './quotation-pdf-report';

const initialItem: QuotationItem = {
  id: crypto.randomUUID(),
  format: 'Rubber Band',
  length: '16 inches',
  origin: 'Indian',
  quantity: 10,
  price: 55,
};

const QuotationInput = (props: React.ComponentProps<typeof Input>) => (
    <Input {...props} className="bg-muted/50 border-none h-auto py-1 px-2 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" />
);

const QuotationTextarea = (props: React.ComponentProps<typeof Textarea>) => (
    <Textarea {...props} className="bg-muted/50 border-none py-1 px-2 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 leading-snug text-sm" rows={3} />
);

export default function PriceQuotationForm() {
  const [logo, setLogo] = useState<string | null>(null);
  const [quotationRef, setQuotationRef] = useState('Q-2024-001');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [clientInfo, setClientInfo] = useState({ toName: '', toAddress: '' });
  const [myInfo, setMyInfo] = useState({ fromName: '', fromAddress: '' });

  const [items, setItems] = useState<QuotationItem[]>([
    initialItem,
    { id: crypto.randomUUID(), format: 'Rubber Band', length: '18 inches', origin: 'Indian', quantity: 20, price: 60 }
  ]);
  const [shippingCost, setShippingCost] = useState<number | string>(50);
  const [shippingCarrier, setShippingCarrier] = useState('DHL Express');
  const [currency, setCurrency] = useState('USD');
  const [displayCurrency, setDisplayCurrency] = useState('INR');
  const [exchangeRate, setExchangeRate] = useState<number | string>(83.5);
  const [bankDetails, setBankDetails] = useState('Bank: [Your Bank Name]\nAccount #: [Your Account #]\nUPI: [your-upi@okbank]');
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo(event.target?.result as string);
        toast({ title: 'Logo uploaded successfully.' });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleClientInfoChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClientInfo(prev => ({...prev, [name]: value}));
  };

  const handleMyInfoChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMyInfo(prev => ({...prev, [name]: value}));
  };

  const handleItemChange = (id: string, field: keyof Omit<QuotationItem, 'id'>, value: string) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id !== id) return item;
        if (field === 'quantity' || field === 'price') {
            return { ...item, [field]: value === '' ? '' : Number(value) }
        }
        return { ...item, [field]: value }
      })
    );
  };

  const addNewItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        format: '',
        length: '',
        origin: '',
        quantity: '',
        price: '',
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return acc + quantity * price;
    }, 0);
  }, [items]);

  const grandTotal = useMemo(() => {
      return subtotal + (Number(shippingCost) || 0);
  }, [subtotal, shippingCost]);
  
  const convertedGrandTotal = useMemo(() => {
    if (currency === displayCurrency) {
      return grandTotal;
    }
    const rate = Number(exchangeRate) || 1;
    if (rate === 0) return 0;
    return grandTotal / rate;
  }, [grandTotal, currency, displayCurrency, exchangeRate]);

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
        pdf.save(`Quotation-${quotationRef}.pdf`);
        
    } catch (error) {
        console.error("Failed to generate PDF", error);
        toast({ variant: "destructive", title: "PDF Generation Failed", description: "An unexpected error occurred." });
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const isConversionActive = currency !== displayCurrency;

  return (
    <div className="bg-muted min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-body">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost" className="pl-0">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calculator
            </Link>
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Price Quotation Builder</h1>
            <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </Button>
        </div>

        <div className="bg-white p-12 shadow-lg" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
            <header className="flex justify-between items-start pb-8 border-b">
                <div className="w-1/3">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "w-48 h-24 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors",
                        !logo && "border-2 border-dashed"
                      )}
                    >
                        {logo ? <img src={logo} alt="Business Logo" className="max-h-full max-w-full object-contain" /> : <span className="text-muted-foreground text-sm flex items-center gap-2"><Upload className="h-4 w-4" /> Upload Logo</span>}
                    </button>
                </div>

                <div className="text-right space-y-2">
                    <h2 className="text-4xl font-bold uppercase text-primary">Quotation</h2>
                    <div className="inline-grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 text-right text-sm font-semibold">
                        <Label htmlFor="quotationRef" className="font-bold text-base">Ref:</Label>
                        <QuotationInput id="quotationRef" value={quotationRef} onChange={e => setQuotationRef(e.target.value)} className="w-40 text-left font-normal" />
                    
                        <Label htmlFor="date" className="font-bold text-base">Date:</Label>
                        <QuotationInput id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40 text-left font-normal" />
                    
                        <Label htmlFor="validUntil" className="font-bold text-base">Valid Until:</Label>
                        <QuotationInput id="validUntil" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-40 text-left font-normal" />
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-2 mt-8">
                <div>
                    <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-2">To:</h3>
                    <div className="space-y-2 text-sm pr-4">
                        <QuotationInput name="toName" placeholder="Buyer Name / Company" value={clientInfo.toName} onChange={handleClientInfoChange} />
                        <QuotationTextarea name="toAddress" placeholder="Buyer Address" value={clientInfo.toAddress} onChange={handleClientInfoChange} />
                    </div>
                </div>
                <div className="text-right">
                    <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-2">From:</h3>
                     <div className="space-y-2 text-sm pl-4">
                        <QuotationInput name="fromName" placeholder="Your Business Name" value={myInfo.fromName} onChange={handleMyInfoChange} className="text-right" />
                        <QuotationTextarea name="fromAddress" placeholder="Your Business Address" value={myInfo.fromAddress} onChange={handleMyInfoChange} className="text-right" />
                    </div>
                </div>
            </section>

            <section className="mt-10">
                <div className="rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[25%] p-2 font-bold text-gray-700">Format</TableHead>
                                <TableHead className="p-2 font-bold text-gray-700">Length</TableHead>
                                <TableHead className="p-2 font-bold text-gray-700">Origin</TableHead>
                                <TableHead className="p-2 text-right font-bold text-gray-700">Qty</TableHead>
                                <TableHead className="p-2 text-right font-bold text-gray-700">Price ({currency})</TableHead>
                                <TableHead className="text-right p-2 font-bold text-gray-700">Total</TableHead>
                                <TableHead className="w-12 p-0"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id} className="border-b-0">
                                    <TableCell className="p-1"><QuotationInput value={item.format} onChange={e => handleItemChange(item.id, 'format', e.target.value)} placeholder="Format" /></TableCell>
                                    <TableCell className="p-1"><QuotationInput value={item.length} onChange={e => handleItemChange(item.id, 'length', e.target.value)} placeholder="Length" /></TableCell>
                                    <TableCell className="p-1"><QuotationInput value={item.origin} onChange={e => handleItemChange(item.id, 'origin', e.target.value)} placeholder="Origin" /></TableCell>
                                    <TableCell className="p-1"><QuotationInput type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="w-20 text-right" /></TableCell>
                                    <TableCell className="p-1"><QuotationInput type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', e.target.value)} className="w-24 text-right" /></TableCell>
                                    <TableCell className="text-right font-medium p-1">{formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0), currency)}</TableCell>
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
                 <div className="w-1/2 space-y-2 text-sm">
                    <div className="inline-grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 w-full">
                        <span className="font-medium text-muted-foreground">Pricing Currency</span>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger className="bg-muted/50 border-none h-auto py-1 px-2 focus:ring-1 focus:ring-primary focus:ring-offset-0 justify-end">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <span className="font-medium text-muted-foreground">Display Currency</span>
                        <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                          <SelectTrigger className="bg-muted/50 border-none h-auto py-1 px-2 focus:ring-1 focus:ring-primary focus:ring-offset-0 justify-end">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>

                        {isConversionActive && (
                            <>
                                <Label htmlFor="exchangeRate" className="font-medium text-muted-foreground">Rate (1 {displayCurrency} = ? {currency})</Label>
                                <QuotationInput id="exchangeRate" type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value === '' ? '' : Number(e.target.value))} className="w-24 text-right justify-self-end" />
                            </>
                        )}
                    </div>
                     <div className="border-t pt-2 mt-2 grid grid-cols-[1fr_auto] items-baseline">
                        <span className="font-medium text-muted-foreground">Subtotal</span>
                        <span className="font-semibold text-right">{formatCurrency(subtotal, currency)}</span>
                     </div>
                     <div className="grid grid-cols-[1fr_auto] items-baseline">
                        <span className="font-medium text-muted-foreground flex items-center">Shipping via <QuotationInput value={shippingCarrier} onChange={e => setShippingCarrier(e.target.value)} className="w-24 ml-2" /></span>
                        <QuotationInput type="number" value={shippingCost} onChange={e => setShippingCost(e.target.value === '' ? '' : Number(e.target.value))} className="w-24 text-right" />
                     </div>
                     <div className="border-t pt-2 mt-2 grid grid-cols-2 items-center text-xl font-bold text-primary">
                        <span>Grand Total ({currency})</span>
                        <span className="text-right">{formatCurrency(grandTotal, currency)}</span>
                     </div>
                      {isConversionActive && (
                        <div className="grid grid-cols-2 items-center text-md font-bold text-muted-foreground">
                            <span>Grand Total ({displayCurrency})</span>
                            <span className="text-right">{formatCurrency(convertedGrandTotal, displayCurrency)}</span>
                        </div>
                     )}
                </div>
            </section>
            
            <div className="flex-grow" style={{ minHeight: '100px' }}></div>

            <footer className="mt-auto pt-8 text-sm border-t">
                <div className="grid grid-cols-2 gap-8 items-start">
                    <div>
                        <h3 className="font-bold mb-2 uppercase text-xs tracking-wider text-muted-foreground">Payment & Logistics</h3>
                        <div className="text-muted-foreground space-y-1">
                             <div className="flex items-start">
                                <span className="mr-2 mt-1 leading-none text-primary">•</span>
                                <p className="flex-1"><strong>Payment:</strong> 50% advance (Bank Transfer / Wise / PayPal)</p>
                            </div>
                            <div className="flex items-start">
                                <span className="mr-2 mt-1 leading-none text-primary">•</span>
                                <p className="flex-1"><strong>Delivery Time:</strong> 3-7 business days after payment confirmation.</p>
                            </div>
                            <div className="flex items-start">
                                <span className="mr-2 mt-1 leading-none text-primary">•</span>
                                <p className="flex-1"><strong>Packaging:</strong> Standard polybag (custom branding available on bulk orders).</p>
                            </div>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-bold mb-2 uppercase text-xs tracking-wider text-muted-foreground">Bank/Payment Details:</h3>
                        <Textarea value={bankDetails} onChange={e => setBankDetails(e.target.value)} rows={3} className="bg-muted/50 border-none p-2 leading-relaxed" />
                    </div>
                </div>
                <p className="mt-8 text-center text-muted-foreground italic">
                    Thank you for considering {myInfo.fromName || '[Your Business Name]'}! Feel free to reach out for samples or bulk pricing.
                </p>
            </footer>
        </div>
      </div>
      <div className="absolute -z-10 -left-[9999px] top-0">
        <div ref={pdfRef}>
           <QuotationPdfReport
              logo={logo}
              quotationRef={quotationRef}
              date={date}
              validUntil={validUntil}
              clientInfo={clientInfo}
              myInfo={myInfo}
              items={items}
              currency={currency}
              shippingCost={shippingCost}
              shippingCarrier={shippingCarrier}
              bankDetails={bankDetails}
              subtotal={subtotal}
              grandTotal={grandTotal}
              displayCurrency={displayCurrency}
              exchangeRate={exchangeRate}
              convertedGrandTotal={convertedGrandTotal}
            />
        </div>
      </div>
    </div>
  );
}
