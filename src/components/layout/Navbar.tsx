'use client';

import { BellRinging, MagnifyingGlass, UserCircle, Hospital, CaretDown } from '@phosphor-icons/react';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import { ROLE_LABELS_SHORT } from '@/lib/rbac';
import { createBrowserSupabaseClient } from '@/lib/supabase';

interface NavbarProps {
  titre: string;
}

export default function Navbar({ titre }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [centreDropdown, setCentreDropdown] = useState(false);
  const { profile, currentCentreId, setCurrentCentreId } = useUser();
  const [alertCount, setAlertCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get display name
  const displayName = profile
    ? `${profile.role === 'medecin' ? 'Dr ' : ''}${profile.prenom} ${profile.nom}`
    : '';
  const roleLabel = profile ? ROLE_LABELS_SHORT[profile.role] : '';

  // Current centre name
  const currentCentre = profile?.centres?.find(c => c.id === currentCentreId);
  const centreName = currentCentre?.nom?.replace('CTH ', '') || 'Centre';

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.from('alertes').select('id', { count: 'exact', head: true }).eq('lue', false)
      .then(({ count }) => setAlertCount(count || 0));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCentreDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="glass-navbar sticky top-0 z-30 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Titre de la page */}
        <div className="pl-10 lg:pl-0">
          <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)]">{titre}</h2>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Recherche */}
          <div className={`relative transition-all duration-300 ${searchOpen ? 'w-64' : 'w-10'}`}>
            {searchOpen ? (
              <input
                type="text"
                placeholder="Rechercher un patient, médicament..."
                className="glass-input w-full pr-10"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            ) : null}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`${searchOpen ? 'absolute right-2 top-1/2 -translate-y-1/2' : ''} p-2 rounded-xl hover:bg-white/50 transition-colors text-[var(--text-secondary)]`}
            >
              <MagnifyingGlass size={20} weight="duotone" />
            </button>
          </div>

          {/* Centre actuel — avec dropdown si multi-centres */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => profile?.centres && profile.centres.length > 1 && setCentreDropdown(!centreDropdown)}
              className="btn-glass btn-sm flex items-center gap-2"
            >
              <Hospital size={18} weight="duotone" className="text-[var(--primary)]" />
              <span className="text-sm font-medium hidden md:inline">{centreName}</span>
              {profile?.centres && profile.centres.length > 1 && (
                <CaretDown size={14} className="text-[var(--text-muted)]" />
              )}
            </button>
            {centreDropdown && profile?.centres && profile.centres.length > 1 && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200/50 py-1 min-w-[200px] z-50">
                {profile.centres.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setCurrentCentreId(c.id); setCentreDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${c.id === currentCentreId ? 'text-[var(--primary)] font-semibold bg-blue-50/50' : 'text-[var(--text-primary)]'}`}
                  >
                    {c.nom}
                    {c.est_principal && <span className="text-[0.6rem] text-[var(--text-muted)] ml-2">(principal)</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-white/50 transition-colors text-[var(--text-secondary)]">
            <BellRinging size={20} weight="duotone" />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[var(--secondary)] text-white text-[0.6rem] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {alertCount}
              </span>
            )}
          </button>

          {/* Profil */}
          <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
              <UserCircle size={20} weight="duotone" className="text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{displayName}</p>
              <p className="text-[0.65rem] text-[var(--text-muted)]">{roleLabel}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
