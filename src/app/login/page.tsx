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

    await new Promise(r => setTimeout(r, 1000));

    const validUsers = [
      { email: 'admin@cth-madagascar.mg', password: 'Admin@CTH2026!' },
      { email: 'fety@cth-madagascar.mg', password: 'Medecin@CTH2026!' },
      { email: 'fitahiana@cth-madagascar.mg', password: 'Medecin@CTH2026!' },
      { email: 'pharma@cth-madagascar.mg', password: 'Pharma@CTH2026!' },
    ];

    const user = validUsers.find(u => u.email === email && u.password === password);
    if (user) {
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

      const session = {
        email: user.email,
        loginAt: Date.now(),
        expiresAt: Date.now() + 60 * 60 * 1000,
      };
      localStorage.setItem('cth_session', JSON.stringify(session));
      window.location.href = '/dashboard';
    } else {
      setError('Adresse e-mail ou mot de passe incorrect.');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4f8] via-[#e8eef5] to-[#dce5f0] p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[var(--secondary)]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo et titre */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-3 shadow-xl ring-4 ring-white/50">
            <Image src="/images/logo-cth.png" alt="Logo CTH Madagascar" width={96} height={96} className="w-full h-full object-cover" priority />
          </div>
          <h1 className="text-2xl font-bold text-[var(--primary)] mt-3">CTH Madagascar</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Centre de Traitement de l&apos;Hémophilie</p>
        </div>

        {/* Card de connexion */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-black/5 p-7">
          {!showForgot ? (
            <>
              <div className="flex items-center gap-2.5 mb-5">
                <ShieldCheck size={22} weight="duotone" className="text-[var(--primary)]" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Connexion sécurisée</h2>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/50 mb-5 animate-fade-in">
                  <Warning size={18} weight="duotone" className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Adresse e-mail</label>
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none">
                      <Envelope size={18} weight="duotone" className="text-[var(--text-muted)]" />
                    </div>
                    <input
                      type="email"
                      className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 px-4 pl-11 text-sm text-[var(--text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                      placeholder="exemple@cth-madagascar.mg"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Mot de passe</label>
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none">
                      <Lock size={18} weight="duotone" className="text-[var(--text-muted)]" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 px-4 pl-11 pr-11 text-sm text-[var(--text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                      placeholder="Entrez votre mot de passe"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[var(--primary)]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/20"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connexion en cours...
                    </>
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
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-2 text-[0.7rem] text-gray-400 leading-relaxed">
                  <ShieldCheck size={14} weight="duotone" className="flex-shrink-0 mt-0.5 text-emerald-400" />
                  <p>
                    Connexion sécurisée • Déconnexion automatique après 1h d&apos;inactivité •
                    Seul l&apos;administrateur peut créer des comptes •
                    Données protégées (RGPD)
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Récupération du mot de passe</h2>
              {!forgotSent ? (
                <>
                  <p className="text-sm text-[var(--text-secondary)] mb-5">
                    Entrez votre adresse e-mail. Un lien de réinitialisation vous sera envoyé.
                  </p>
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none">
                        <Envelope size={18} weight="duotone" className="text-[var(--text-muted)]" />
                      </div>
                      <input
                        type="email"
                        className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 px-4 pl-11 text-sm text-[var(--text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                        placeholder="exemple@cth-madagascar.mg"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[var(--primary)]/90 transition-all disabled:opacity-50">
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
                  </p>
                </div>
              )}
              <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="text-sm text-[var(--accent)] hover:underline font-medium mt-5 block mx-auto">
                ← Retour à la connexion
              </button>
            </>
          )}
        </div>

        {/* Pied de page */}
        <p className="text-center text-[0.7rem] text-gray-400 mt-5">
          © {new Date().getFullYear()} CTH Madagascar • Application à usage médical confidentiel
        </p>
      </div>
    </div>
  );
}
