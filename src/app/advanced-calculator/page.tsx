import AdvancedCalculatorDashboard from '@/components/advanced-calculator-dashboard';
import AuthGuard from '@/components/auth-guard';

export default function AdvancedCalculatorPage() {
  return (
    <AuthGuard>
      <main>
        <AdvancedCalculatorDashboard />
      </main>
    </AuthGuard>
  );
}
