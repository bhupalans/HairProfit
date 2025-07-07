import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

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
    images: [
      {
        url: 'https://placehold.co/1200x630.png',
        width: 1200,
        height: 630,
        alt: 'HairProfit Dashboard showing profitability charts and tools.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HairProfit | All-in-One Toolkit for the Hair Industry',
    description: 'Manage costs, analyze markets, create quotations, and streamline sales with HairProfit.',
    images: ['https://placehold.co/1200x630.png'],
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
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
