'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { BookOpen, Funnel, ArrowClockwise, Package, Pill, Trash, PencilSimple, CheckCircle } from '@phosphor-icons/react';
import { getJournalPharmacie } from '@/app/actions/journal';
import { getCentres } from '@/app/actions/stock';
import { useUser } from '@/contexts/UserContext';

interface JournalEntry {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  utilisateur: { nom: string; prenom: string; role: string } | null;
  centre: { nom: string; code: string } | null;
}

const ACTION_LABELS: Record<string, { label: string; icon: typeof Package; color: string }> = {
  ajout_lot: { label: 'Ajout de lot', icon: Package, color: 'text-emerald-600 bg-emerald-50' },
  modification_lot: { label: 'Modification de lot', icon: PencilSimple, color: 'text-blue-600 bg-blue-50' },
  suppression_lot: { label: 'Suppression de lot', icon: Trash, color: 'text-red-600 bg-red-50' },
  confirmation_prescription: { label: 'Confirmation prescription', icon: CheckCircle, color: 'text-purple-600 bg-purple-50' },
  dispensation: { label: 'Dispensation', icon: Pill, color: 'text-amber-600 bg-amber-50' },
};

export default function JournalPage() {
  const { isAdmin } = useUser();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [centres, setCentres] = useState<{ id: string; nom: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ centre_id: 'all', action: 'all' });

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      getJournalPharmacie(filters).catch(() => []),
      getCentres().catch(() => []),
    ]).then(([j, c]) => {
      setEntries(j as JournalEntry[]);
      setCentres(c);
      setLoading(false);
    });
  }, [isAdmin, filters]);

  const refresh = () => {
    setLoading(true);
    getJournalPharmacie(filters).then(j => {
      setEntries(j as JournalEntry[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  if (!isAdmin) {
    return (
      <>
        <Navbar titre="Journal Pharmacie" />
        <div className="p-6">
          <div className="glass-card p-12 text-center">
            <BookOpen size={48} weight="duotone" className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Accès restreint</h3>
            <p className="text-[var(--text-secondary)]">Seuls les administrateurs peuvent consulter le journal de la pharmacie.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar titre="Journal Pharmacie" />
      <div className="p-4 md:p-6 space-y-4">
        {/* Filtres */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Funnel size={18} weight="duotone" className="text-[var(--text-muted)]" />
            <select
              value={filters.centre_id}
              onChange={e => setFilters(f => ({ ...f, centre_id: e.target.value }))}
              className="glass-input text-sm py-2 px-3 min-w-[180px]"
            >
              <option value="all">Tous les centres</option>
              {centres.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <select
              value={filters.action}
              onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
              className="glass-input text-sm py-2 px-3 min-w-[180px]"
            >
              <option value="all">Toutes les actions</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <button onClick={refresh} className="btn-glass btn-sm flex items-center gap-1.5">
              <ArrowClockwise size={16} weight="bold" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin mx-auto" />
              <p className="text-sm text-[var(--text-muted)] mt-3">Chargement du journal...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen size={48} weight="duotone" className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Aucune entrée</h3>
              <p className="text-[var(--text-secondary)]">Le journal est vide pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200/50 bg-gray-50/30">
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)]">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)]">Action</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)]">Utilisateur</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)]">Centre</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)]">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => {
                    const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, icon: BookOpen, color: 'text-gray-600 bg-gray-50' };
                    const Icon = actionInfo.icon;
                    return (
                      <tr key={entry.id} className="border-b border-gray-100/50 hover:bg-gray-50/30 transition-colors">
                        <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${actionInfo.color}`}>
                            <Icon size={14} weight="duotone" />
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                          {entry.utilisateur ? `${entry.utilisateur.prenom} ${entry.utilisateur.nom}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          {entry.centre?.nom || '-'}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-xs max-w-[300px] truncate">
                          {entry.details ? JSON.stringify(entry.details) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
