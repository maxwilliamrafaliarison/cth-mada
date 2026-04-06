'use client';

import {
  BellRinging, MagnifyingGlass, UserCircle, Hospital, CaretDown,
  CheckCircle, Warning, Package, Clock, Eye, X
} from '@phosphor-icons/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { ROLE_LABELS_SHORT } from '@/lib/rbac';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { markAlertAsRead } from '@/app/actions/alertes';
import Link from 'next/link';

interface NavbarProps {
  titre: string;
}

interface Alerte {
  id: string;
  type: string;
  titre: string;
  message: string;
  lue: boolean;
  created_at: string;
  centre: { nom: string } | null;
}

const alerteIcons: Record<string, typeof Warning> = {
  stock_faible: Package,
  expiration: Clock,
  rupture: Warning,
};

const alerteColors: Record<string, string> = {
  stock_faible: 'text-amber-500',
  expiration: 'text-orange-500',
  rupture: 'text-red-500',
};

export default function Navbar({ titre }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [centreDropdown, setCentreDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { profile, isAdmin, currentCentreId, setCurrentCentreId } = useUser();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Display name
  const displayName = profile
    ? `${profile.role === 'medecin' ? 'Dr ' : ''}${profile.prenom} ${profile.nom}`
    : '';
  const roleLabel = profile ? ROLE_LABELS_SHORT[profile.role] : '';

  // Current centre
  const currentCentre = profile?.centres?.find(c => c.id === currentCentreId);
  const centreName = currentCentre?.nom?.replace('CTH ', '') || 'Centre';

  // Fetch alerts
  const fetchAlertes = useCallback(() => {
    const supabase = createBrowserSupabaseClient();
    supabase
      .from('alertes')
      .select('id, type, titre, message, lue, created_at, centre:centres(nom)')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        // Supabase may return centre as array from join — normalize it
        const list = (data || []).map((a: Record<string, unknown>) => ({
          ...a,
          centre: Array.isArray(a.centre) ? a.centre[0] || null : a.centre,
        })) as Alerte[];
        setAlertes(list);
        setAlertCount(list.filter(a => !a.lue).length);
      });
  }, []);

  useEffect(() => { fetchAlertes(); }, [fetchAlertes]);

  // Handle mark as read
  const handleMarkRead = async (id: string) => {
    try {
      await markAlertAsRead(id);
      setAlertes(prev => prev.map(a => a.id === id ? { ...a, lue: true } : a));
      setAlertCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCentreDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Time ago helper
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `Il y a ${days}j`;
  };

  return (
    <header className="glass-navbar sticky top-0 z-30 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Titre */}
        <div className="pl-10 lg:pl-0">
          <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)]">{titre}</h2>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Recherche */}
          <div className={`relative transition-all duration-300 ${searchOpen ? 'w-56 md:w-64' : 'w-10'}`}>
            {searchOpen && (
              <input
                type="text"
                placeholder="Rechercher..."
                className="glass-input w-full pr-10 text-sm"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            )}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`${searchOpen ? 'absolute right-2 top-1/2 -translate-y-1/2' : ''} p-2 rounded-xl hover:bg-white/50 transition-colors text-[var(--text-secondary)]`}
            >
              <MagnifyingGlass size={20} weight="duotone" />
            </button>
          </div>

          {/* Centre actuel — admin voit tous les centres */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                const hasMultiple = (profile?.centres?.length || 0) > 1;
                if (hasMultiple || isAdmin) setCentreDropdown(!centreDropdown);
              }}
              className="btn-glass btn-sm flex items-center gap-2"
            >
              <Hospital size={18} weight="duotone" className="text-[var(--primary)]" />
              <span className="text-sm font-medium hidden md:inline">{centreName}</span>
              {((profile?.centres?.length || 0) > 1 || isAdmin) && (
                <CaretDown size={14} className={`text-[var(--text-muted)] transition-transform ${centreDropdown ? 'rotate-180' : ''}`} />
              )}
            </button>
            {centreDropdown && profile?.centres && (
              <div className="absolute right-0 top-full mt-2 glass-dropdown py-1 min-w-[220px] z-50 max-h-[360px] overflow-y-auto">
                {isAdmin && (
                  <div className="px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-gray-200/30 mb-1">
                    Navigation centres
                  </div>
                )}
                {profile.centres.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setCurrentCentreId(c.id); setCentreDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/40 transition-all duration-150 flex items-center gap-2 ${
                      c.id === currentCentreId
                        ? 'text-[var(--primary)] font-semibold bg-blue-50/50'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.id === currentCentreId ? 'bg-[var(--primary)]' : 'bg-gray-300'}`} />
                    <div>
                      <span className="block">{c.nom}</span>
                      <span className="text-[0.6rem] text-[var(--text-muted)]">{c.ville}</span>
                    </div>
                    {c.est_principal && (
                      <span className="ml-auto text-[0.55rem] text-[var(--text-muted)] bg-gray-100/60 px-1.5 py-0.5 rounded-full">principal</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl hover:bg-white/50 transition-colors text-[var(--text-secondary)]"
            >
              <BellRinging size={20} weight="duotone" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[var(--secondary)] text-white text-[0.6rem] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center pulse-alert">
                  {alertCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 glass-dropdown w-[340px] md:w-[380px] z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/30">
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">Notifications</h4>
                  <div className="flex items-center gap-2">
                    {alertCount > 0 && (
                      <span className="text-[0.65rem] font-semibold text-white bg-[var(--secondary)] px-2 py-0.5 rounded-full">
                        {alertCount} nouvelle{alertCount > 1 ? 's' : ''}
                      </span>
                    )}
                    <button onClick={() => setNotifOpen(false)} className="p-1 rounded-lg hover:bg-gray-100/50 text-[var(--text-muted)]">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-[360px] overflow-y-auto">
                  {alertes.length === 0 ? (
                    <div className="p-6 text-center">
                      <BellRinging size={32} weight="duotone" className="text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-[var(--text-muted)]">Aucune notification</p>
                    </div>
                  ) : (
                    alertes.map(alerte => {
                      const Icon = alerteIcons[alerte.type] || Warning;
                      const iconColor = alerteColors[alerte.type] || 'text-gray-500';
                      return (
                        <div
                          key={alerte.id}
                          className={`px-4 py-3 border-b border-gray-100/30 hover:bg-white/30 transition-all duration-150 cursor-pointer ${
                            !alerte.lue ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                              !alerte.lue ? 'bg-white/60' : 'bg-gray-100/40'
                            }`}>
                              <Icon size={18} weight="duotone" className={iconColor} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm leading-tight ${!alerte.lue ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                  {alerte.titre}
                                </p>
                                {!alerte.lue && (
                                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-[0.7rem] text-[var(--text-muted)] mt-0.5 line-clamp-2">{alerte.message}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[0.6rem] text-[var(--text-muted)]">{timeAgo(alerte.created_at)}</span>
                                {alerte.centre && (
                                  <span className="text-[0.6rem] text-[var(--text-muted)]">• {alerte.centre.nom}</span>
                                )}
                              </div>
                            </div>
                            {!alerte.lue && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMarkRead(alerte.id); }}
                                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/60 text-[var(--text-muted)] hover:text-[var(--success)] transition-colors"
                                title="Marquer comme lu"
                              >
                                <CheckCircle size={16} weight="duotone" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <Link
                  href="/dashboard/alertes"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-200/30 text-sm font-medium text-[var(--accent)] hover:bg-white/30 transition-colors"
                >
                  <Eye size={16} weight="duotone" />
                  Voir toutes les alertes
                </Link>
              </div>
            )}
          </div>

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
