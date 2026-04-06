'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Envelope, Lock, Eye, EyeSlash, ShieldCheck, Warning } from '@phosphor-icons/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulation d'authentification (à remplacer par Supabase Auth)
    await new Promise(r => setTimeout(r, 1000));

    // Demo: accepter les comptes de demo-data
    const validUsers = [
      { email: 'admin@cth-madagascar.mg', password: 'Admin@CTH2026!' },
      { email: 'fety@cth-madagascar.mg', password: 'Medecin@CTH2026!' },
      { email: 'fitahiana@cth-madagascar.mg', password: 'Medecin@CTH2026!' },
      { email: 'pharma@cth-madagascar.mg', password: 'Pharma@CTH2026!' },
    ];

    const user = validUsers.find(u => u.email === email && u.password === password);
    if (user) {
      // Enregistrer le log de connexion
      const loginLog = {
        email: user.email,
        action: 'login',
        timestamp: new Date().toISOString(),
        ip: 'local',
        userAgent: navigator.userAgent,
      };
      const logs = JSON.parse(localStorage.getItem('cth_auth_logs') || '[]');
      logs.push(loginLog);
      localStorage.setItem('cth_auth_logs', JSON.stringify(logs));

      // Sauvegarder la session avec expiration 1h
      const session = {
        email: user.email,
        loginAt: Date.now(),
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 heure
      };
      localStorage.setItem('cth_session', JSON.stringify(session));

      window.location.href = '/dashboard';
    } else {
      setError('Adresse e-mail ou mot de passe incorrect.');
      // Log tentative échouée
      const logs = JSON.parse(localStorage.getItem('cth_auth_logs') || '[]');
      logs.push({ email, action: 'login_failed', timestamp: new Date().toISOString(), ip: 'local' });
      localStorage.setItem('cth_auth_logs', JSON.stringify(logs));
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setForgotSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4f8] via-[#e8eef5] to-[#dce5f0] p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[var(--secondary)]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-xl">
            <Image src="/images/logo-cth.png" alt="Logo CTH Madagascar" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--primary)]">CTH Madagascar</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Centre de Traitement de l&apos;Hémophilie</p>
        </div>

        {/* Card de connexion */}
        <div className="glass-card !bg-white/70 !backdrop-blur-xl shadow-2xl">
          {!showForgot ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck size={24} weight="duotone" className="text-[var(--primary)]" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Connexion sécurisée</h2>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200/50 mb-4 animate-fade-in">
                  <Warning size={18} weight="duotone" className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Adresse e-mail</label>
                  <div className="relative">
                    <Envelope size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="email"
                      className="glass-input w-full pl-10"
                      placeholder="votre.email@cth-madagascar.mg"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <Lock size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="glass-input w-full pl-10 pr-10"
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {showPassword ? <EyeSlash size={18} weight="duotone" /> : <Eye size={18} weight="duotone" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full !py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connexion en cours...
                    </span>
                  ) : (
                    <>
                      <ShieldCheck size={20} weight="duotone" />
                      Se connecter
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowForgot(true)}
                  className="text-sm text-[var(--accent)] hover:underline font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Info sécurité */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                  <ShieldCheck size={14} weight="duotone" className="flex-shrink-0 mt-0.5 text-emerald-500" />
                  <p>
                    Connexion sécurisée • Déconnexion automatique après 1h d&apos;inactivité •
                    Seul l&apos;administrateur peut créer des comptes •
                    Les données patients sont protégées conformément aux normes RGPD
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Récupération du mot de passe</h2>
              {!forgotSent ? (
                <>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Entrez votre adresse e-mail. Un lien de réinitialisation vous sera envoyé.
                  </p>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="relative">
                      <Envelope size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="email"
                        className="glass-input w-full pl-10"
                        placeholder="votre.email@cth-madagascar.mg"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary w-full !py-3 disabled:opacity-50">
                      {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <Envelope size={32} weight="duotone" className="text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-emerald-800 mb-2">E-mail envoyé !</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Si un compte existe pour <strong>{forgotEmail}</strong>, vous recevrez un lien de réinitialisation.
                    Vérifiez également vos spams.
                  </p>
                </div>
              )}
              <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="text-sm text-[var(--accent)] hover:underline font-medium mt-4 block mx-auto">
                ← Retour à la connexion
              </button>
            </>
          )}
        </div>

        {/* Pied de page */}
        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          © {new Date().getFullYear()} CTH Madagascar • Application à usage médical confidentiel
        </p>
      </div>
    </div>
  );
}
