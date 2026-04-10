
'use client';

import type { InvoiceData } from '@/types';

interface InvoicePdfReportProps {
  data: InvoiceData;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  balanceDue: number;
}

const formatCurrency = (value: number, currency: string) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
};

export default function InvoicePdfReport({
    data, subtotal, discountAmount, taxAmount, total, balanceDue
}: InvoicePdfReportProps) {
  
  const { 
    logo, invoiceRef, invoiceDate, dueDate, clientInfo, myInfo, 
    productFormat, productOrigin,
    items, currency, shippingCost, amountPaid, notes, terms,
    discount, tax
  } = data;
    
  return (
    <div className="bg-white text-black p-12 font-sans" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
        <header className="flex justify-between items-start pb-8 border-b border-gray-200">
            <div className="w-1/3">
                {logo && <img src={logo} alt="Business Logo" className="max-h-20 max-w-full object-contain" />}
            </div>

            <div className="text-right space-y-2">
                <h2 className="text-4xl font-bold uppercase" style={{color: 'hsl(var(--primary))'}}>INVOICE</h2>
                <div className="inline-grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 text-sm text-right">
                    <span className="font-bold text-gray-700">Invoice #:</span>
                    <span className="text-left">{invoiceRef}</span>
                    <span className="font-bold text-gray-700">Date:</span>
                    <span className="text-left">{invoiceDate}</span>
                    <span className="font-bold text-gray-700">Due Date:</span>
                    <span className="text-left">{dueDate}</span>
                </div>
            </div>
        </header>

        <section className="grid grid-cols-2 mt-8 text-sm">
            <div>
                <h3 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-2">Bill To:</h3>
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

        <section className="grid grid-cols-2 mt-8 text-sm border-t border-gray-100 pt-4">
            <div>
                <h3 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-1">Product Format:</h3>
                <p className="font-semibold text-gray-700">{productFormat || "-"}</p>
            </div>
            <div className="text-right">
                <h3 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-1">Product Origin:</h3>
                <p className="font-semibold text-gray-700">{productOrigin || "-"}</p>
            </div>
        </section>

        <section className="mt-10">
            <div className="flex bg-gray-50 rounded-t-md p-2 text-sm font-bold text-gray-700">
                <div className="flex-1">Description</div>
                <div className="w-20 text-right">Qty</div>
                <div className="w-24 text-right">Price</div>
                <div className="w-28 text-right">Total</div>
            </div>
            
            <div className="mt-2 space-y-2 text-sm border-b border-gray-100">
                {items.map(item => (
                    <div key={item.id} className="flex items-center p-2">
                        <div className="flex-1">{item.description}</div>
                        <div className="w-20 text-right">{Number(item.quantity) || 0}</div>
                        <div className="w-24 text-right">{formatCurrency(Number(item.price) || 0, currency)}</div>
                        <div className="w-28 text-right font-semibold">{formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0), currency)}</div>
                    </div>
                ))}
            </div>
        </section>
        
        <section className="flex justify-end mt-4">
             <div className="w-2/5 space-y-2 text-sm">
                    <div className="grid grid-cols-2 items-baseline"><span className="text-gray-600">Subtotal</span><span className="font-semibold text-right">{formatCurrency(subtotal, currency)}</span></div>
                    {Number(discount) > 0 && <div className="grid grid-cols-2 items-baseline"><span className="text-gray-600">Discount ({discount}%)</span><span className="font-semibold text-right">- {formatCurrency(discountAmount, currency)}</span></div>}
                    {Number(tax) > 0 && <div className="grid grid-cols-2 items-baseline"><span className="text-gray-600">Tax ({tax}%)</span><span className="font-semibold text-right">+ {formatCurrency(taxAmount, currency)}</span></div>}
                    {Number(shippingCost) > 0 && <div className="grid grid-cols-2 items-baseline"><span className="text-gray-600">Shipping</span><span className="font-semibold text-right">+ {formatCurrency(Number(shippingCost) || 0, currency)}</span></div>}
                    <div className="border-t border-gray-300 mt-2 pt-2 grid grid-cols-2 text-base font-bold"><span>Total</span><span className="text-right">{formatCurrency(total, currency)}</span></div>
                    {Number(amountPaid) > 0 && <div className="grid grid-cols-2 items-baseline"><span className="text-gray-600">Amount Paid</span><span className="font-semibold text-right">- {formatCurrency(Number(amountPaid) || 0, currency)}</span></div>}
                    <div className="mt-2 pt-2 grid grid-cols-2 text-lg font-bold border-t-2 border-gray-800" style={{color: 'hsl(var(--primary))'}}><span>Balance Due</span><span className="text-right">{formatCurrency(balanceDue, currency)}</span></div>
            </div>
        </section>
        
        <div className="flex-grow" style={{ minHeight: '100px' }}></div>

        <footer className="mt-auto pt-8 text-xs border-t border-gray-200 text-gray-500">
            <div className="grid grid-cols-2 gap-8 items-start">
                <div>
                    <h3 className="font-bold uppercase mb-2 text-gray-700 tracking-wider">Notes</h3>
                    <div className="whitespace-pre-wrap leading-relaxed">{notes}</div>
                </div>
                <div>
                    <h3 className="font-bold uppercase mb-2 text-gray-700 tracking-wider">Terms</h3>
                    <div className="whitespace-pre-wrap leading-relaxed">{terms}</div>
                </div>
            </div>
        </footer>
    </div>
  );
}
