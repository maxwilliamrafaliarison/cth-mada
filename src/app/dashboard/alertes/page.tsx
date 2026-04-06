'use client';

import Navbar from '@/components/layout/Navbar';
import { useState, useEffect } from 'react';
import { BellRinging, Warning, Clock, Package, UsersThree, ArrowsLeftRight, Check, Trash } from '@phosphor-icons/react';
import { getAlertes, markAlertAsRead, markAllAlertsAsRead, deleteAlerte } from '@/app/actions/alertes';
import type { TypeAlerte, NiveauAlerte } from '@/types';

const typeConfig: Record<TypeAlerte, { icon: typeof BellRinging; label: string }> = {
  expiration: { icon: Clock, label: 'Expiration' },
  stock_faible: { icon: Package, label: 'Stock faible' },
  suivi_patient: { icon: UsersThree, label: 'Suivi patient' },
  transfert: { icon: ArrowsLeftRight, label: 'Transfert' },
  systeme: { icon: BellRinging, label: 'Système' },
};

const niveauConfig: Record<NiveauAlerte, { class: string; bgClass: string }> = {
  info: { class: 'badge-info', bgClass: '!bg-blue-50/50' },
  attention: { class: 'badge-warning', bgClass: '!bg-amber-50/50' },
  urgent: { class: 'badge-danger', bgClass: '!bg-red-50/50' },
  critique: { class: 'badge-danger', bgClass: '!bg-red-100/50' },
};

export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Awaited<ReturnType<typeof getAlertes>>>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAlertes() {
    try {
      const data = await getAlertes();
      setAlertes(data);
    } catch (err) {
      console.error('Erreur chargement alertes:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlertes();
  }, []);

  async function handleMarkAsRead(id: string) {
    try {
      await markAlertAsRead(id);
      await fetchAlertes();
    } catch (err) {
      console.error('Erreur marquage alerte:', err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAlertsAsRead();
      await fetchAlertes();
    } catch (err) {
      console.error('Erreur marquage alertes:', err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAlerte(id);
      await fetchAlertes();
    } catch (err) {
      console.error('Erreur suppression alerte:', err);
    }
  }

  const nonLues = alertes.filter(a => !a.lue);
  const lues = alertes.filter(a => a.lue);

  return (
    <>
      <Navbar titre="Alertes" />
      <main className="p-4 md:p-6">
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-[var(--text-secondary)]"><strong>{nonLues.length}</strong> alerte{nonLues.length > 1 ? 's' : ''} non lue{nonLues.length > 1 ? 's' : ''}</p>
              <button className="btn btn-glass btn-sm" onClick={handleMarkAllAsRead}><Check size={14} weight="bold" />Tout marquer comme lu</button>
            </div>

            <div className="space-y-3 mb-8">
              {nonLues.map(alerte => {
                const type = typeConfig[alerte.type as TypeAlerte];
                const niveau = niveauConfig[alerte.niveau as NiveauAlerte];
                const TypeIcon = type?.icon || BellRinging;
                return (
                  <div key={alerte.id} className={`glass-card ${niveau?.bgClass || ''} animate-fade-in hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
                        <TypeIcon size={22} weight="duotone" className="text-[var(--text-primary)]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm text-[var(--text-primary)]">{alerte.titre}</h4>
                          <span className={`badge ${niveau?.class || 'badge-info'}`}>{alerte.niveau}</span>
                          <span className="badge badge-primary text-[0.6rem]">{type?.label || alerte.type}</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">{alerte.message}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{new Date(alerte.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button className="p-1.5 rounded-lg hover:bg-white/50 text-emerald-600" title="Marquer comme lu" onClick={() => handleMarkAsRead(alerte.id)}><Check size={16} weight="bold" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-white/50 text-red-400" title="Supprimer" onClick={() => handleDelete(alerte.id)}><Trash size={16} weight="duotone" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {lues.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-wider">Lues</h3>
                <div className="space-y-2">
                  {lues.map(alerte => {
                    const type = typeConfig[alerte.type as TypeAlerte];
                    const TypeIcon = type?.icon || BellRinging;
                    return (
                      <div key={alerte.id} className="glass-card !p-3 opacity-60">
                        <div className="flex items-center gap-3">
                          <TypeIcon size={16} weight="duotone" className="text-[var(--text-muted)]" />
                          <p className="text-sm text-[var(--text-secondary)] flex-1">{alerte.titre} — {alerte.message}</p>
                          <span className="text-xs text-[var(--text-muted)]">{new Date(alerte.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
