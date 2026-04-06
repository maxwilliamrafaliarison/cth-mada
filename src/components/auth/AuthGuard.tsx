'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase';

const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Vérifier chaque minute

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const supabase = createBrowserSupabaseClient();

  const checkSession = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setAuthenticated(false);
      setChecking(false);
      router.push('/login');
      return false;
    }

    setAuthenticated(true);
    setChecking(false);
    return true;
  }, [supabase, router]);

  useEffect(() => {
    // Vérification initiale
    checkSession();

    // Écouter les changements de session Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setAuthenticated(false);
        router.push('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setAuthenticated(true);
      }
    });

    // Vérification périodique
    const interval = setInterval(() => {
      checkSession();
    }, ACTIVITY_CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkSession, supabase, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e8eef5]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
