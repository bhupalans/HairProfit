import HairMarketplace from '@/components/hair-marketplace';
import AuthGuard from '@/components/auth-guard';

export default function MarketplacePage() {
  return (
    <AuthGuard>
      <main>
        <HairMarketplace />
      </main>
    </AuthGuard>
  );
}
