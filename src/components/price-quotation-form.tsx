'use client';

import { useState, useMemo, useRef, ChangeEvent } from 'react';
import { PlusCircle, Trash2, Upload, FileDown, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import type { QuotationItem } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const initialItem: QuotationItem = {
  id: crypto.randomUUID(),
  format: 'Weave',
  length: '16 inches',
  origin: 'Brazilian',
  quantity: 10,
  price: 55,
};

export default function PriceQuotationForm() {
  const [logo, setLogo] = useState<string | null>(null);
  const [quotationRef, setQuotationRef] = useState('Q-2024-001');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('en-CA');
  });

  const [clientInfo, setClientInfo] = useState({ toName: '', toContact: '' });
  const [myInfo, setMyInfo] = useState({ fromName: '', fromContact: '' });

  const [items, setItems] = useState<QuotationItem[]>([initialItem]);
  const [shippingCost, setShippingCost] = useState<number | string>(50);
  const [shippingCarrier, setShippingCarrier] = useState('DHL Express');
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

  const handleItemChange = (id: string, field: keyof Omit<QuotationItem, 'id'>, value: string | number) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleNumericItemChange = (id: string, field: 'quantity' | 'price', value: string) => {
     const numValue = parseFloat(value);
     handleItemChange(id, field, isNaN(numValue) ? '' : numValue);
  };

  const addNewItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        format: '',
        length: '',
        origin: '',
        quantity: 1,
        price: 0,
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
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
        const canvas = await html2canvas(content, { scale: 2, useCORS: true });
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


  return (
    <div className="bg-muted min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-body">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Price Quotation Builder</h1>
            <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </Button>
        </div>

        <div ref={pdfRef} className="bg-white p-12 shadow-lg" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
            <header className="flex justify-between items-start pb-8 border-b">
                <div className="w-1/3">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-48 h-24 border-2 border-dashed rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
                        {logo ? <img src={logo} alt="Business Logo" className="max-h-full max-w-full object-contain" /> : <span className="text-muted-foreground text-sm flex items-center gap-2"><Upload className="h-4 w-4" /> Upload Logo</span>}
                    </button>
                </div>

                <div className="text-right">
                    <h2 className="text-4xl font-bold uppercase text-primary">Quotation</h2>
                    <div className="flex items-center justify-end mt-4">
                        <Label htmlFor="quotationRef" className="text-right mr-2">Ref:</Label>
                        <Input id="quotationRef" value={quotationRef} onChange={e => setQuotationRef(e.target.value)} className="w-40 h-8 text-right" />
                    </div>
                    <div className="flex items-center justify-end mt-2">
                        <Label htmlFor="date" className="text-right mr-2">Date:</Label>
                        <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40 h-8 text-right" />
                    </div>
                    <div className="flex items-center justify-end mt-2">
                        <Label htmlFor="validUntil" className="text-right mr-2">Valid Until:</Label>
                        <Input id="validUntil" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-40 h-8 text-right" />
                    </div>
                </div>
            </header>

            <section className="flex justify-between mt-8">
                <div className="space-y-2">
                    <h3 className="font-semibold text-muted-foreground">To:</h3>
                    <Input placeholder="Buyer Name / Company" value={clientInfo.toName} onChange={e => setClientInfo(prev => ({ ...prev, toName: e.target.value }))} className="w-64" />
                    <Input placeholder="Email / Phone" value={clientInfo.toContact} onChange={e => setClientInfo(prev => ({ ...prev, toContact: e.target.value }))} className="w-64" />
                </div>
                <div className="space-y-2 text-right">
                     <h3 className="font-semibold text-muted-foreground">From:</h3>
                    <Input placeholder="Your Business Name" value={myInfo.fromName} onChange={e => setMyInfo(prev => ({ ...prev, fromName: e.target.value }))} className="w-64 text-right" />
                    <Input placeholder="Your Email / Phone" value={myInfo.fromContact} onChange={e => setMyInfo(prev => ({ ...prev, fromContact: e.target.value }))} className="w-64 text-right" />
                </div>
            </section>

            <section className="mt-10">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[25%]">Format</TableHead>
                            <TableHead>Length</TableHead>
                            <TableHead>Origin</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Price (USD)</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map(item => (
                            <TableRow key={item.id}>
                                <TableCell><Input value={item.format} onChange={e => handleItemChange(item.id, 'format', e.target.value)} placeholder="e.g. Weave" /></TableCell>
                                <TableCell><Input value={item.length} onChange={e => handleItemChange(item.id, 'length', e.target.value)} placeholder="e.g. 16 inches" /></TableCell>
                                <TableCell><Input value={item.origin} onChange={e => handleItemChange(item.id, 'origin', e.target.value)} placeholder="e.g. Brazilian" /></TableCell>
                                <TableCell><Input type="number" value={item.quantity} onChange={e => handleNumericItemChange(item.id, 'quantity', e.target.value)} className="w-20" /></TableCell>
                                <TableCell><Input type="number" value={item.price} onChange={e => handleNumericItemChange(item.id, 'price', e.target.value)} className="w-24" /></TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0))}</TableCell>
                                <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button variant="outline" size="sm" onClick={addNewItem} className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </section>
            
            <section className="flex justify-end mt-8">
                <div className="w-1/2 space-y-3">
                     <div className="flex justify-between items-center">
                        <span className="font-medium">Subtotal</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="font-medium">Shipping via</span>
                        <div className="flex items-center gap-2">
                            <Input value={shippingCarrier} onChange={e => setShippingCarrier(e.target.value)} className="w-28 h-8" />:
                            <Input type="number" value={shippingCost} onChange={e => setShippingCost(Number(e.target.value))} className="w-24 h-8 text-right" />
                        </div>
                     </div>
                     <div className="border-t pt-3 flex justify-between items-center text-xl font-bold text-primary">
                        <span>Grand Total</span>
                        <span>{formatCurrency(grandTotal)}</span>
                     </div>
                </div>
            </section>
            
            <section className="mt-12 pt-8 border-t text-sm">
                <h3 className="font-semibold mb-2">Payment & Logistics</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><strong>Payment:</strong> 50% advance (Bank Transfer / Wise / PayPal)</li>
                    <li><strong>Delivery Time:</strong> 3-7 business days after payment confirmation.</li>
                    <li><strong>Packaging:</strong> Standard polybag (custom branding available on bulk orders).</li>
                </ul>
            </section>

            <footer className="mt-12 pt-8 border-t text-sm text-muted-foreground">
                <Label className="font-semibold text-foreground">Bank/Payment Details:</Label>
                <Textarea value={bankDetails} onChange={e => setBankDetails(e.target.value)} rows={3} className="mt-1" />
                <p className="mt-6 text-center italic">
                    Thank you for considering {myInfo.fromName || '[Your Business Name]'}! Feel free to reach out for samples or bulk pricing.
                </p>
            </footer>
        </div>
      </div>
    </div>
  );
}
