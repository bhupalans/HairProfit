'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, Mail, Fingerprint, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logged out', description: 'See you next time!' });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: error.message,
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="container mx-auto flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const creationDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString() 
    : 'Unknown';

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
      <Card className="overflow-hidden">
        <div className="h-32 bg-primary/10" />
        <CardHeader className="relative pb-0">
          <div className="absolute -top-12 left-6">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={user.photoURL || ''} />
              <AvatarFallback className="bg-muted text-2xl">
                {user.email?.charAt(0).toUpperCase() || <UserIcon />}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="pt-12">
            <CardTitle className="text-3xl font-bold">{user.displayName || 'User Profile'}</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-semibold">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Fingerprint className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">UID</p>
                <p className="font-mono text-xs">{user.uid}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p className="font-semibold">{creationDate}</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout from HairProfit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
