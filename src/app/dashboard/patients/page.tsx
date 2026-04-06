'use client';

import Navbar from '@/components/layout/Navbar';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlass, Plus, Eye, PencilSimple, Trash, DownloadSimple, UsersThree, Heartbeat, ClipboardText, Warning, CheckCircle } from '@phosphor-icons/react';
import { getPatients, createPatient, updatePatient, deletePatient } from '@/app/actions/patients';
import { getCentres } from '@/app/actions/stock';
import { ETHNIES_MADAGASCAR } from '@/types';
import type { TypeHemophilie, SeveriteHemophilie, StatutPatient, Patient, Centre } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { hasPermission } from '@/lib/rbac';
import type { Role } from '@/lib/rbac';

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

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 11 }).map((_, i) => (
        <td key={i}>
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonStatCard() {
  return (
    <div className="glass-card !p-4 flex items-center gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-200" />
      <div className="space-y-2">
        <div className="h-6 w-10 bg-gray-200 rounded" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// --- Default empty form data ---
const emptyForm = {
  numero_cth: '',
  numero_wbdr: '',
  nom: '',
  prenom: '',
  date_naissance: '',
  sexe: 'M' as 'M' | 'F',
  poids: '',
  groupe_sanguin: '',
  type_hemophilie: 'HA' as TypeHemophilie,
  severite: 'Sévère' as SeveriteHemophilie,
  taux_facteur: '',
  date_diagnostic: '',
  ethnie: '',
  centre_id: '',
  adresse: '',
  telephone: '',
  email: '',
  circonstances_decouverte: '',
  presence_inhibiteurs: false,
  traitement_domicile: false,
};

export default function PatientsPage() {
  const router = useRouter();
  const { profile } = useUser();
  const userRole = (profile?.role || 'pharmacien') as Role;
  const canCreate = hasPermission(userRole, 'patients', 'create');
  const canUpdate = hasPermission(userRole, 'patients', 'update');
  const canDelete = hasPermission(userRole, 'patients', 'delete');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TypeHemophilie | ''>('');
  const [filterSeverite, setFilterSeverite] = useState<SeveriteHemophilie | ''>('');
  const [filterStatut, setFilterStatut] = useState<StatutPatient | ''>('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [patientsData, centresData] = await Promise.all([
        getPatients(),
        getCentres(),
      ]);
      setPatients(patientsData as Patient[]);
      setCentres(centresData as Centre[]);
    } catch (error) {
      console.error('Erreur lors du chargement des donnees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = patients.filter(p => {
    const matchSearch = !search ||
      `${p.nom} ${p.prenom} ${p.numero_cth} ${p.numero_wbdr}`.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || p.type_hemophilie === filterType;
    const matchSeverite = !filterSeverite || p.severite === filterSeverite;
    const matchStatut = !filterStatut || p.statut === filterStatut;
    return matchSearch && matchType && matchSeverite && matchStatut;
  });

  const selected = selectedPatient ? patients.find(p => p.id === selectedPatient) : null;

  // --- Open create modal ---
  const openCreateModal = () => {
    setEditingPatient(null);
    setFormData({
      ...emptyForm,
      centre_id: centres.length > 0 ? centres[0].id : '',
    });
    setShowForm(true);
  };

  // --- Open edit modal ---
  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      numero_cth: patient.numero_cth || '',
      numero_wbdr: patient.numero_wbdr || '',
      nom: patient.nom || '',
      prenom: patient.prenom || '',
      date_naissance: patient.date_naissance ? patient.date_naissance.split('T')[0] : '',
      sexe: patient.sexe || 'M',
      poids: patient.poids ? String(patient.poids) : '',
      groupe_sanguin: patient.groupe_sanguin || '',
      type_hemophilie: patient.type_hemophilie || 'HA',
      severite: patient.severite || 'Sévère',
      taux_facteur: patient.taux_facteur || '',
      date_diagnostic: patient.date_diagnostic ? patient.date_diagnostic.split('T')[0] : '',
      ethnie: patient.ethnie || '',
      centre_id: patient.centre_id || '',
      adresse: patient.adresse || '',
      telephone: patient.telephone || '',
      email: patient.email || '',
      circonstances_decouverte: patient.circonstances_decouverte || '',
      presence_inhibiteurs: patient.presence_inhibiteurs || false,
      traitement_domicile: patient.traitement_domicile || false,
    });
    setShowForm(true);
  };

  // --- Submit create or edit ---
  const handleSubmit = async () => {
    if (!formData.nom || !formData.prenom || !formData.date_naissance || !formData.numero_cth) {
      showToast('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        numero_cth: formData.numero_cth,
        numero_wbdr: formData.numero_wbdr || null,
        nom: formData.nom,
        prenom: formData.prenom,
        date_naissance: formData.date_naissance,
        sexe: formData.sexe,
        poids: formData.poids ? parseFloat(formData.poids) : null,
        groupe_sanguin: formData.groupe_sanguin || null,
        type_hemophilie: formData.type_hemophilie,
        severite: formData.severite,
        taux_facteur: formData.taux_facteur || null,
        date_diagnostic: formData.date_diagnostic || null,
        ethnie: formData.ethnie || null,
        centre_id: formData.centre_id || (centres.length > 0 ? centres[0].id : null),
        adresse: formData.adresse || null,
        telephone: formData.telephone || null,
        email: formData.email || null,
        circonstances_decouverte: formData.circonstances_decouverte || null,
        presence_inhibiteurs: formData.presence_inhibiteurs,
        traitement_domicile: formData.traitement_domicile,
      };

      if (editingPatient) {
        await updatePatient(editingPatient.id, payload);
        showToast('Patient modifie avec succes.', 'success');
      } else {
        await createPatient(payload);
        showToast('Patient cree avec succes.', 'success');
      }

      setShowForm(false);
      setEditingPatient(null);
      setLoading(true);
      await fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      showToast(`Erreur: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Delete patient ---
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deletePatient(deleteConfirm.id);
      showToast('Patient supprime avec succes.', 'success');
      setDeleteConfirm(null);
      if (selectedPatient === deleteConfirm.id) setSelectedPatient(null);
      setLoading(true);
      await fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      showToast(`Erreur: ${msg}`, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // --- Form field helper ---
  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Navbar titre="Gestion des patients" />
      <main className="p-4 md:p-6">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle size={18} weight="duotone" /> : <Warning size={18} weight="duotone" />}
            {toast.message}
          </div>
        )}

        {/* En-tete stats rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {loading ? (
            <>
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </>
          ) : (
            <>
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
                  <p className="text-xs text-[var(--text-muted)]">Hemophilie A</p>
                </div>
              </div>
              <div className="glass-card !p-4 flex items-center gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Heartbeat size={22} weight="duotone" className="text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{patients.filter(p => p.type_hemophilie === 'HB').length}</p>
                  <p className="text-xs text-[var(--text-muted)]">Hemophilie B</p>
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
            </>
          )}
        </div>

        {/* Barre d'actions */}
        <div className="glass-card !p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px] md:min-w-[240px]">
              <MagnifyingGlass size={16} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Rechercher par nom, N CTH, N WBDR..."
                className="glass-input w-full pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="glass-select" value={filterType} onChange={e => setFilterType(e.target.value as TypeHemophilie | '')}>
              <option value="">Type d&apos;hemophilie</option>
              <option value="HA">Hemophilie A (FVIII)</option>
              <option value="HB">Hemophilie B (FIX)</option>
            </select>
            <select className="glass-select" value={filterSeverite} onChange={e => setFilterSeverite(e.target.value as SeveriteHemophilie | '')}>
              <option value="">Severite</option>
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
            {canCreate && (
              <button className="btn btn-primary" onClick={openCreateModal}>
                <Plus size={16} weight="bold" />
                Nouveau patient
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Table patients */}
          <div className={`glass-card !p-0 overflow-hidden ${selected ? 'flex-1' : 'w-full'}`}>
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>N CTH</th>
                    <th>N WBDR</th>
                    <th>Nom et Prenom</th>
                    <th>Type</th>
                    <th>Severite</th>
                    <th>Age</th>
                    <th>Poids</th>
                    <th>GS</th>
                    <th>Statut</th>
                    <th>Centre</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : (
                    filtered.map(patient => (
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
                            {patient.type_hemophilie === 'HA' ? 'Hemo. A' : 'Hemo. B'}
                          </span>
                        </td>
                        <td><span className={`badge ${severiteBadge[patient.severite] || ''}`}>{patient.severite}</span></td>
                        <td className="text-sm">{calculateAge(patient.date_naissance)}</td>
                        <td className="text-sm">{patient.poids ? `${patient.poids} kg` : '-'}</td>
                        <td className="text-sm font-medium">{patient.groupe_sanguin || '-'}</td>
                        <td><span className={`badge ${statutBadge[patient.statut] || ''}`}>{patient.statut}</span></td>
                        <td className="text-xs">{patient.centre?.nom || '-'}</td>
                        <td>
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                              title="Voir la fiche"
                              onClick={() => setSelectedPatient(patient.id)}
                            >
                              <Eye size={16} weight="duotone" />
                            </button>
                            {canUpdate && (
                              <button
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"
                                title="Modifier"
                                onClick={() => openEditModal(patient)}
                              >
                                <PencilSimple size={16} weight="duotone" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                                title="Supprimer"
                                onClick={() => setDeleteConfirm(patient)}
                              >
                                <Trash size={16} weight="duotone" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">{filtered.length} patient{filtered.length > 1 ? 's' : ''} trouve{filtered.length > 1 ? 's' : ''}</p>
              <button className="btn btn-glass btn-sm">
                <DownloadSimple size={14} weight="duotone" />
                Exporter
              </button>
            </div>
          </div>

          {/* Panel detail patient */}
          {selected && (
            <div className="glass-card w-full lg:w-[380px] flex-shrink-0 animate-slide-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[var(--text-primary)]">Fiche Patient</h3>
                <button onClick={() => setSelectedPatient(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">&times;</button>
              </div>

              {/* En-tete patient */}
              <div className="text-center mb-5 pb-5 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl font-bold">{selected.prenom[0]}{selected.nom[0]}</span>
                </div>
                <h4 className="font-bold text-lg text-[var(--text-primary)]">{selected.nom} {selected.prenom}</h4>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className={`badge ${selected.type_hemophilie === 'HA' ? 'badge-secondary' : 'badge-accent'}`}>
                    {selected.type_hemophilie === 'HA' ? 'Hemophilie A' : 'Hemophilie B'}
                  </span>
                  <span className={`badge ${severiteBadge[selected.severite] || ''}`}>{selected.severite}</span>
                  <span className={`badge ${statutBadge[selected.statut] || ''}`}>{selected.statut}</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">N CTH</span><span className="font-semibold">{selected.numero_cth}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">N WBDR</span><span className="font-mono">{selected.numero_wbdr}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Date de naissance</span><span>{new Date(selected.date_naissance).toLocaleDateString('fr-FR')}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Age</span><span className="font-semibold">{calculateAge(selected.date_naissance)}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Poids</span><span>{selected.poids ? `${selected.poids} kg` : 'Non renseigne'}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Groupe sanguin</span><span className="font-bold text-[var(--secondary)]">{selected.groupe_sanguin || 'Non renseigne'}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Taux de facteur</span><span className="font-semibold">{selected.taux_facteur || 'Non renseigne'}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Inhibiteurs</span><span className={selected.presence_inhibiteurs ? 'text-red-600 font-bold' : ''}>{selected.presence_inhibiteurs ? 'Oui' : 'Non'}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Traitement a domicile</span><span>{selected.traitement_domicile ? 'Oui' : 'Non'}</span></div>
                {selected.date_diagnostic && <div className="flex justify-between"><span className="text-[var(--text-muted)]">Date de diagnostic</span><span>{new Date(selected.date_diagnostic).toLocaleDateString('fr-FR')}</span></div>}
                {selected.circonstances_decouverte && <div><span className="text-[var(--text-muted)] block mb-1">Circonstances de decouverte</span><span className="text-xs">{selected.circonstances_decouverte}</span></div>}
                {selected.adresse && <div><span className="text-[var(--text-muted)] block mb-1">Adresse</span><span className="text-xs">{selected.adresse}</span></div>}
                {selected.telephone && <div className="flex justify-between"><span className="text-[var(--text-muted)]">Telephone</span><span className="text-xs">{selected.telephone}</span></div>}
                {selected.observations && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/50">
                    <span className="text-xs font-semibold text-amber-700">Observations</span>
                    <p className="text-xs text-amber-800 mt-1">{selected.observations}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2">
                {(canCreate || userRole === 'medecin' || userRole === 'administrateur') && (
                  <button
                    className="btn btn-primary btn-sm flex-1"
                    onClick={() => router.push(`/dashboard/prescriptions?patient_id=${selected.id}`)}
                  >
                    <ClipboardText size={14} weight="duotone" />
                    Prescrire
                  </button>
                )}
                <button className="btn btn-glass btn-sm flex-1">
                  <Eye size={14} weight="duotone" />
                  Historique
                </button>
                {canUpdate && (
                  <button
                    className="btn btn-glass btn-sm"
                    onClick={() => openEditModal(selected)}
                  >
                    <PencilSimple size={14} weight="duotone" />
                  </button>
                )}
                {canDelete && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setDeleteConfirm(selected)}
                  >
                    <Trash size={14} weight="duotone" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Create / Edit Patient */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingPatient(null); }}>
            <div className="glass-card w-full max-w-3xl max-h-[85vh] overflow-y-auto !bg-white/90" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-5">
                {editingPatient ? 'Modifier le patient' : 'Nouveau patient'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">N CTH *</label>
                  <input type="text" className="glass-input w-full" placeholder="Ex : 102A" value={formData.numero_cth} onChange={e => updateField('numero_cth', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">N WBDR</label>
                  <input type="text" className="glass-input w-full" placeholder="Identifiant WFH" value={formData.numero_wbdr} onChange={e => updateField('numero_wbdr', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Nom *</label>
                  <input type="text" className="glass-input w-full" placeholder="Nom de famille" value={formData.nom} onChange={e => updateField('nom', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Prenom *</label>
                  <input type="text" className="glass-input w-full" placeholder="Prenom(s)" value={formData.prenom} onChange={e => updateField('prenom', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Date de naissance *</label>
                  <input type="date" className="glass-input w-full" value={formData.date_naissance} onChange={e => updateField('date_naissance', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Sexe *</label>
                  <select className="glass-select w-full" value={formData.sexe} onChange={e => updateField('sexe', e.target.value)}>
                    <option value="M">Masculin</option>
                    <option value="F">Feminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Poids (kg)</label>
                  <input type="number" className="glass-input w-full" placeholder="Poids en kg" value={formData.poids} onChange={e => updateField('poids', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Groupe sanguin</label>
                  <select className="glass-select w-full" value={formData.groupe_sanguin} onChange={e => updateField('groupe_sanguin', e.target.value)}>
                    <option value="">Selectionner</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(gs => <option key={gs} value={gs}>{gs}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Type d&apos;hemophilie *</label>
                  <select className="glass-select w-full" value={formData.type_hemophilie} onChange={e => updateField('type_hemophilie', e.target.value)}>
                    <option value="HA">Hemophilie A (deficit FVIII)</option>
                    <option value="HB">Hemophilie B (deficit FIX)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Severite *</label>
                  <select className="glass-select w-full" value={formData.severite} onChange={e => updateField('severite', e.target.value)}>
                    <option value="Sévère">Sévère (&lt;1% facteur)</option>
                    <option value="Modérée">Modérée (1-5% facteur)</option>
                    <option value="Mineure">Mineure (5-40% facteur)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Taux de facteur</label>
                  <input type="text" className="glass-input w-full" placeholder="Ex : <1%, 0.015, 0.05" value={formData.taux_facteur} onChange={e => updateField('taux_facteur', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Date de diagnostic</label>
                  <input type="date" className="glass-input w-full" value={formData.date_diagnostic} onChange={e => updateField('date_diagnostic', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Origine ethnique</label>
                  <select className="glass-select w-full" value={formData.ethnie} onChange={e => updateField('ethnie', e.target.value)}>
                    <option value="">Selectionner</option>
                    {ETHNIES_MADAGASCAR.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Centre de rattachement *</label>
                  <select className="glass-select w-full" value={formData.centre_id} onChange={e => updateField('centre_id', e.target.value)}>
                    {centres.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Adresse</label>
                  <input type="text" className="glass-input w-full" placeholder="Adresse complete" value={formData.adresse} onChange={e => updateField('adresse', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Telephone</label>
                  <input type="tel" className="glass-input w-full" placeholder="034 XX XXX XX" value={formData.telephone} onChange={e => updateField('telephone', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email</label>
                  <input type="email" className="glass-input w-full" placeholder="email@exemple.com" value={formData.email} onChange={e => updateField('email', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Circonstances de decouverte de la maladie</label>
                  <textarea className="glass-input w-full h-20 resize-none" placeholder="Ex : hemorragie labiale post-morsure, hemorragie post-circoncision..." value={formData.circonstances_decouverte} onChange={e => updateField('circonstances_decouverte', e.target.value)} />
                </div>
                <div className="md:col-span-2 flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="w-4 h-4 rounded" checked={formData.presence_inhibiteurs} onChange={e => updateField('presence_inhibiteurs', e.target.checked)} />
                    Presence d&apos;inhibiteurs
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="w-4 h-4 rounded" checked={formData.traitement_domicile} onChange={e => updateField('traitement_domicile', e.target.checked)} />
                    Traitement a domicile
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button className="btn btn-glass" onClick={() => { setShowForm(false); setEditingPatient(null); }}>Annuler</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enregistrement...
                    </span>
                  ) : (
                    <>
                      <Plus size={16} weight="bold" />
                      {editingPatient ? 'Modifier le patient' : 'Enregistrer le patient'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <div className="glass-card w-full max-w-md !bg-white/95" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <Warning size={22} weight="duotone" className="text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Confirmer la suppression</h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Voulez-vous vraiment supprimer le patient <strong>{deleteConfirm.nom} {deleteConfirm.prenom}</strong> (N CTH : {deleteConfirm.numero_cth}) ? Cette action est reversible par un administrateur.
              </p>
              <div className="flex justify-end gap-3">
                <button className="btn btn-glass" onClick={() => setDeleteConfirm(null)}>Annuler</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Suppression...
                    </span>
                  ) : (
                    <>
                      <Trash size={16} weight="duotone" />
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
