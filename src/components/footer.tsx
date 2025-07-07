import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">HairProfit</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HairProfit. All Rights Reserved.
          </p>
        </div>
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors">
            Help & Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
