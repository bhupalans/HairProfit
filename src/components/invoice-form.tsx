'use client';

import { useState, useMemo, useRef, ChangeEvent, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Trash2, Upload, FileDown, Loader2, FileUp, Eye, Percent, Receipt } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { InvoiceItem, InvoiceData, QuotationData } from '@/types';
import { invoiceDataSchema } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import InvoicePdfReport from './invoice-pdf-report';
import { useRouter } from 'next/navigation';

const initialItem: InvoiceItem = {
  id: crypto.randomUUID(),
  description: '16" Indian Straight Hair (1 bundle)',
  quantity: 10,
  price: 65,
};

const getInitialData = (): InvoiceData => ({
  logo: null,
  invoiceRef: '', // Set in useEffect
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  })(),
  clientInfo: { toName: '', toAddress: '' },
  myInfo: { fromName: '', fromAddress: '' },
  items: [initialItem],
  currency: 'USD',
  tax: 0,
  discount: 0,
  shippingCost: 50,
  amountPaid: 0,
  notes: 'All hair is guaranteed to be 100% human hair.',
  terms: 'Payment is due within 14 days. Interest will be charged on overdue invoices.',
});

const FormInput = (props: React.ComponentProps<typeof Input>) => (
    <Input {...props} className="bg-muted/50 border-none h-auto py-1 px-2 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" />
);

const FormTextarea = (props: React.ComponentProps<typeof Textarea>) => (
    <Textarea {...props} className="bg-muted/50 border-none py-1 px-2 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 leading-snug text-sm" rows={3} />
);

const currencySymbols: { [key: string]: string } = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };

