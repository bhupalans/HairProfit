'use client';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  subscription: any; // simple for now
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  subscription: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [subscription, setSubscription] = useState<any>(null);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setUser(user);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // ✅ CREATE USER DOC (FIRST TIME LOGIN)
          await setDoc(userRef, {
            email: user.email,
            role: 'user',
            createdAt: new Date().toISOString(),
            subscription: {
              status: 'none'
            }
          });
        
          setSubscription(null);
        } else {
          setSubscription(userSnap.data().subscription || null);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setSubscription(null);
      }
    } else {
      setSubscription(null);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);

  return (
    <AuthContext.Provider value={{ user, loading, subscription }}>
      {children}
    </AuthContext.Provider>
  );
};
