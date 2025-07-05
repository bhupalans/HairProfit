'use client';

import type { QuotationItem } from '@/types';

interface QuotationPdfReportProps {
  logo: string | null;
  quotationRef: string;
  date: string;
  validUntil: string;
  clientInfo: { toName: string; toAddress: string; };
  myInfo: { fromName: string; fromAddress: string; };
  items: QuotationItem[];
  currency: string;
  shippingCost: number | string;
  shippingCarrier: string;
  bankDetails: string;
  subtotal: number;
  grandTotal: number;
  displayCurrency: string;
  exchangeRate: number | string;
  convertedGrandTotal: number;
}

const formatCurrency = (value: number, currency: string) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
};

export default function QuotationPdfReport({
    logo,
    quotationRef,
    date,
    validUntil,
    clientInfo,
    myInfo,
    items,
    currency,
    shippingCost,
    shippingCarrier,
    bankDetails,
    subtotal,
    grandTotal,
    displayCurrency,
    exchangeRate,
    convertedGrandTotal
}: QuotationPdfReportProps) {
  
  const finalCurrency = displayCurrency || currency;
  const performConversion = currency !== finalCurrency && finalCurrency;
  // Ensure we don't divide by zero if user enters 0 or blank
  const conversionRate = performConversion ? (Number(exchangeRate) || 1) : 1;

  const getConvertedValue = (value: number | string) => {
    const numericValue = Number(value) || 0;
    if (performConversion) {
        // use division for conversion
        return numericValue / conversionRate;
    }
    return numericValue;
  }

  return (
    <div className="bg-white text-black p-12 font-sans" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
        <header className="flex justify-between items-start pb-8 border-b border-gray-200">
            <div className="w-1/3">
                {logo && <img src={logo} alt="Business Logo" className="max-h-20 max-w-full object-contain" />}
            </div>

            <div className="text-right space-y-2">
                <h2 className="text-4xl font-bold uppercase" style={{color: 'hsl(var(--primary))'}}>QUOTATION</h2>
                <div className="inline-grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 text-sm text-right">
                    <span className="font-bold text-gray-700 text-base">Ref:</span>
                    <span className="text-left font-normal">{quotationRef}</span>
                
                    <span className="font-bold text-gray-700 text-base">Date:</span>
                    <span className="text-left font-normal">{date}</span>
                
                    <span className="font-bold text-gray-700 text-base">Valid Until:</span>
                    <span className="text-left font-normal">{validUntil}</span>
                </div>
            </div>
        </header>

        <section className="grid grid-cols-2 mt-8 text-sm">
            <div>
                <h3 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-2">To:</h3>
                <div className="space-y-1 pr-4">
                    <p className="font-semibold">{clientInfo.toName}</p>
                    <p className="whitespace-pre-wrap">{clientInfo.toAddress}</p>
                </div>
            </div>
            <div className="text-right">
                <h3 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-2">From:</h3>
                <div className="space-y-1 pl-4">
                    <p className="font-semibold">{myInfo.fromName}</p>
                    <p className="whitespace-pre-wrap">{myInfo.fromAddress}</p>
                </div>
            </div>
        </section>

        <section className="mt-10">
            <div className="flex bg-gray-50 rounded-t-md p-2 text-sm font-bold text-gray-700">
                <div className="w-[25%]">Format</div>
                <div className="w-[15%]">Length</div>
                <div className="w-[15%]">Origin</div>
                <div className="w-[10%] text-right">Qty</div>
                <div className="w-[15%] text-right">Price ({finalCurrency})</div>
                <div className="w-[20%] text-right">Total</div>
            </div>
            
            <div className="mt-2 space-y-2 text-sm border-b border-gray-100">
                {items.map(item => (
                    <div key={item.id} className="flex items-center p-2">
                        <div className="w-[25%]">{item.format}</div>
                        <div className="w-[15%]">{item.length}</div>
                        <div className="w-[15%]">{item.origin}</div>
                        <div className="w-[10%] text-right">{item.quantity}</div>
                        <div className="w-[15%] text-right">{formatCurrency(getConvertedValue(item.price), finalCurrency)}</div>
                        <div className="w-[20%] text-right font-semibold">{formatCurrency(getConvertedValue(Number(item.quantity) * Number(item.price)), finalCurrency)}</div>
                    </div>
                ))}
            </div>
        </section>
        
        <section className="flex justify-end mt-4">
             <div className="w-1/2 space-y-2 text-sm">
                    <div className="grid grid-cols-[1fr_auto] items-baseline w-full">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-right">{formatCurrency(getConvertedValue(subtotal), finalCurrency)}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] items-baseline w-full">
                        <span className="text-gray-600">Shipping via {shippingCarrier}</span>
                        <span className="font-semibold text-right">{formatCurrency(getConvertedValue(shippingCost), finalCurrency)}</span>
                    </div>
                    <div className="border-t border-gray-300 mt-2 pt-2 grid grid-cols-2 text-lg font-bold" style={{color: 'hsl(var(--primary))'}}>
                        <span>Grand Total ({finalCurrency})</span>
                        <span className="text-right">{formatCurrency(getConvertedValue(grandTotal), finalCurrency)}</span>
                    </div>
            </div>
        </section>
        
        <div className="flex-grow" style={{ minHeight: '100px' }}></div>

        <footer className="mt-auto pt-8 text-xs border-t border-gray-200 text-gray-500">
            <div className="grid grid-cols-2 gap-8 items-start">
                <div>
                    <h3 className="font-bold uppercase mb-2 text-gray-700 tracking-wider">Payment & Logistics</h3>
                    <div className="space-y-1">
                        <div className="flex items-start">
                            <span className="mr-2 mt-1 leading-none" style={{color: 'hsl(var(--primary))'}}>•</span>
                            <p className="flex-1"><strong>Payment:</strong> 50% advance (Bank Transfer / Wise / PayPal)</p>
                        </div>
                        <div className="flex items-start">
                            <span className="mr-2 mt-1 leading-none" style={{color: 'hsl(var(--primary))'}}>•</span>
                            <p className="flex-1"><strong>Delivery Time:</strong> 3-7 business days after payment confirmation.</p>
                        </div>
                        <div className="flex items-start">
                            <span className="mr-2 mt-1 leading-none" style={{color: 'hsl(var(--primary))'}}>•</span>
                            <p className="flex-1"><strong>Packaging:</strong> Standard polybag (custom branding available on bulk orders).</p>
                        </div>
                    </div>
                </div>
                    <div>
                    <h3 className="font-bold uppercase mb-2 text-gray-700 tracking-wider">Bank/Payment Details:</h3>
                    <div className="whitespace-pre-wrap leading-relaxed">{bankDetails}</div>
                </div>
            </div>
            <p className="mt-8 text-center italic">
                Thank you for considering {myInfo.fromName || '[Your Business Name]'}! Feel free to reach out for samples or bulk pricing.
            </p>
        </footer>
    </div>
  );
}
