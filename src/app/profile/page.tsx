'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  LogOut, 
  User as UserIcon, 
  Mail, 
  Fingerprint, 
  Calendar, 
  Building2, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BusinessProfile } from '@/types';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessProfile>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.business) {
              setBusinessData(data.business);
            }
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setFetching(false);
        }
      };
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const completion = useMemo(() => {
    let count = 0;
    if (businessData.name) count++;
    if (businessData.description) count++;
    if (businessData.contact?.phone) count++;
    if (businessData.address?.city) count++;
    if (businessData.address?.country) count++;
    return count * 20;
  }, [businessData]);

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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      // Perform client-side update to maintain Authentication context
      await setDoc(userRef, { business: businessData }, { merge: true });
      toast({ title: 'Profile Updated', description: 'Business details saved successfully.' });
    } catch (error: any) {
      console.error("Failed to update business profile", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not save profile details.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || fetching) {
    return (
      <div className="container mx-auto flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const creationDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString() 
    : 'Unknown';

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Banner & Basic Info */}
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
          <div className="pt-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">{user.displayName || 'User Profile'}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="text-xs">
                <p className="font-medium text-muted-foreground">Email</p>
                <p className="font-semibold truncate max-w-[150px]">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Fingerprint className="h-4 w-4 text-muted-foreground" />
              <div className="text-xs">
                <p className="font-medium text-muted-foreground">UID</p>
                <p className="font-mono">{user.uid.substring(0, 8)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-xs">
                <p className="font-medium text-muted-foreground">Member Since</p>
                <p className="font-semibold">{creationDate}</p>
              </div>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-xl border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {completion === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                <span className="font-bold text-sm">
                  Profile {completion}% Complete
                </span>
              </div>
              {completion === 100 ? (
                <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Profile Complete ✅</span>
              ) : (
                <span className="text-xs text-muted-foreground italic">Add your business details to personalize your dashboard</span>
              )}
            </div>
            <Progress value={completion} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Business Info Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-primary" />
                Business Information
              </CardTitle>
              <CardDescription>Details about your hair trade business.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="biz-name" className={cn(!businessData.name && "text-amber-600")}>
                  Business Name {!businessData.name && "*"}
                </Label>
                <Input 
                  id="biz-name" 
                  placeholder="e.g., Premium Hair Exports" 
                  value={businessData.name || ''} 
                  onChange={e => setBusinessData(prev => ({...prev, name: e.target.value}))}
                  className={cn(!businessData.name && "border-amber-200 bg-amber-50/30")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-desc" className={cn(!businessData.description && "text-amber-600")}>
                  Description {!businessData.description && "*"}
                </Label>
                <Textarea 
                  id="biz-desc" 
                  placeholder="What do you specialize in? (e.g., Indian temple hair, wigs, etc.)" 
                  value={businessData.description || ''} 
                  onChange={e => setBusinessData(prev => ({...prev, description: e.target.value}))}
                  className={cn("min-h-[100px]", !businessData.description && "border-amber-200 bg-amber-50/30")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact & Address Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className={cn(!businessData.contact?.phone && "text-amber-600")}>
                    Phone {!businessData.contact?.phone && "*"}
                  </Label>
                  <Input 
                    id="phone" 
                    value={businessData.contact?.phone || ''} 
                    onChange={e => setBusinessData(prev => ({...prev, contact: { ...prev.contact, phone: e.target.value }}))}
                    placeholder="+91..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp (Optional)</Label>
                  <Input 
                    id="whatsapp" 
                    value={businessData.contact?.whatsapp || ''} 
                    onChange={e => setBusinessData(prev => ({...prev, contact: { ...prev.contact, whatsapp: e.target.value }}))}
                    placeholder="+91..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4 text-primary" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addr-line1">Line 1</Label>
                  <Input 
                    id="addr-line1" 
                    value={businessData.address?.line1 || ''} 
                    onChange={e => setBusinessData(prev => ({...prev, address: { ...prev.address, line1: e.target.value }}))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className={cn(!businessData.address?.city && "text-amber-600")}>
                      City {!businessData.address?.city && "*"}
                    </Label>
                    <Input 
                      id="city" 
                      value={businessData.address?.city || ''} 
                      onChange={e => setBusinessData(prev => ({...prev, address: { ...prev.address, city: e.target.value }}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state" 
                      value={businessData.address?.state || ''} 
                      onChange={e => setBusinessData(prev => ({...prev, address: { ...prev.address, state: e.target.value }}))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className={cn(!businessData.address?.country && "text-amber-600")}>
                    Country {!businessData.address?.country && "*"}
                  </Label>
                  <Input 
                    id="country" 
                    value={businessData.address?.country || ''} 
                    onChange={e => setBusinessData(prev => ({...prev, address: { ...prev.address, country: e.target.value }}))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          {/* Tax Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tax Information</CardTitle>
              <CardDescription>Optional for invoices.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="gst">GST Number</Label>
                <Input 
                  id="gst" 
                  value={businessData.tax?.gst || ''} 
                  onChange={e => setBusinessData(prev => ({...prev, tax: { ...prev.tax, gst: e.target.value }}))}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Card */}
          <Card className="border-primary/20 bg-primary/5 sticky top-8">
            <CardHeader>
              <CardTitle className="text-lg">Save Changes</CardTitle>
              <CardDescription>Make sure all mandatory fields (*) are filled for 100% completion.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save Profile</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
