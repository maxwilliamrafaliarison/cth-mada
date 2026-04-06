'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 heure en ms
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Vérifier chaque minute

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  const logout = useCallback((reason: string = 'manual') => {
    const session = localStorage.getItem('cth_session');
    if (session) {
      const parsed = JSON.parse(session);
      // Log de déconnexion
      const logs = JSON.parse(localStorage.getItem('cth_auth_logs') || '[]');
      logs.push({
        email: parsed.email,
        action: reason === 'timeout' ? 'auto_logout' : 'logout',
        timestamp: new Date().toISOString(),
        reason,
      });
      localStorage.setItem('cth_auth_logs', JSON.stringify(logs));
    }
    localStorage.removeItem('cth_session');
    router.push('/login');
  }, [router]);

  const checkSession = useCallback(() => {
    const sessionStr = localStorage.getItem('cth_session');
    if (!sessionStr) {
      setAuthenticated(false);
      setChecking(false);
      router.push('/login');
      return false;
    }

    const session = JSON.parse(sessionStr);
    const now = Date.now();

    // Vérifier l'expiration de session (1h sans activité)
    if (now > session.expiresAt) {
      logout('timeout');
      return false;
    }

    setAuthenticated(true);
    setChecking(false);
    return true;
  }, [router, logout]);

  // Renouveler le timer d'activité à chaque interaction
  const resetActivityTimer = useCallback(() => {
    const sessionStr = localStorage.getItem('cth_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      session.expiresAt = Date.now() + SESSION_TIMEOUT;
      session.lastActivity = new Date().toISOString();
      localStorage.setItem('cth_session', JSON.stringify(session));
    }
  }, []);

  useEffect(() => {
    // Vérification initiale
    checkSession();

    // Vérification périodique de l'expiration
    const interval = setInterval(() => {
      checkSession();
    }, ACTIVITY_CHECK_INTERVAL);

    // Écouter l'activité utilisateur pour renouveler le timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, resetActivityTimer, { passive: true });
    });

    return () => {
      clearInterval(interval);
      events.forEach(event => {
        window.removeEventListener(event, resetActivityTimer);
      });
    };
  }, [checkSession, resetActivityTimer]);

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
