import InvoiceForm from "@/components/invoice-form";
import AuthGuard from "@/components/auth-guard";
import SubscriptionGuard from "@/components/subscription-guard";

export default function InvoicePage() {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <main>
          <InvoiceForm />
        </main>
      </SubscriptionGuard>
    </AuthGuard>
  );
}
