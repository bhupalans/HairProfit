import ReverseCalculatorDashboard from '@/components/reverse-calculator-dashboard';
import AuthGuard from '@/components/auth-guard';
import SubscriptionGuard from '@/components/subscription-guard';

export default function ReverseCalculatorPage() {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <main>
          <ReverseCalculatorDashboard />
        </main>
      </SubscriptionGuard>
    </AuthGuard>
  );
}
