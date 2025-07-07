import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'HairProfit | All-in-One Toolkit for the Hair Industry',
  description: 'Manage costs, analyze markets, create quotations, and streamline sales with HairProfit. The ultimate profitability and quotation tool for the hair industry.',
  keywords: ['hair industry', 'profit calculator', 'quotation tool', 'invoice builder', 'market analysis', 'hair business', 'salon management', 'hair extensions', 'wigs'],
  authors: [{ name: 'HairProfit Team' }],
  openGraph: {
    title: 'HairProfit | All-in-One Toolkit for the Hair Industry',
    description: 'Manage costs, analyze markets, create quotations, and streamline sales with HairProfit.',
    url: 'https://hairprofit.app',
    siteName: 'HairProfit',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HairProfit | All-in-One Toolkit for the Hair Industry',
    description: 'Manage costs, analyze markets, create quotations, and streamline sales with HairProfit.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
