'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    aria-hidden="true"
    focusable="false"
    data-prefix="fab"
    data-icon="google"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 488 512"
  >
    <path
      fill="currentColor"
      d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
    ></path>
  </svg>
);

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Handle dynamic redirect destination
  let redirect = "/";
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    redirect = params.get("redirect") || "/";
  }

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  }, [password]);

  const strengthLabel = useMemo(() => {
    if (passwordStrength <= 25) return { text: 'Weak', color: 'text-red-500', bar: 'bg-red-500' };
    if (passwordStrength <= 50) return { text: 'Fair', color: 'text-orange-500', bar: 'bg-orange-500' };
    if (passwordStrength <= 75) return { text: 'Good', color: 'text-blue-500', bar: 'bg-blue-500' };
    return { text: 'Strong', color: 'text-green-500', bar: 'bg-green-500' };
  }, [passwordStrength]);

  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email signup attempt started for:", email);
    
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (passwordStrength < 50) {
      alert("Password is too weak. Please include numbers and symbols.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Auth user created:", user.uid);

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        uid: user.uid,
        createdAt: new Date().toISOString(),
      });
      console.log("Firestore profile created successfully");

      toast({ title: 'Account created!', description: 'Your profile has been set up.' });
      router.push(redirect);
    } catch (error: any) {
      console.error("Signup error:", error);
      alert("Signup Error: " + error.message);
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    console.log("Google signup popup started");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Google signup success:", user.uid);

      // Check/Create firestore doc
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        uid: user.uid,
        displayName: user.displayName,
        createdAt: new Date().toISOString(),
      }, { merge: true });

      toast({ title: 'Welcome!', description: 'Signed up with Google.' });
      router.push(redirect);
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      alert("Google Auth Error: " + error.message);
      toast({
        variant: 'destructive',
        title: 'Google Auth Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Join the HairProfit community today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Strength: <span className={strengthLabel.color}>{strengthLabel.text}</span></span>
                    <span>{passwordStrength}%</span>
                  </div>
                  <Progress value={passwordStrength} className="h-1" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={cn(
                    confirmPassword && !passwordsMatch && "border-red-500 focus-visible:ring-red-500",
                    passwordsMatch && "border-green-500 focus-visible:ring-green-500"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {confirmPassword && (
                    passwordsMatch ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up with Email
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Sign Up with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
