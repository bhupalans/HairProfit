'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserSubscription } from '@/types';

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const checkSubscription = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.data();
        const sub: UserSubscription | undefined = data?.subscription;

        if (!sub || sub.status === 'none') {
          router.push(`/subscribe?from=${encodeURIComponent(pathname)}`);
          return;
        }

        // Check expiry
        if (sub.expiryDate) {
          const expiry = new Date(sub.expiryDate);
          if (new Date() > expiry) {
            // Update to expired in Firestore
            await updateDoc(userRef, { 'subscription.status': 'expired' });
            router.push(`/subscribe?from=${encodeURIComponent(pathname)}`);
            return;
          }
        }

        if (sub.status === 'expired') {
          router.push(`/subscribe?from=${encodeURIComponent(pathname)}`);
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error("Error checking subscription:", error);
        setChecking(false); // Let the page render if there's an error to avoid getting stuck
      }
    };

    checkSubscription();
  }, [user, authLoading, router, pathname]);

  if (authLoading || checking) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Checking subscription access...</p>
      </div>
    );
  }

  return <>{children}</>;
}
