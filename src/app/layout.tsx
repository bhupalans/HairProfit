import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import Footer from '@/components/footer';
import { AuthProvider } from '@/contexts/auth-context';
import Navbar from '@/components/navbar';

export const metadata: Metadata = {
  title: 'HairProfit | Business Software for the Hair Trade',
  description: 'The business software for the hair trade. Calculate profit, create quotes, and analyze market prices for hair extensions, wigs, and bundles.',
  keywords: ['hair business software', 'hair extensions pricing', 'wig profit calculator', 'hair bundle quotes', 'hair trade software', 'hair supplier tools', 'salon inventory pricing'],
  authors: [{ name: 'HairProfit Team' }],
  openGraph: {
    title: 'HairProfit | Business Software for the Hair Trade',
    description: 'The business software for the hair trade. Calculate profit, create quotes, and analyze market prices for hair extensions, wigs, and bundles.',
    url: 'https://hairprofit.app',
    siteName: 'HairProfit',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HairProfit | Business Software for the Hair Trade',
    description: 'The business software for the hair trade. Calculate profit, create quotes, and analyze market prices for hair extensions, wigs, and bundles.',
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
        <AuthProvider>
          <Navbar />
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
