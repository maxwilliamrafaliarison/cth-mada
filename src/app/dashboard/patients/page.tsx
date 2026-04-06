'use client';

import Navbar from '@/components/layout/Navbar';
import { useState } from 'react';
import { MagnifyingGlass, Plus, Eye, PencilSimple, DownloadSimple, UsersThree, Heartbeat, ClipboardText } from '@phosphor-icons/react';
import { patients, centres } from '@/lib/demo-data';
import { ETHNIES_MADAGASCAR } from '@/types';
import type { TypeHemophilie, SeveriteHemophilie, StatutPatient } from '@/types';

function calculateAge(dateNaissance: string): string {
  const birth = new Date(dateNaissance);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--;
  return `${years} ans`;
}

const severiteBadge: Record<string, string> = {
  'Sévère': 'badge-danger',
  'Modérée': 'badge-warning',
  'Mineure': 'badge-success',
};

const statutBadge: Record<string, string> = {
  'Actif': 'badge-success',
  'Inactif': 'badge-warning',
  'Décédé': 'badge-danger',
};

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TypeHemophilie | ''>('');
  const [filterSeverite, setFilterSeverite] = useState<SeveriteHemophilie | ''>('');
  const [filterStatut, setFilterStatut] = useState<StatutPatient | ''>('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = patients.filter(p => {
    const matchSearch = !search ||
      `${p.nom} ${p.prenom} ${p.numero_cth} ${p.numero_wbdr}`.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || p.type_hemophilie === filterType;
    const matchSeverite = !filterSeverite || p.severite === filterSeverite;
    const matchStatut = !filterStatut || p.statut === filterStatut;
    return matchSearch && matchType && matchSeverite && matchStatut;
  });

  const selected = selectedPatient ? patients.find(p => p.id === selectedPatient) : null;

  return (
    <>
      <Navbar titre="Gestion des patients" />
      <main className="p-4 md:p-6">
        {/* En-tête stats rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="glass-card !p-4 flex items-center gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <UsersThree size={22} weight="duotone" className="text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{patients.length}</p>
              <p className="text-xs text-[var(--text-muted)]">Total patients</p>
            </div>
          </div>
          <div className="glass-card !p-4 flex items-center gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Heartbeat size={22} weight="duotone" className="text-[var(--secondary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{patients.filter(p => p.type_hemophilie === 'HA').length}</p>
              <p className="text-xs text-[var(--text-muted)]">Hémophilie A</p>
            </div>
          </div>
          <div className="glass-card !p-4 flex items-center gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Heartbeat size={22} weight="duotone" className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{patients.filter(p => p.type_hemophilie === 'HB').length}</p>
              <p className="text-xs text-[var(--text-muted)]">Hémophilie B</p>
            </div>
          </div>
          <div className="glass-card !p-4 flex items-center gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <UsersThree size={22} weight="duotone" className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{patients.filter(p => p.statut === 'Actif').length}</p>
              <p className="text-xs text-[var(--text-muted)]">Actifs</p>
            </div>
          </div>
        </div>

        {/* Barre d'actions */}
        <div className="glass-card !p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px] md:min-w-[240px]">
              <MagnifyingGlass size={16} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Rechercher par nom, N° CTH, N° WBDR..."
                className="glass-input w-full pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="glass-select" value={filterType} onChange={e => setFilterType(e.target.value as TypeHemophilie | '')}>
              <option value="">Type d&apos;hémophilie</option>
              <option value="HA">Hémophilie A (FVIII)</option>
              <option value="HB">Hémophilie B (FIX)</option>
            </select>
            <select className="glass-select" value={filterSeverite} onChange={e => setFilterSeverite(e.target.value as SeveriteHemophilie | '')}>
              <option value="">Sévérité</option>
              <option value="Sévère">Sévère</option>
              <option value="Modérée">Modérée</option>
              <option value="Mineure">Mineure</option>
            </select>
            <select className="glass-select" value={filterStatut} onChange={e => setFilterStatut(e.target.value as StatutPatient | '')}>
              <option value="">Statut</option>
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
              <option value="Décédé">Décédé</option>
            </select>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} weight="bold" />
              Nouveau patient
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Table patients */}
          <div className={`glass-card !p-0 overflow-hidden ${selected ? 'flex-1' : 'w-full'}`}>
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>N° CTH</th>
                    <th>N° WBDR</th>
                    <th>Nom et Prénom</th>
                    <th>Type</th>
                    <th>Sévérité</th>
                    <th>Âge</th>
                    <th>Poids</th>
                    <th>GS</th>
                    <th>Statut</th>
                    <th>Centre</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(patient => {
                    const centre = centres.find(c => c.id === patient.centre_id);
                    return (
                      <tr
                        key={patient.id}
                        className={`cursor-pointer ${selectedPatient === patient.id ? '!bg-blue-50/50' : ''}`}
                        onClick={() => setSelectedPatient(patient.id === selectedPatient ? null : patient.id)}
                      >
                        <td className="font-bold text-[var(--primary)]">{patient.numero_cth}</td>
                        <td className="font-mono text-xs">{patient.numero_wbdr}</td>
                        <td className="font-semibold">{patient.nom} {patient.prenom}</td>
                        <td>
                          <span className={`badge ${patient.type_hemophilie === 'HA' ? 'badge-secondary' : 'badge-accent'}`}>
                            {patient.type_hemophilie === 'HA' ? 'Hémo. A' : 'Hémo. B'}
                          </span>
                        </td>
                        <td><span className={`badge ${severiteBadge[patient.severite]}`}>{patient.severite}</span></td>
                        <td className="text-sm">{calculateAge(patient.date_naissance)}</td>
                        <td className="text-sm">{patient.poids ? `${patient.poids} kg` : '-'}</td>
                        <td className="text-sm font-medium">{patient.groupe_sanguin || '-'}</td>
                        <td><span className={`badge ${statutBadge[patient.statut]}`}>{patient.statut}</span></td>
                        <td className="text-xs">{centre?.ville || '-'}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Voir la fiche">
                              <Eye size={16} weight="duotone" />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Modifier">
                              <PencilSimple size={16} weight="duotone" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">{filtered.length} patient{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}</p>
              <button className="btn btn-glass btn-sm">
                <DownloadSimple size={14} weight="duotone" />
                Exporter
              </button>
            </div>
          </div>

          {/* Panel détail patient */}
          {selected && (
            <div className="glass-card w-full lg:w-[380px] flex-shrink-0 animate-slide-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[var(--text-primary)]">Fiche Patient</h3>
                <button onClick={() => setSelectedPatient(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
              </div>

              {/* En-tête patient */}
              <div className="text-center mb-5 pb-5 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl font-bold">{selected.prenom[0]}{selected.nom[0]}</span>
                </div>
                <h4 className="font-bold text-lg text-[var(--text-primary)]">{selected.nom} {selected.prenom}</h4>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className={`badge ${selected.type_hemophilie === 'HA' ? 'badge-secondary' : 'badge-accent'}`}>
                    {selected.type_hemophilie === 'HA' ? 'Hémophilie A' : 'Hémophilie B'}
                  </span>
                  <span className={`badge ${severiteBadge[selected.severite]}`}>{selected.severite}</span>
                  <span className={`badge ${statutBadge[selected.statut]}`}>{selected.statut}</span>
                </div>
              </div>

              {/* Détails */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">N° CTH</span><span className="font-semibold">{selected.numero_cth}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">N° WBDR</span><span className="font-mono">{selected.numero_wbdr}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Date de naissance</span><span>{new Date(selected.date_naissance).toLocaleDateString('fr-FR')}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Âge</span><span className="font-semibold">{calculateAge(selected.date_naissance)}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Poids</span><span>{selected.poids ? `${selected.poids} kg` : 'Non renseigné'}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Groupe sanguin</span><span className="font-bold text-[var(--secondary)]">{selected.groupe_sanguin || 'Non renseigné'}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Taux de facteur</span><span className="font-semibold">{selected.taux_facteur || 'Non renseigné'}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Inhibiteurs</span><span className={selected.presence_inhibiteurs ? 'text-red-600 font-bold' : ''}>{selected.presence_inhibiteurs ? 'Oui' : 'Non'}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Traitement à domicile</span><span>{selected.traitement_domicile ? 'Oui' : 'Non'}</span></div>
                {selected.date_diagnostic && <div className="flex justify-between"><span className="text-[var(--text-muted)]">Date de diagnostic</span><span>{new Date(selected.date_diagnostic).toLocaleDateString('fr-FR')}</span></div>}
                {selected.circonstances_decouverte && <div><span className="text-[var(--text-muted)] block mb-1">Circonstances de découverte</span><span className="text-xs">{selected.circonstances_decouverte}</span></div>}
                {selected.adresse && <div><span className="text-[var(--text-muted)] block mb-1">Adresse</span><span className="text-xs">{selected.adresse}</span></div>}
                {selected.telephone && <div className="flex justify-between"><span className="text-[var(--text-muted)]">Téléphone</span><span className="text-xs">{selected.telephone}</span></div>}
                {selected.observations && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/50">
                    <span className="text-xs font-semibold text-amber-700">Observations</span>
                    <p className="text-xs text-amber-800 mt-1">{selected.observations}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2">
                <button className="btn btn-primary btn-sm flex-1">
                  <ClipboardText size={14} weight="duotone" />
                  Prescrire
                </button>
                <button className="btn btn-glass btn-sm flex-1">
                  <Eye size={14} weight="duotone" />
                  Historique
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Nouveau Patient */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <div className="glass-card w-full max-w-3xl max-h-[85vh] overflow-y-auto !bg-white/90" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-5">Nouveau patient</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">N° CTH *</label><input type="text" className="glass-input w-full" placeholder="Ex : 102A" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">N° WBDR</label><input type="text" className="glass-input w-full" placeholder="Identifiant WFH" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Nom *</label><input type="text" className="glass-input w-full" placeholder="Nom de famille" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Prénom *</label><input type="text" className="glass-input w-full" placeholder="Prénom(s)" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Date de naissance *</label><input type="date" className="glass-input w-full" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Sexe *</label><select className="glass-select w-full"><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Poids (kg)</label><input type="number" className="glass-input w-full" placeholder="Poids en kg" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Groupe sanguin</label><select className="glass-select w-full"><option value="">Sélectionner</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(gs => <option key={gs} value={gs}>{gs}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Type d&apos;hémophilie *</label><select className="glass-select w-full"><option value="HA">Hémophilie A (déficit FVIII)</option><option value="HB">Hémophilie B (déficit FIX)</option></select></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Sévérité *</label><select className="glass-select w-full"><option value="Sévère">Sévère (&lt;1% facteur)</option><option value="Modérée">Modérée (1-5% facteur)</option><option value="Mineure">Mineure (5-40% facteur)</option></select></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Taux de facteur</label><input type="text" className="glass-input w-full" placeholder="Ex : &lt;1%, 0.015, 0.05" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Date de diagnostic</label><input type="date" className="glass-input w-full" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Origine ethnique</label><select className="glass-select w-full"><option value="">Sélectionner</option>{ETHNIES_MADAGASCAR.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Centre de rattachement *</label><select className="glass-select w-full">{centres.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
                <div className="md:col-span-2"><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Adresse</label><input type="text" className="glass-input w-full" placeholder="Adresse complète" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Téléphone</label><input type="tel" className="glass-input w-full" placeholder="034 XX XXX XX" /></div>
                <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email</label><input type="email" className="glass-input w-full" placeholder="email@exemple.com" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Circonstances de découverte de la maladie</label><textarea className="glass-input w-full h-20 resize-none" placeholder="Ex : hémorragie labiale post-morsure, hémorragie post-circoncision..." /></div>
                <div className="md:col-span-2 flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4 rounded" />Présence d&apos;inhibiteurs</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4 rounded" />Traitement à domicile</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button className="btn btn-glass" onClick={() => setShowForm(false)}>Annuler</button>
                <button className="btn btn-primary"><Plus size={16} weight="bold" />Enregistrer le patient</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
