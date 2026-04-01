import PriceQuotationForm from "@/components/price-quotation-form";
import AuthGuard from "@/components/auth-guard";

export default function PriceQuotationPage() {
  return (
    <AuthGuard>
      <PriceQuotationForm />
    </AuthGuard>
  );
}
