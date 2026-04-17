'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Sparkles, User as UserIcon, CreditCard } from 'lucide-react';
import { differenceInDays } from 'date-fns';

function getExpiryThreshold(plan: string): number {
  if (plan === 'monthly') return 5;
  if (plan === 'quarterly') return 14;
  if (plan === 'yearly') return 21;
  return 5;
}

export default function Navbar() {
  const { user, subscription } = useAuth();

  let showWarning = false;

  if (user) {
    if (!subscription || subscription.status === 'none') {
      showWarning = true;
    } else {
      const expiry = new Date(subscription.expiryDate);
      const daysRemaining = differenceInDays(expiry, new Date());
      const threshold = getExpiryThreshold(subscription.plan || 'monthly');

      if (
        subscription.status !== 'active' ||
        expiry < new Date() ||
        daysRemaining <= threshold
      ) {
        showWarning = true;
      }
    }
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">HairProfit</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <Button asChild variant="ghost" className="flex items-center gap-2 relative px-2 sm:px-4">
                <Link href="/account">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Account</span>
                  {showWarning && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 animate-pulse border-2 border-background" />
                  )}
                </Link>
              </Button>
              <Button asChild variant="ghost" className="flex items-center gap-2 px-2 sm:px-4">
                <Link href="/profile">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
