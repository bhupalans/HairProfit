'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { UserSubscription } from '@/types';

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, subscription } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.email === 'admin@hairprofit.com') {
      setChecking(false);
      return;
    }

    const isActive =
      subscription?.status === 'active' &&
      subscription?.expiryDate &&
      new Date(subscription.expiryDate) > new Date();

if (!subscription) {
  router.push(`/subscribe?from=${encodeURIComponent(pathname)}`);
  return;
}

    if (!isActive) {
      router.push(`/subscribe?from=${encodeURIComponent(pathname)}`);
    }

  }, [user, authLoading, router, pathname]);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Checking subscription access...</p>
      </div>
    );
  }

  return <>{children}</>;
}
