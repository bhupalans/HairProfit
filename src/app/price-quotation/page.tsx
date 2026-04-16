import PriceQuotationForm from "@/components/price-quotation-form";
import AuthGuard from "@/components/auth-guard";
import SubscriptionGuard from "@/components/subscription-guard";

export default function PriceQuotationPage() {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <PriceQuotationForm />
      </SubscriptionGuard>
    </AuthGuard>
  );
}
