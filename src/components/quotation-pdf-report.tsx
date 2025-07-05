'use client';

import type { QuotationItem } from '@/types';

interface QuotationPdfReportProps {
  logo: string | null;
  quotationRef: string;
  date: string;
  validUntil: string;
  clientInfo: { toName: string; toContact: string; };
  myInfo: { fromName: string; fromContact: string; };
  items: QuotationItem[];
  shippingCost: number | string;
  shippingCarrier: string;
  bankDetails: string;
  subtotal: number;
  grandTotal: number;
}

const formatCurrency = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export default function QuotationPdfReport({
    logo,
    quotationRef,
    date,
    validUntil,
    clientInfo,
    myInfo,
    items,
    shippingCost,
    shippingCarrier,
    bankDetails,
    subtotal,
    grandTotal,
}: QuotationPdfReportProps) {
  return (
    <div className="bg-white text-black p-12 font-sans" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
        <header className="flex justify-between items-start pb-8 border-b border-gray-200">
            <div className="w-1/3">
                {logo && <img src={logo} alt="Business Logo" className="max-h-20 max-w-full object-contain" />}
            </div>

            <div className="text-right space-y-2">
                <h2 className="text-4xl font-bold uppercase" style={{color: 'hsl(var(--primary))'}}>QUOTATION</h2>
                <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 text-sm">
                    <span className="font-semibold text-gray-600">Ref:</span>
                    <span>{quotationRef}</span>
                
                    <span className="font-semibold text-gray-600">Date:</span>
                    <span>{date}</span>
                
                    <span className="font-semibold text-gray-600">Valid Until:</span>
                    <span>{validUntil}</span>
                </div>
            </div>
        </header>

        <section className="grid grid-cols-2 mt-8 text-sm">
            <div>
                <h3 className="font-semibold text-gray-500">To:</h3>
                <div className="mt-2 space-y-1">
                    <p>{clientInfo.toName}</p>
                    <p>{clientInfo.toContact}</p>
                </div>
            </div>
            <div className="text-right">
                <h3 className="font-semibold text-gray-500">From:</h3>
                    <div className="mt-2 space-y-1">
                    <p>{myInfo.fromName}</p>
                    <p>{myInfo.fromContact}</p>
                </div>
            </div>
        </section>

        <section className="mt-10">
            {/* Table Header */}
            <div className="flex bg-gray-50 rounded-md p-2 text-xs font-semibold text-gray-600">
                <div className="w-[25%]">Format</div>
                <div className="w-[15%]">Length</div>
                <div className="w-[15%]">Origin</div>
                <div className="w-[10%] text-right">Qty</div>
                <div className="w-[15%] text-right">Price (USD)</div>
                <div className="w-[20%] text-right">Total</div>
            </div>
            
            {/* Table Body */}
            <div className="mt-2 space-y-2 text-sm">
                {items.map(item => (
                    <div key={item.id} className="flex items-center p-2 border-b border-gray-100">
                        <div className="w-[25%]">{item.format}</div>
                        <div className="w-[15%]">{item.length}</div>
                        <div className="w-[15%]">{item.origin}</div>
                        <div className="w-[10%] text-right">{item.quantity}</div>
                        <div className="w-[15%] text-right">{formatCurrency(Number(item.price) || 0)}</div>
                        <div className="w-[20%] text-right font-semibold">{formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0))}</div>
                    </div>
                ))}
            </div>
        </section>
        
        <section className="flex justify-end mt-8">
            <div className="w-1/2 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping via {shippingCarrier}</span>
                    <span className="font-semibold">{formatCurrency(Number(shippingCost) || 0)}</span>
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center text-lg font-bold" style={{color: 'hsl(var(--primary))'}}>
                    <span>Grand Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
                    </div>
            </div>
        </section>
        
        <div className="flex-grow" style={{ minHeight: '100px' }}></div>

        <footer className="mt-auto pt-8 text-xs border-t border-gray-200 text-gray-500">
            <div className="grid grid-cols-2 gap-8 items-start">
                <div>
                    <h3 className="font-semibold mb-2 text-gray-700">Payment & Logistics</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>Payment:</strong> 50% advance (Bank Transfer / Wise / PayPal)</li>
                        <li><strong>Delivery Time:</strong> 3-7 business days after payment confirmation.</li>
                        <li><strong>Packaging:</strong> Standard polybag (custom branding available on bulk orders).</li>
                    </ul>
                </div>
                    <div>
                    <h3 className="font-semibold mb-2 text-gray-700">Bank/Payment Details:</h3>
                    <div className="whitespace-pre-wrap">{bankDetails}</div>
                </div>
            </div>
            <p className="mt-8 text-center italic">
                Thank you for considering {myInfo.fromName || '[Your Business Name]'}! Feel free to reach out for samples or bulk pricing.
            </p>
        </footer>
    </div>
  );
}
