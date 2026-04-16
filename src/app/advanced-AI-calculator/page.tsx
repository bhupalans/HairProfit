import AdvancedAICalculatorDashboard from '@/components/advanced-AIcalculator-dashboard';
import AuthGuard from '@/components/auth-guard';
import SubscriptionGuard from '@/components/subscription-guard';

export default function AdvancedAICalculatorPage() {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <main>
          <AdvancedAICalculatorDashboard />
        </main>
      </SubscriptionGuard>
    </AuthGuard>
  );
}
