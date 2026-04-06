'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, Eye, EyeSlash, ShieldCheck, Warning, CheckCircle, SpinnerGap } from '@phosphor-icons/react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sessionReady, setSessionReady] = useState(false);
  const [exchanging, setExchanging] = useState(false);

  // Exchange the PKCE code for a session on mount
  useEffect(() => {
    if (!code) {
      // No code = user might already have a session (e.g. came from callback)
      setSessionReady(true);
      return;
    }

    setExchanging(true);
    const supabase = createBrowserSupabaseClient();
    supabase.auth.exchangeCodeForSession(code)
      .then(({ error: exchangeError }) => {
        if (exchangeError) {
          console.error('Code exchange error:', exchangeError.message);
          // If code is expired or invalid
          if (exchangeError.message.includes('expired') || exchangeError.message.includes('invalid')) {
            setError('Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.');
          } else {
            setError('Erreur de vérification. Veuillez réessayer avec un nouveau lien.');
          }
        }
        setSessionReady(true);
      })
      .catch(() => {
        setError('Erreur de connexion. Veuillez réessayer.');
        setSessionReady(true);
      })
      .finally(() => setExchanging(false));
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });

        if (updateError) {
          if (updateError.message.includes('same')) {
            setError('Le nouveau mot de passe doit être différent de l\'ancien.');
          } else if (updateError.message.includes('session') || updateError.message.includes('logged')) {
            setError('Session expirée. Veuillez demander un nouveau lien de réinitialisation.');
          } else {
            setError(`Erreur: ${updateError.message}`);
          }
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);
      } catch {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  };

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-black/5 p-7">
      {exchanging ? (
        <div className="text-center py-8">
          <SpinnerGap size={40} weight="bold" className="text-[var(--primary)] mx-auto mb-4 animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">Vérification du lien en cours...</p>
        </div>
      ) : success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} weight="duotone" className="text-emerald-500" />
          </div>
          <h3 className="font-bold text-emerald-800 mb-2">Mot de passe mis à jour !</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Votre mot de passe a été changé avec succès. Redirection vers le tableau de bord...
          </p>
        </div>
      ) : error && !sessionReady ? (
        <>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/50 mb-5">
            <Warning size={18} weight="duotone" className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <a href="/login" className="text-sm text-[var(--accent)] hover:underline font-medium block text-center">
            Retour à la connexion
          </a>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Nouveau mot de passe</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            Choisissez un nouveau mot de passe sécurisé (minimum 8 caractères).
          </p>

          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/50 mb-5 animate-fade-in">
              <Warning size={18} weight="duotone" className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Nouveau mot de passe</label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none">
                  <Lock size={18} weight="duotone" className="text-[var(--text-muted)]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 px-4 pl-11 pr-11 text-sm text-[var(--text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeSlash size={18} weight="duotone" /> : <Eye size={18} weight="duotone" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Confirmer le mot de passe</label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none">
                  <Lock size={18} weight="duotone" className="text-[var(--text-muted)]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 px-4 pl-11 text-sm text-[var(--text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending || !password || !confirmPassword}
              className="w-full h-12 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[var(--primary)]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/20"
            >
              {isPending ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <ShieldCheck size={20} weight="duotone" />
                  Mettre à jour le mot de passe
                </>
              )}
            </button>
          </form>

          <a href="/login" className="text-sm text-[var(--accent)] hover:underline font-medium mt-5 block text-center">
            Retour à la connexion
          </a>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4f8] via-[#e8eef5] to-[#dce5f0] p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[var(--secondary)]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-3 shadow-xl ring-4 ring-white/50">
            <Image src="/images/logo-cth.png" alt="Logo CTH Madagascar" width={96} height={96} className="w-full h-full object-cover" priority />
          </div>
          <h1 className="text-2xl font-bold text-[var(--primary)] mt-3">CTH Madagascar</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Réinitialisation du mot de passe</p>
        </div>

        <Suspense fallback={
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-black/5 p-7 text-center py-8">
            <SpinnerGap size={40} weight="bold" className="text-[var(--primary)] mx-auto mb-4 animate-spin" />
            <p className="text-sm text-[var(--text-secondary)]">Chargement...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center text-[0.7rem] text-gray-400 mt-5">
          &copy; 2026 CTH Madagascar
        </p>
      </div>
    </div>
  );
}