export default function InvoiceForm() {
  const [data, setData] = useState<InvoiceData>(getInitialData());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    // This effect runs once on component mount to set the invoice ref and load from quotation if available.
    const lastRef = localStorage.getItem('lastInvoiceRef');
    let nextRef = '';
    const currentYear = new Date().getFullYear().toString();

    if (lastRef) {
      const parts = lastRef.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) {
          const nextNum = (num + 1).toString().padStart(4, '0');
          nextRef = `${currentYear}-${nextNum}`;
        }
      }
    }
    
    if (!nextRef) {
      nextRef = `${currentYear}-0001`;
    }

    const quotationJSON = localStorage.getItem('quotationForInvoice');
    if (quotationJSON) {
        try {
            localStorage.removeItem('quotationForInvoice'); // Clear it after use
            const quotationData: QuotationData = JSON.parse(quotationJSON);

            const performConversion = quotationData.currency !== quotationData.displayCurrency;
            const rate = Number(quotationData.exchangeRate) || 1;

            const getConvertedValue = (value: string | number) => {
                const numericValue = Number(value) || 0;
                if (!performConversion || rate === 0) {
                    return numericValue;
                }
                // The rate is defined as "1 Display Currency = X Pricing Currency".
                // To convert from Pricing Currency to Display Currency, we divide.
                return numericValue / rate;
            };

            const newInvoiceData: Partial<InvoiceData> = {
                logo: quotationData.logo,
                clientInfo: quotationData.clientInfo,
                myInfo: quotationData.myInfo,
                items: quotationData.items.map(item => ({
                    id: crypto.randomUUID(),
                    description: `${item.length} ${quotationData.productOrigin} Hair - ${quotationData.productFormat}`,
                    quantity: item.quantity,
                    price: getConvertedValue(item.price),
                })),
                currency: quotationData.displayCurrency,
                shippingCost: getConvertedValue(quotationData.shippingCost),
            };
            
            setData(prev => ({ ...prev, ...newInvoiceData, invoiceRef: nextRef }));
            
            toast({
                title: 'Invoice Created from Quotation',
                description: `All prices converted to ${quotationData.displayCurrency}. Review and set due date.`,
            });
        } catch(e) {
            console.error("Failed to parse quotation data", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load data from quotation.' });
            setData(prev => ({ ...prev, invoiceRef: nextRef }));
        }
    } else {
        setData(prev => ({ ...prev, invoiceRef: nextRef }));
    }
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
    setData(prev => ({ ...prev, [section]: { ...prev[section], [name]: value } }));
  };

  const handleFieldChange = (field: keyof InvoiceData, value: any) => {
      setData(prev => ({...prev, [field]: value}));
  }
  
  const handleNumericFieldChange = (field: keyof InvoiceData, value: string) => {
    handleFieldChange(field, value === '' ? '' : Number(value));
  }

  const handleItemChange = (id: string, field: keyof Omit<InvoiceItem, 'id'>, value: string) => {
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
    setData(prev => ({ ...prev, items: [...prev.items, { id: crypto.randomUUID(), description: '', quantity: 1, price: '' }] }));
  };

  const removeItem = (id: string) => {
    setData(prev => ({...prev, items: prev.items.filter(item => item.id !== id)}));
  };

  const { subtotal, discountAmount, taxAmount, total, balanceDue } = useMemo(() => {
    const sub = data.items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
    const discount = sub * ((Number(data.discount) || 0) / 100);
    const taxableAmount = sub - discount;
    const tax = taxableAmount * ((Number(data.tax) || 0) / 100);
    const total = taxableAmount + tax + (Number(data.shippingCost) || 0);
    const balance = total - (Number(data.amountPaid) || 0);
    return { subtotal: sub, discountAmount: discount, taxAmount: tax, total, balanceDue: balance };
  }, [data.items, data.discount, data.tax, data.shippingCost, data.amountPaid]);

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
    localStorage.setItem('lastInvoiceRef', data.invoiceRef);

    setIsGeneratingPdf(true);
    toast({ title: 'Generating PDF...', description: 'Please wait a moment.' });

    try {
        const canvas = await html2canvas(content, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps= pdf.getImageProperties(imgData);
        const ratio = imgProps.width / imgProps.height;
        let finalImgHeight = pdfHeight;
        let finalImgWidth = finalImgHeight * ratio;
         if (finalImgWidth > pdfWidth) {
            finalImgWidth = pdfWidth;
            finalImgHeight = finalImgWidth / ratio;
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalImgHeight);
        pdf.save(`Invoice-${data.invoiceRef}.pdf`);
    } catch (error) {
        console.error("Failed to generate PDF", error);
        toast({ variant: "destructive", title: "PDF Generation Failed", description: "An unexpected error occurred." });
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const handleExportJson = () => {
    const exportData = { ...data, logo: undefined };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${data.invoiceRef || 'draft'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'Invoice data exported successfully.' });
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const jsonData = JSON.parse(result);
        jsonData.items = (jsonData.items || []).map((item: any) => ({ ...item, id: item.id || crypto.randomUUID() }));
        const validatedData = invoiceDataSchema.parse(jsonData);
        setData(prev => ({...prev, ...validatedData}));
        toast({ title: 'Success', description: 'Invoice data imported successfully.' });
      } catch (error) {
        console.error('Import failed', error);
        toast({ variant: "destructive", title: "Import Failed", description: error instanceof z.ZodError ? 'Invalid data structure in file.' : 'Invalid JSON file.' });
      }
    };
    reader.readAsText(file);
    if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
  };

  const pdfData = { data, subtotal, discountAmount, taxAmount, total, balanceDue };

  return (
    <div className="bg-muted min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-body">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost" className="pl-0"><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Calculator</Link></Button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-center sm:text-left">Invoice Builder</h1>
            <div className="flex items-center gap-2 flex-wrap justify-center">
                <Button variant="outline" size="sm" onClick={() => jsonFileInputRef.current?.click()}><FileUp className="mr-2 h-4 w-4" /> Import</Button>
                <input type="file" ref={jsonFileInputRef} onChange={handleImportJson} className="hidden" accept="application/json" />
                <Button variant="outline" size="sm" onClick={handleExportJson}><FileDown className="mr-2 h-4 w-4" /> Export</Button>
                <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}><Eye className="mr-2 h-4 w-4" /> Preview</Button>
                <Button size="sm" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>{isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />} {isGeneratingPdf ? 'Generating...' : 'Download PDF'}</Button>
            </div>
        </div>

        <div className="bg-white p-6 md:p-12 shadow-lg rounded-lg">
            <header className="flex flex-col sm:flex-row justify-between items-start gap-8 sm:gap-4 pb-8 border-b">
                <div className="w-full sm:w-1/3">
                    <input ref={logoFileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <button onClick={() => logoFileInputRef.current?.click()} className={cn("w-48 h-24 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors", !data.logo && "border-2 border-dashed")}>
                        {data.logo ? <img src={data.logo} alt="Business Logo" className="max-h-full max-w-full object-contain" /> : <span className="text-muted-foreground text-sm flex items-center gap-2"><Upload className="h-4 w-4" /> Upload Logo</span>}
                    </button>
                </div>

                <div className="w-full sm:w-auto text-left sm:text-right space-y-2">
                    <h2 className="text-4xl font-bold uppercase text-primary flex gap-2 items-center justify-start sm:justify-end"><Receipt /> INVOICE</h2>
                    <div className="inline-grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 text-left">
                        <Label htmlFor="invoiceRef" className="font-bold">Invoice #</Label>
                        <FormInput id="invoiceRef" value={data.invoiceRef} onChange={e => handleFieldChange('invoiceRef', e.target.value)} className="w-40 font-normal" />
                        <Label htmlFor="invoiceDate" className="font-bold">Date:</Label>
                        <FormInput id="invoiceDate" type="date" value={data.invoiceDate} onChange={e => handleFieldChange('invoiceDate', e.target.value)} className="w-40 font-normal" />
                        <Label htmlFor="dueDate" className="font-bold">Due Date:</Label>
                        <FormInput id="dueDate" type="date" value={data.dueDate} onChange={e => handleFieldChange('dueDate', e.target.value)} className="w-40 font-normal" />
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
                <div>
                    <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-2">Bill To:</h3>
                    <div className="space-y-2 text-sm pr-0 sm:pr-4">
                        <FormInput name="toName" placeholder="Client Name / Company" value={data.clientInfo.toName} onChange={e => handleInfoChange('clientInfo', e)} />
                        <FormTextarea name="toAddress" placeholder="Client Full Address..." value={data.clientInfo.toAddress} onChange={e => handleInfoChange('clientInfo', e)} rows={4} />
                    </div>
                </div>
                <div className="sm:text-right">
                    <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-2">From:</h3>
                     <div className="space-y-2 text-sm pl-0 sm:pl-4">
                        <FormInput name="fromName" placeholder="Your Business Name" value={data.myInfo.fromName} onChange={e => handleInfoChange('myInfo', e)} className="sm:text-right" />
                        <FormTextarea name="fromAddress" placeholder="Your Full Address..." value={data.myInfo.fromAddress} onChange={e => handleInfoChange('myInfo', e)} className="sm:text-right" rows={4} />
                    </div>
                </div>
            </section>
            
            <section className="mt-8">
                <div className="rounded-lg overflow-x-auto border">
                    <Table>
                        <TableHeader><TableRow className="bg-muted/50">
                            <TableHead className="p-2 font-bold text-gray-700 min-w-[200px]">Description</TableHead>
                            <TableHead className="p-2 w-24 text-right font-bold text-gray-700">Qty</TableHead>
                            <TableHead className="p-2 w-28 text-right font-bold text-gray-700">Price</TableHead>
                            <TableHead className="hidden sm:table-cell w-32 text-right p-2 font-bold text-gray-700">Total</TableHead>
                            <TableHead className="w-12 p-0"></TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {data.items.map(item => (
                                <TableRow key={item.id} className="border-b-0">
                                    <TableCell className="p-1"><FormInput value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} placeholder="Item description" /></TableCell>
                                    <TableCell className="p-1"><FormInput type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="text-right" /></TableCell>
                                    <TableCell className="p-1"><FormInput type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', e.target.value)} className="text-right" /></TableCell>
                                    <TableCell className="hidden sm:table-cell text-right font-medium p-1">{formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0), data.currency)}</TableCell>
                                    <TableCell className="p-1"><Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <Button variant="ghost" onClick={addNewItem} className="mt-2 text-primary hover:text-primary hover:bg-primary/10"><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
            </section>
            
            <section className="grid grid-cols-1 md:grid-cols-2 mt-8 gap-8">
                <div className="flex flex-col gap-2">
                    <Label className="font-bold uppercase text-xs tracking-wider text-muted-foreground">Currency</Label>
                    <Select value={data.currency} onValueChange={(value) => handleFieldChange('currency', value)}>
                        <SelectTrigger className="bg-muted/50 border-none h-auto py-2 px-2 focus:ring-1 focus:ring-primary focus-visible:ring-offset-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD - United States Dollar</SelectItem>
                            <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full space-y-2 text-sm">
                     <div className="grid grid-cols-[1fr_auto] items-baseline">
                        <span className="font-medium text-muted-foreground">Subtotal</span>
                        <span className="font-semibold text-right">{formatCurrency(subtotal, data.currency)}</span>
                     </div>
                     <div className="grid grid-cols-[1fr_auto] items-baseline">
                        <Label htmlFor='discount' className="font-medium text-muted-foreground">Discount</Label>
                        <div className="flex items-center bg-muted/50 rounded-md w-28 justify-self-end focus-within:ring-1 focus-within:ring-primary">
                            <Input id="discount" type="number" value={data.discount} onChange={e => handleNumericFieldChange('discount', e.target.value)} className="w-full text-right bg-transparent border-none h-auto py-1 px-2 focus-visible:ring-0" />
                            <Percent className="h-4 w-4 mr-2 text-muted-foreground" />
                        </div>
                     </div>
                      <div className="grid grid-cols-[1fr_auto] items-baseline">
                        <Label htmlFor='tax' className="font-medium text-muted-foreground">Tax</Label>
                        <div className="flex items-center bg-muted/50 rounded-md w-28 justify-self-end focus-within:ring-1 focus-within:ring-primary">
                            <Input id="tax" type="number" value={data.tax} onChange={e => handleNumericFieldChange('tax', e.target.value)} className="w-full text-right bg-transparent border-none h-auto py-1 px-2 focus-visible:ring-0" />
                            <Percent className="h-4 w-4 mr-2 text-muted-foreground" />
                        </div>
                     </div>
                     <div className="grid grid-cols-[1fr_auto] items-baseline">
                        <Label htmlFor="shippingCost" className="font-medium text-muted-foreground">Shipping</Label>
                        <div className="flex items-center bg-muted/50 rounded-md w-28 justify-self-end focus-within:ring-1 focus-within:ring-primary">
                            <span className="pl-3 text-sm text-muted-foreground pointer-events-none">{currencySymbols[data.currency]}</span>
                            <Input id="shippingCost" type="number" value={data.shippingCost} onChange={e => handleNumericFieldChange('shippingCost', e.target.value)} className="w-full text-right bg-transparent border-none h-auto py-1 px-2 focus-visible:ring-0" />
                        </div>
                     </div>
                     <div className="border-t pt-2 mt-2 grid grid-cols-2 items-center text-lg font-bold">
                        <span>Total</span>
                        <span className="text-right">{formatCurrency(total, data.currency)}</span>
                     </div>
                      <div className="grid grid-cols-[1fr_auto] items-baseline">
                        <Label htmlFor='amountPaid' className="font-medium text-muted-foreground">Amount Paid</Label>
                        <div className="flex items-center bg-muted/50 rounded-md w-28 justify-self-end focus-within:ring-1 focus-within:ring-primary">
                            <span className="pl-3 text-sm text-muted-foreground pointer-events-none">{currencySymbols[data.currency]}</span>
                            <Input id="amountPaid" type="number" value={data.amountPaid} onChange={e => handleNumericFieldChange('amountPaid', e.target.value)} className="w-full text-right bg-transparent border-none h-auto py-1 px-2 focus-visible:ring-0" />
                        </div>
                     </div>
                     <div className="border-t pt-2 mt-2 grid grid-cols-2 items-center text-xl font-bold text-primary bg-primary/10 p-2 rounded-lg">
                        <span>Balance Due</span>
                        <span className="text-right">{formatCurrency(balanceDue, data.currency)}</span>
                     </div>
                </div>
            </section>
            
            <footer className="mt-8 pt-8 text-sm border-t">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
                    <div>
                        <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-2">Notes</h3>
                        <FormTextarea value={data.notes} onChange={e => handleFieldChange('notes', e.target.value)} rows={4} className="bg-muted/50 border-none p-2 leading-relaxed" />
                    </div>
                     <div>
                        <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-2">Terms</h3>
                        <FormTextarea value={data.terms} onChange={e => handleFieldChange('terms', e.target.value)} rows={4} className="bg-muted/50 border-none p-2 leading-relaxed" />
                    </div>
                </div>
            </footer>
        </div>
      </div>
      <div className="absolute -z-10 -left-[9999px] top-0"><div ref={pdfRef}><InvoicePdfReport {...pdfData} /></div></div>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-2 border-b"><DialogTitle>Invoice Preview</DialogTitle><DialogDescription>This is a preview of the final PDF document.</DialogDescription></DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/40 p-8">
            <div className="mx-auto bg-white shadow-lg" style={{ width: '210mm' }}><InvoicePdfReport {...pdfData} /></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
