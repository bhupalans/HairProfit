
'use client';

import { useState, useEffect } from 'react';
import type { HairProfitData, NonRemyHairProduct } from '@/types';

type ProcessedProduct = NonRemyHairProduct & { calculatedPrice?: number };

interface PDFReportProps {
  data: HairProfitData;
  summary: {
    totalPurchaseCost: number;
    totalProcessingCost: number;
    totalWastageCost: number;
    totalByproductProcessingCost: number;
    grandTotalCost: number;
    totalRevenue: number;
    projectedProfit: number;
    profitMargin: number;
    unitsRemaining: number;
    processedNonRemyProducts?: ProcessedProduct[];
  };
}

const PDFReport = ({ data, summary }: PDFReportProps) => {
    const [generatedDate, setGeneratedDate] = useState('');

    useEffect(() => {
        setGeneratedDate(new Date().toLocaleDateString());
    }, []);

    const formatCurrency = (value: number) => {
        if (isNaN(value)) value = 0;
        return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: data.currency || 'USD',
        }).format(value);
    };

    const productsToRender = summary.processedNonRemyProducts || data.nonRemyHairProducts;

  return (
    <div className="bg-white text-black p-8 font-sans" style={{ width: '210mm', minHeight: '297mm' }}>
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-4xl font-bold text-gray-800">Profitability Report</h1>
        <div className="text-right">
          <p className="text-gray-600">Generated on:</p>
          <p className="font-medium">{generatedDate}</p>
        </div>
      </header>
      
      <main>
        <section className="mb-6">
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Purchase Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><strong>Hair Type:</strong> {data.hairType}</div>
            <div><strong>Purchase Quantity:</strong> {Number(data.purchaseQuantity) || 0} units</div>
            <div><strong>Purchase Price:</strong> {formatCurrency(Number(data.purchasePrice) || 0)} / unit</div>
            <div><strong>Total Purchase Cost:</strong> {formatCurrency(summary.totalPurchaseCost)}</div>
          </div>
        </section>

        {data.processingSteps.length > 0 && (
          <section className="mb-6">
            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Processing Steps</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Process Name</th>
                  <th className="py-2">Expense</th>
                  <th className="py-2">Wastage (units)</th>
                </tr>
              </thead>
              <tbody>
                {data.processingSteps.map(step => (
                  <tr key={step.id} className="border-b">
                    <td className="py-2">{step.name}</td>
                    <td className="py-2">{formatCurrency(Number(step.cost) || 0)}</td>
                    <td className="py-2">{Number(step.wastage) || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="mb-6">
            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Sales Strategy</h2>
            {data.enableByproductProcessing ? (
                <div>
                    <p className="mb-4"><strong>Strategy:</strong> Byproduct Processing</p>
                    <h3 className="text-xl font-medium mb-2">{data.byproductName + " Products"}</h3>
                    {(productsToRender && productsToRender.length > 0) ? (
                      <table className="w-full text-left">
                          <thead>
                              <tr className="border-b">
                              <th className="py-2">Size (in)</th>
                              <th className="py-2">Quantity (units)</th>
                              <th className="py-2">Price/unit</th>
                              <th className="py-2">Total Price</th>
                              </tr>
                          </thead>
                          <tbody>
                              {productsToRender?.map(product => {
                                const price = product.calculatedPrice ?? Number(product.price) ?? 0;
                                const quantity = Number(product.quantity) || 0;
                                return (
                                  <tr key={product.id} className="border-b">
                                      <td className="py-2">{product.size}</td>
                                      <td className="py-2">{quantity}</td>
                                      <td className="py-2">{formatCurrency(price)}</td>
                                      <td className="py-2">{formatCurrency(price * quantity)}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                      </table>
                    ) : (
                      <p>No byproduct products defined.</p>
                    )}
                </div>
            ) : (
                <div>
                    <p className="mb-4"><strong>Strategy:</strong> Sell Primary Product</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div><strong>Selling Price:</strong> {formatCurrency(Number(data.sellingPricePerUnit) || 0)} / unit</div>
                        <div><strong>Units Available to Sell:</strong> {summary.unitsRemaining.toFixed(0)}</div>
                    </div>
                </div>
            )}
        </section>


        <section className="mt-8 pt-6 border-t-2 border-gray-800">
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Financial Summary</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-lg">
                <span className="text-gray-700">Total Purchase Cost:</span>
                <span className="font-medium text-right">{formatCurrency(summary.totalPurchaseCost)}</span>
                
                <span className="text-gray-700">Total Processing Cost:</span>
                <span className="font-medium text-right">{formatCurrency(summary.totalProcessingCost)}</span>
                
                {data.enableByproductProcessing && (
                    <>
                        <span className="text-gray-700">Byproduct Processing Cost:</span>
                        <span className="font-medium text-right">{formatCurrency(summary.totalByproductProcessingCost)}</span>
                    </>
                )}

                <span className="text-red-600">Total Wastage Cost:</span>
                <span className="font-medium text-red-600 text-right">({formatCurrency(summary.totalWastageCost)})</span>

                <span className="font-bold text-xl mt-4">Grand Total Cost:</span>
                <span className="font-bold text-xl text-right mt-4">{formatCurrency(summary.grandTotalCost)}</span>

                <span className="text-green-600 font-bold text-xl">Total Revenue:</span>
                <span className="font-bold text-green-600 text-xl text-right">{formatCurrency(summary.totalRevenue)}</span>

                <span className="font-bold text-2xl mt-4 border-t pt-4">Projected Profit:</span>
                <span className={`font-bold text-2xl text-right mt-4 border-t pt-4 ${summary.projectedProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(summary.projectedProfit)}
                </span>
                
                <span className="font-bold text-2xl">Profit Margin:</span>
                 <span className={`font-bold text-2xl text-right ${summary.profitMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {summary.profitMargin.toFixed(2)}%
                </span>
            </div>
        </section>
      </main>

      <footer className="text-center text-xs text-gray-500 mt-12 pt-4 border-t">
        <p>HairProfit | Profitability Report</p>
      </footer>
    </div>
  );
};

export default PDFReport;
