import HairProfitDashboard from '@/components/hair-profit-dashboard';
import AuthGuard from '@/components/auth-guard';

export default function ProfitCalculatorPage() {
  return (
    <AuthGuard>
      <main>
        <HairProfitDashboard />
      </main>
    </AuthGuard>
  );
}
