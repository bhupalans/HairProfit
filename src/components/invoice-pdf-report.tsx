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
    try {
        const safeCurrency = currency && currency.length >= 3 ? currency : 'USD';
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: safeCurrency 
        }).format(isNaN(value) ? 0 : value);
    } catch (e) {
        return `${currency || '$'} ${value.toFixed(2)}`;
    }
};

export default function InvoicePdfReport({
    data, subtotal, discountAmount, taxAmount, total, balanceDue
}: InvoicePdfReportProps) {
  
  if (!data) return null;

  const { 
    logo = null, 
    invoiceRef = '', 
    invoiceDate = '', 
    dueDate = '', 
    clientInfo = { toName: '', toAddress: '' }, 
    myInfo = { fromName: '', fromAddress: '' }, 
    productFormat = '-', 
    productOrigin = '-', 
    productCategory = '-',
    items = [], 
    currency = 'USD', 
    shippingCost = 0, 
    amountPaid = 0, 
    notes = '', 
    terms = '',
    discount = 0, 
    tax = 0
  } = data;
    
  return (
    <div className="bg-white text-black p-12 font-sans overflow-hidden" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
        <header className="flex justify-between items-start pb-8 border-b border-gray-200">
            <div className="w-1/3">
                {logo && <img src={logo} alt="Business Logo" className="max-h-20 max-w-full object-contain" />}
            </div>

            <div className="text-right space-y-2">
                <h2 className="text-4xl font-bold uppercase" style={{color: 'hsl(47, 100%, 50%)'}}>INVOICE</h2>
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

        <section className="grid grid-cols-2 mt-8 text-sm gap-8">
            <div>
                <h3 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-2">Bill To:</h3>
                <div className="space-y-1 pr-4">
                    <p className="font-semibold text-base">{clientInfo.toName || 'N/A'}</p>
                    <p className="whitespace-pre-wrap text-gray-600">{clientInfo.toAddress || ''}</p>
                </div>
            </div>
            <div className="text-right">
                <h3 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-2">From:</h3>
                <div className="space-y-1 pl-4">
                    <p className="font-semibold text-base">{myInfo.fromName || 'N/A'}</p>
                    <p className="whitespace-pre-wrap text-gray-600">{myInfo.fromAddress || ''}</p>
                </div>
            </div>
        </section>

        <section className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex gap-8">
                <div className="flex-1">
                    <h3 className="font-bold uppercase text-[10px] tracking-wider text-gray-400 mb-1">Product Category</h3>
                    <p className="font-semibold text-gray-800 text-sm">{productCategory}</p>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold uppercase text-[10px] tracking-wider text-gray-400 mb-1">Product Format</h3>
                    <p className="font-semibold text-gray-800 text-sm">{productFormat}</p>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold uppercase text-[10px] tracking-wider text-gray-400 mb-1">Product Origin</h3>
                    <p className="font-semibold text-gray-800 text-sm">{productOrigin}</p>
                </div>
            </div>
        </section>

        <section className="mt-8">
            <div className="flex bg-gray-50 rounded-t-md p-3 text-sm font-bold text-gray-700 border-b border-gray-200">
                <div style={{ width: '50%' }}>Description</div>
                <div style={{ width: '15%' }} className="text-right">Qty</div>
                <div style={{ width: '15%' }} className="text-right">Price</div>
                <div style={{ width: '20%' }} className="text-right">Total</div>
            </div>
            
            <div className="space-y-0 text-sm border-b border-gray-100">
                {items.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center p-3 border-b border-gray-50 last:border-0">
                        <div style={{ width: '50%' }}>{item.description || 'Item'}</div>
                        <div style={{ width: '15%' }} className="text-right">{Number(item.quantity) || 0}</div>
                        <div style={{ width: '15%' }} className="text-right">{formatCurrency(Number(item.price) || 0, currency)}</div>
                        <div style={{ width: '20%' }} className="text-right font-semibold">{formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0), currency)}</div>
                    </div>
                ))}
            </div>
        </section>
        
        <section className="flex justify-end mt-6">
             <div className="w-1/2 space-y-2 text-sm">
                    <div className="flex justify-between items-baseline"><span className="text-gray-500">Subtotal</span><span className="font-semibold text-right">{formatCurrency(subtotal, currency)}</span></div>
                    {Number(discount) > 0 && <div className="flex justify-between items-baseline"><span className="text-gray-500">Discount ({discount}%)</span><span className="font-semibold text-right">- {formatCurrency(discountAmount, currency)}</span></div>}
                    {Number(tax) > 0 && <div className="flex justify-between items-baseline"><span className="text-gray-500">Tax ({tax}%)</span><span className="font-semibold text-right">+ {formatCurrency(taxAmount, currency)}</span></div>}
                    {Number(shippingCost) > 0 && <div className="flex justify-between items-baseline"><span className="text-gray-500">Shipping</span><span className="font-semibold text-right">+ {formatCurrency(Number(shippingCost), currency)}</span></div>}
                    <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between text-base font-bold"><span>Total</span><span className="text-right">{formatCurrency(total, currency)}</span></div>
                    {Number(amountPaid) > 0 && <div className="flex justify-between items-baseline"><span className="text-gray-500 font-medium italic">Amount Paid</span><span className="font-semibold text-right">- {formatCurrency(Number(amountPaid), currency)}</span></div>}
                    <div className="mt-2 pt-2 flex justify-between text-lg font-bold border-t-2 border-gray-800" style={{color: 'hsl(47, 100%, 50%)'}}><span>Balance Due</span><span className="text-right">{formatCurrency(balanceDue, currency)}</span></div>
            </div>
        </section>
        
        <div className="flex-grow" style={{ minHeight: '100px' }}></div>

        <footer className="mt-auto pt-8 text-xs border-t border-gray-200 text-gray-500">
            <div className="grid grid-cols-2 gap-8 items-start">
                <div>
                    <h3 className="font-bold uppercase mb-2 text-gray-700 tracking-wider">Notes</h3>
                    <div className="whitespace-pre-wrap leading-relaxed">{notes || 'Thank you for your business!'}</div>
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