import HairMarketplace from '@/components/hair-marketplace';
import AuthGuard from '@/components/auth-guard';
import SubscriptionGuard from '@/components/subscription-guard';

export default function MarketplacePage() {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <main>
          <HairMarketplace />
        </main>
      </SubscriptionGuard>
    </AuthGuard>
  );
}
