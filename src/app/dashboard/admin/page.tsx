'use client';

import Navbar from '@/components/layout/Navbar';
import { GearSix, UsersThree, Hospital, Shield, Database, Envelope } from '@phosphor-icons/react';
import { utilisateurs, centres } from '@/lib/demo-data';

const roleLabels: Record<string, { label: string; class: string }> = {
  administrateur: { label: 'Administrateur', class: 'badge-danger' },
  medecin: { label: 'Médecin', class: 'badge-info' },
  pharmacien: { label: 'Pharmacien', class: 'badge-success' },
};

export default function AdminPage() {
  return (
    <>
      <Navbar titre="Administration" />
      <main className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Utilisateurs */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UsersThree size={22} weight="duotone" className="text-[var(--primary)]" />
                <h3 className="font-bold text-[var(--text-primary)]">Utilisateurs</h3>
              </div>
              <button className="btn btn-primary btn-sm">+ Ajouter</button>
            </div>
            <div className="space-y-3">
              {utilisateurs.map(user => {
                const role = roleLabels[user.role];
                const centre = centres.find(c => c.id === user.centre_id);
                return (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/30 hover:bg-white/50 transition-all duration-200 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{user.prenom[0] || user.nom[0]}{user.nom[0]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{user.prenom} {user.nom}</p>
                      <p className="text-xs text-[var(--text-muted)]">{user.email} • {centre?.ville}</p>
                    </div>
                    <span className={`badge ${role.class}`}>{role.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Centres */}
          <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
              <Hospital size={22} weight="duotone" className="text-[var(--accent)]" />
              <h3 className="font-bold text-[var(--text-primary)]">Centres de traitement</h3>
            </div>
            <div className="space-y-2">
              {centres.map(centre => (
                <div key={centre.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/30 hover:bg-white/50 transition-all duration-200 cursor-pointer">
                  <div className={`w-3 h-3 rounded-full ${centre.est_central ? 'bg-[var(--secondary)]' : 'bg-[var(--accent)]'}`} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{centre.nom}</p>
                    <p className="text-xs text-[var(--text-muted)]">{centre.ville} — {centre.province}</p>
                  </div>
                  {centre.est_central && <span className="badge badge-secondary text-[0.6rem]">CENTRAL</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
              <GearSix size={22} weight="duotone" className="text-[var(--text-secondary)]" />
              <h3 className="font-bold text-[var(--text-primary)]">Configuration</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/30">
                <div className="flex items-center gap-2"><Shield size={18} weight="duotone" className="text-[var(--text-muted)]" /><span className="text-sm">Seuil d&apos;alerte expiration</span></div>
                <span className="font-bold text-sm">90 jours</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/30">
                <div className="flex items-center gap-2"><Database size={18} weight="duotone" className="text-[var(--text-muted)]" /><span className="text-sm">Seuil de stock faible</span></div>
                <span className="font-bold text-sm">10 unités</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/30">
                <div className="flex items-center gap-2"><Envelope size={18} weight="duotone" className="text-[var(--text-muted)]" /><span className="text-sm">E-mail des rapports</span></div>
                <span className="text-sm text-[var(--text-secondary)]">fitahiana@cth-madagascar.mg</span>
              </div>
            </div>
          </div>

          {/* Base de données */}
          <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
              <Database size={22} weight="duotone" className="text-emerald-600" />
              <h3 className="font-bold text-[var(--text-primary)]">Base de données</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/30">
                <span className="text-sm">Statut Supabase</span>
                <span className="badge badge-success">Connecté</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/30">
                <span className="text-sm">Dernière synchronisation</span>
                <span className="text-sm text-[var(--text-muted)]">{new Date().toLocaleString('fr-FR')}</span>
              </div>
              <button className="btn btn-glass btn-sm w-full">
                <Database size={14} weight="duotone" />
                Importer les données Excel existantes
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
