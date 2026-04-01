import InvoiceForm from "@/components/invoice-form";
import AuthGuard from "@/components/auth-guard";

export default function InvoicePage() {
  return (
    <AuthGuard>
      <main>
        <InvoiceForm />
      </main>
    </AuthGuard>
  );
}
