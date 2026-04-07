
import AdvancedAICalculatorDashboard from '@/components/advanced-AIcalculator-dashboard';
import AuthGuard from '@/components/auth-guard';

export default function AdvancedAICalculatorPage() {
  return (
    <AuthGuard>
      <main>
        <AdvancedAICalculatorDashboard />
      </main>
    </AuthGuard>
  );
}
