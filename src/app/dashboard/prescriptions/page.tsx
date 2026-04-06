'use client';

import Navbar from '@/components/layout/Navbar';
import { useState } from 'react';
import { ClipboardText, Plus, MagnifyingGlass, Clock, CheckCircle, XCircle, UserCircle, Pill } from '@phosphor-icons/react';
import { prescriptions, patients, medicaments, centres } from '@/lib/demo-data';
import type { TypeSaignement } from '@/types';

const TYPES_SAIGNEMENT: TypeSaignement[] = [
  'Hémarthrose du genou droit', 'Hémarthrose du genou gauche', 'Hémarthrose de la cheville',
  'Hémarthrose du coude', "Hémarthrose de l'épaule", 'Hémarthrose de la hanche',
  'Hématome intramusculaire', 'Hématome sous-dural', 'Hématome du psoas',
  'Épistaxis', 'Gingivorragie', 'Hématurie', 'Hémorragie digestive',
  'Hémorragie post-circoncision', 'Hémorragie post-traumatique', 'Hémorragie post-opératoire',
  'Ecchymose', 'Autre',
];

const statutConfig: Record<string, { icon: typeof CheckCircle; class: string }> = {
  'En attente': { icon: Clock, class: 'badge-warning' },
  'Dispensée': { icon: CheckCircle, class: 'badge-success' },
  'Annulée': { icon: XCircle, class: 'badge-danger' },
  'Partiellement dispensée': { icon: Clock, class: 'badge-info' },
};

export default function PrescriptionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const filtered = prescriptions.filter(rx => {
    const patient = patients.find(p => p.id === rx.patient_id);
    const matchSearch = !search ||
      `${patient?.nom} ${patient?.prenom} ${rx.numero}`.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || rx.statut === filterStatut;
    return matchSearch && matchStatut;
  }).sort((a, b) => new Date(b.date_prescription).getTime() - new Date(a.date_prescription).getTime());

  return (
    <>
      <Navbar titre="Prescriptions médicales" />
      <main className="p-6">
        <div className="glass-card !p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <MagnifyingGlass size={16} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" placeholder="Rechercher une prescription..." className="glass-input w-full pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="glass-select" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="En attente">En attente</option>
              <option value="Dispensée">Dispensée</option>
              <option value="Annulée">Annulée</option>
            </select>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} weight="bold" />Nouvelle prescription</button>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map(rx => {
            const patient = patients.find(p => p.id === rx.patient_id);
            const config = statutConfig[rx.statut] || statutConfig['En attente'];
            const StatusIcon = config.icon;
            return (
              <div key={rx.id} className="glass-card animate-fade-in hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${rx.urgence ? 'bg-red-100' : 'bg-blue-50'}`}>
                    <UserCircle size={28} weight="duotone" className={rx.urgence ? 'text-red-600' : 'text-blue-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-[var(--text-primary)]">{patient?.nom} {patient?.prenom}</h4>
                      <span className={`badge ${patient?.type_hemophilie === 'HA' ? 'badge-secondary' : 'badge-accent'}`}>{patient?.numero_cth}</span>
                      {rx.urgence && <span className="badge badge-danger pulse-alert">URGENT</span>}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                      <span className="font-mono text-xs">{rx.numero}</span> • {rx.type_traitement} • {rx.type_saignement || 'Non spécifié'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {rx.lignes.map(ligne => {
                        const med = medicaments.find(m => m.id === ligne.medicament_id);
                        return (
                          <div key={ligne.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/50 border border-gray-100">
                            <Pill size={14} weight="duotone" className="text-[var(--accent)]" />
                            <span className="text-sm font-medium">{med?.nom_complet}</span>
                            <span className="text-xs text-[var(--text-muted)]">× {ligne.quantite_prescrite} {med?.unite}</span>
                          </div>
                        );
                      })}
                    </div>
                    {rx.autres_precisions && <p className="text-xs text-[var(--text-muted)] italic">{rx.autres_precisions}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge ${config.class}`}><StatusIcon size={14} weight="duotone" />{rx.statut}</span>
                    <p className="text-xs text-[var(--text-muted)] mt-2">{new Date(rx.date_prescription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    {rx.statut === 'En attente' && <button className="btn btn-success btn-sm mt-3"><CheckCircle size={14} weight="duotone" />Dispenser</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <div className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto !bg-white/90" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-5">Nouvelle prescription</h3>
              <div className="space-y-4">
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Patient *</label><select className="glass-select w-full"><option value="">Sélectionner un patient</option>{patients.filter(p => p.statut === 'Actif').map(p => <option key={p.id} value={p.id}>{p.numero_cth} - {p.nom} {p.prenom} ({p.type_hemophilie === 'HA' ? 'Hémo. A' : 'Hémo. B'})</option>)}</select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Type de traitement *</label><select className="glass-select w-full"><option value="Demande">À la demande (épisode aigu)</option><option value="Prophylaxie">Prophylaxie</option><option value="Pré-opératoire">Pré-opératoire</option><option value="Post-opératoire">Post-opératoire</option></select></div>
                  <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Type de saignement aigu</label><select className="glass-select w-full"><option value="">Non applicable</option>{TYPES_SAIGNEMENT.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                </div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Médicament prescrit *</label><select className="glass-select w-full"><option value="">Sélectionner un médicament</option>{medicaments.map(m => <option key={m.id} value={m.id}>{m.nom_complet} ({m.type_facteur} - {m.indication})</option>)}</select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Quantité prescrite (UI/mg) *</label><input type="number" className="glass-input w-full" placeholder="Ex: 1000" /></div>
                  <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Posologie</label><input type="text" className="glass-input w-full" placeholder="Ex: 500 UI x 2/jour" /></div>
                </div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Précisions complémentaires</label><textarea className="glass-input w-full h-20 resize-none" placeholder="Description chirurgie, remarques..." /></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4 rounded" /><span className="font-medium text-red-600">Prescription urgente</span></label>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button className="btn btn-glass" onClick={() => setShowForm(false)}>Annuler</button>
                <button className="btn btn-primary"><ClipboardText size={16} weight="duotone" />Créer la prescription</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
