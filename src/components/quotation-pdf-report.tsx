'use client';

import type { QuotationData } from '@/types';

interface QuotationPdfReportProps {
  data: QuotationData;
  subtotal: number;
  grandTotal: number;
  convertedGrandTotal: number;
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

export default function QuotationPdfReport({
    data,
    subtotal = 0,
    grandTotal = 0,
}: QuotationPdfReportProps) {
  
  if (!data) return null;

  const { 
    logo = null, 
    quotationRef = '', 
    date = '', 
    validUntil = '', 
    clientInfo = { toName: '', toAddress: '' }, 
    myInfo = { fromName: '', fromAddress: '' }, 
    productFormat = '-', 
    productOrigin = '-', 
    productCategory = '-',
    items = [], 
    currency = 'USD', 
    shippingCost = 0, 
    shippingCarrier = '-', 
    paymentDetails = '', 
    termsAndConditions = '', 
    displayCurrency = '', 
    exchangeRate = 1
  } = data;
    
  const finalCurrency = displayCurrency || currency || 'USD';
  const performConversion = currency !== finalCurrency && !!finalCurrency;
  const conversionRate = performConversion ? (Number(exchangeRate) || 1) : 1;

  const getConvertedValue = (value: number | string) => {
    const numericValue = Number(value) || 0;
    if (performConversion && conversionRate !== 0) {
      // The rate is defined as "1 Display Currency = X Pricing Currency".
      // To convert a value from Pricing to Display, we divide by the rate.
      return numericValue / conversionRate;
    }
    return numericValue;
  };

  return (
    <div className="bg-white text-black p-12 font-sans overflow-hidden" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
        <header className="flex justify-between items-start pb-8 border-b border-gray-200">
            <div className="w-1/3">
                {logo && <img src={logo} alt="Business Logo" className="max-h-20 max-w-full object-contain" />}
            </div>

            <div className="text-right space-y-2">
                <h2 className="text-4xl font-bold uppercase" style={{color: 'hsl(47, 100%, 50%)'}}>QUOTATION</h2>
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

        <section className="grid grid-cols-2 mt-8 text-sm gap-8">
            <div>
                <h3 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-2">To:</h3>
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

        <section className="mt-8 mb-4 border-t border-gray-100 pt-6">
            <div className="flex gap-8">
                <div className="flex-1">
                    <h3 className="font-bold uppercase text-[10px] tracking-wider text-gray-400 mb-1">Category</h3>
                    <p className="font-semibold text-gray-800">{productCategory}</p>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold uppercase text-[10px] tracking-wider text-gray-400 mb-1">Format</h3>
                    <p className="font-semibold text-gray-800">{productFormat}</p>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold uppercase text-[10px] tracking-wider text-gray-400 mb-1">Origin</h3>
                    <p className="font-semibold text-gray-800">{productOrigin}</p>
                </div>
            </div>
        </section>

        <section className="mt-6">
            <div className="flex bg-gray-50 rounded-t-md p-3 text-sm font-bold text-gray-700 border-b border-gray-200">
                <div style={{ width: '50%' }}>Length / Description</div>
                <div style={{ width: '15%' }} className="text-right">Qty</div>
                <div style={{ width: '15%' }} className="text-right">Price ({finalCurrency})</div>
                <div style={{ width: '20%' }} className="text-right">Total</div>
            </div>
            
            <div className="space-y-0 text-sm border-b border-gray-100">
                {items.length > 0 ? items.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center p-3 border-b border-gray-50 last:border-0">
                        <div style={{ width: '50%' }}>{item.length || 'Item'}</div>
                        <div style={{ width: '15%' }} className="text-right">{Number(item.quantity) || 0}</div>
                        <div style={{ width: '15%' }} className="text-right">{formatCurrency(getConvertedValue(item.price), finalCurrency)}</div>
                        <div style={{ width: '20%' }} className="text-right font-semibold">{formatCurrency(getConvertedValue((Number(item.quantity) || 0) * (Number(item.price) || 0)), finalCurrency)}</div>
                    </div>
                )) : (
                    <div className="p-4 text-center text-gray-400">No items listed.</div>
                )}
            </div>
        </section>
        
        <section className="flex justify-end mt-6">
             <div className="w-1/2 space-y-2 text-sm">
                    <div className="flex justify-between items-baseline w-full">
                        <span className="text-gray-500 font-medium">Subtotal</span>
                        <span className="font-semibold text-right">{formatCurrency(getConvertedValue(subtotal), finalCurrency)}</span>
                    </div>
                    <div className="flex justify-between items-baseline w-full">
                        <span className="text-gray-500 font-medium">Shipping ({shippingCarrier})</span>
                        <span className="font-semibold text-right">{formatCurrency(getConvertedValue(shippingCost), finalCurrency)}</span>
                    </div>
                    <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between text-lg font-bold" style={{color: 'hsl(47, 100%, 50%)'}}>
                        <span>Grand Total ({finalCurrency})</span>
                        <span className="text-right">{formatCurrency(getConvertedValue(grandTotal), finalCurrency)}</span>
                    </div>
            </div>
        </section>
        
        <div className="flex-grow" style={{ minHeight: '100px' }}></div>

        <footer className="mt-auto pt-8 text-xs border-t border-gray-200 text-gray-500">
            <div className="grid grid-cols-2 gap-8 items-start">
                <div>
                    <h3 className="font-bold uppercase mb-2 text-gray-700 tracking-wider">Terms &amp; Conditions</h3>
                    <div className="whitespace-pre-wrap leading-relaxed">{termsAndConditions}</div>
                </div>
                    <div>
                    <h3 className="font-bold uppercase mb-2 text-gray-700 tracking-wider">Payment Details</h3>
                    <div className="whitespace-pre-wrap leading-relaxed">{paymentDetails}</div>
                </div>
            </div>
            <p className="mt-12 text-center italic text-gray-400">
                Thank you for considering {myInfo.fromName || 'our business'}! Feel free to reach out for samples or bulk pricing.
            </p>
        </footer>
    </div>
  );
}