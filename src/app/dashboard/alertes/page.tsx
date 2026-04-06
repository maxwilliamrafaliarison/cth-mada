'use client';

import Navbar from '@/components/layout/Navbar';
import { BellRinging, Warning, Clock, Package, UsersThree, ArrowsLeftRight, Check, Trash } from '@phosphor-icons/react';
import { alertes } from '@/lib/demo-data';
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
  const nonLues = alertes.filter(a => !a.lue);
  const lues = alertes.filter(a => a.lue);

  return (
    <>
      <Navbar titre="Alertes" />
      <main className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[var(--text-secondary)]"><strong>{nonLues.length}</strong> alerte{nonLues.length > 1 ? 's' : ''} non lue{nonLues.length > 1 ? 's' : ''}</p>
          <button className="btn btn-glass btn-sm"><Check size={14} weight="bold" />Tout marquer comme lu</button>
        </div>

        <div className="space-y-3 mb-8">
          {nonLues.map(alerte => {
            const type = typeConfig[alerte.type];
            const niveau = niveauConfig[alerte.niveau];
            const TypeIcon = type.icon;
            return (
              <div key={alerte.id} className={`glass-card ${niveau.bgClass} animate-fade-in hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
                    <TypeIcon size={22} weight="duotone" className="text-[var(--text-primary)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm text-[var(--text-primary)]">{alerte.titre}</h4>
                      <span className={`badge ${niveau.class}`}>{alerte.niveau}</span>
                      <span className="badge badge-primary text-[0.6rem]">{type.label}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{alerte.message}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{new Date(alerte.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button className="p-1.5 rounded-lg hover:bg-white/50 text-emerald-600" title="Marquer comme lu"><Check size={16} weight="bold" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-white/50 text-red-400" title="Supprimer"><Trash size={16} weight="duotone" /></button>
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
                const type = typeConfig[alerte.type];
                const TypeIcon = type.icon;
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
      </main>
    </>
  );
}
