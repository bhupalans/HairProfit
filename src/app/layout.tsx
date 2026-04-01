import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';

export const metadata: Metadata = {
  title: 'HairProfit | Business Software for the Hair Trade',
  description: 'The business software for the hair trade. Calculate profit, create quotes, and analyze market prices for hair extensions, wigs, and bundles.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
