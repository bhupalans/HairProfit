import AccountClient from './account-client';
import AuthGuard from '@/components/auth-guard';

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountClient />
    </AuthGuard>
  );
}
