'use client';

import Navbar from '@/components/layout/Navbar';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClipboardText, Plus, MagnifyingGlass, Clock, CheckCircle, XCircle, UserCircle, Pill, Warning, Package } from '@phosphor-icons/react';
import { getPrescriptions, createPrescription, updatePrescriptionStatut } from '@/app/actions/prescriptions';
import { getPatients } from '@/app/actions/patients';
import { getMedicaments, getLots } from '@/app/actions/stock';
import { useUser } from '@/contexts/UserContext';
import { hasPermission } from '@/lib/rbac';
import type { Role } from '@/lib/rbac';
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

interface LigneForm {
  medicament_id: string;
  quantite_prescrite: number;
  posologie: string;
}

export default function PrescriptionsPageWrapper() {
  return (
    <Suspense fallback={
      <>
        <Navbar titre="Prescriptions medicales" />
        <main className="p-4 md:p-6">
          <div className="glass-card !p-4 mb-6 animate-pulse">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-10 bg-gray-200 rounded-lg flex-1 min-w-[180px]" />
              <div className="h-10 bg-gray-200 rounded-lg w-40" />
              <div className="h-10 bg-gray-200 rounded-lg w-48" />
            </div>
          </div>
        </main>
      </>
    }>
      <PrescriptionsPage />
    </Suspense>
  );
}

function PrescriptionsPage() {
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patient_id') || '';

  const { profile } = useUser();
  const userRole = (profile?.role || 'pharmacien') as Role;
  const canCreatePrescription = hasPermission(userRole, 'prescriptions', 'create');
  const canConfirm = hasPermission(userRole, 'prescriptions', 'confirm');

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [prescriptionsData, setPrescriptionsData] = useState<any[]>([]);
  const [patientsData, setPatientsData] = useState<any[]>([]);
  const [medicamentsData, setMedicamentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Form state
  const [formPatientId, setFormPatientId] = useState('');
  const [formTypeTraitement, setFormTypeTraitement] = useState('Demande');
  const [formTypeSaignement, setFormTypeSaignement] = useState('');
  const [formPrecisions, setFormPrecisions] = useState('');
  const [formUrgence, setFormUrgence] = useState(false);
  const [formLignes, setFormLignes] = useState<LigneForm[]>([{ medicament_id: '', quantite_prescrite: 0, posologie: '' }]);

  // Stock availability per medicament
  const [stockInfo, setStockInfo] = useState<Record<string, number>>({});
  const [stockLoading, setStockLoading] = useState<Record<string, boolean>>({});

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [rxData, patData, medData] = await Promise.all([
        getPrescriptions(),
        getPatients({ statut: 'Actif' }),
        getMedicaments(),
      ]);
      setPrescriptionsData(rxData);
      setPatientsData(patData);
      setMedicamentsData(medData);
    } catch (err) {
      console.error('Erreur chargement prescriptions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-open form if patient_id in URL
  useEffect(() => {
    if (preselectedPatientId && !loading && patientsData.length > 0) {
      setFormPatientId(preselectedPatientId);
      setShowForm(true);
    }
  }, [preselectedPatientId, loading, patientsData]);

  // Check stock when medicament changes in a ligne
  const checkStock = async (medicamentId: string) => {
    if (!medicamentId || stockInfo[medicamentId] !== undefined) return;
    setStockLoading(prev => ({ ...prev, [medicamentId]: true }));
    try {
      const lots = await getLots({ medicament_id: medicamentId });
      const totalStock = (lots as any[]).reduce((sum: number, lot: any) => {
        // Only count non-expired, active lots
        const isExpired = new Date(lot.date_expiration) < new Date();
        if (!isExpired && lot.actif) {
          return sum + (lot.quantite_restante || 0);
        }
        return sum;
      }, 0);
      setStockInfo(prev => ({ ...prev, [medicamentId]: totalStock }));
    } catch {
      setStockInfo(prev => ({ ...prev, [medicamentId]: -1 }));
    } finally {
      setStockLoading(prev => ({ ...prev, [medicamentId]: false }));
    }
  };

  const updateLigne = (index: number, field: keyof LigneForm, value: string | number) => {
    setFormLignes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'medicament_id' && typeof value === 'string') {
        checkStock(value);
      }
      return updated;
    });
  };

  const addLigne = () => {
    setFormLignes(prev => [...prev, { medicament_id: '', quantite_prescrite: 0, posologie: '' }]);
  };

  const removeLigne = (index: number) => {
    if (formLignes.length <= 1) return;
    setFormLignes(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormPatientId('');
    setFormTypeTraitement('Demande');
    setFormTypeSaignement('');
    setFormPrecisions('');
    setFormUrgence(false);
    setFormLignes([{ medicament_id: '', quantite_prescrite: 0, posologie: '' }]);
    setStockInfo({});
  };

  // --- Submit prescription ---
  const handleSubmit = async () => {
    if (!formPatientId) {
      showToast('Veuillez selectionner un patient.', 'error');
      return;
    }
    const validLignes = formLignes.filter(l => l.medicament_id && l.quantite_prescrite > 0);
    if (validLignes.length === 0) {
      showToast('Ajoutez au moins un medicament avec une quantite.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Find patient to get centre_id
      const patient = patientsData.find((p: any) => p.id === formPatientId);
      const prescriptionData: Record<string, unknown> = {
        patient_id: formPatientId,
        centre_id: patient?.centre_id || profile?.centre_id,
        type_traitement: formTypeTraitement,
        type_saignement: formTypeSaignement || null,
        autres_precisions: formPrecisions || null,
        urgence: formUrgence,
        date_prescription: new Date().toISOString(),
        statut: 'En attente',
      };

      const lignes = validLignes.map(l => ({
        medicament_id: l.medicament_id,
        quantite_prescrite: l.quantite_prescrite,
        posologie: l.posologie || null,
      }));

      await createPrescription(prescriptionData, lignes);
      showToast('Prescription creee avec succes.', 'success');
      setShowForm(false);
      resetForm();
      setLoading(true);
      await fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      showToast(`Erreur: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Confirm / Dispense prescription ---
  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      await updatePrescriptionStatut(id, 'Dispensée');
      showToast('Prescription dispensee avec succes.', 'success');
      setLoading(true);
      await fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      showToast(`Erreur: ${msg}`, 'error');
    } finally {
      setConfirmingId(null);
    }
  };

  const filtered = prescriptionsData.filter(rx => {
    const patient = rx.patient;
    const matchSearch = !search ||
      `${patient?.nom} ${patient?.prenom} ${rx.numero}`.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || rx.statut === filterStatut;
    return matchSearch && matchStatut;
  }).sort((a, b) => new Date(b.date_prescription).getTime() - new Date(a.date_prescription).getTime());

  if (loading) {
    return (
      <>
        <Navbar titre="Prescriptions medicales" />
        <main className="p-4 md:p-6">
          <div className="glass-card !p-4 mb-6 animate-pulse">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-10 bg-gray-200 rounded-lg flex-1 min-w-[180px]" />
              <div className="h-10 bg-gray-200 rounded-lg w-40" />
              <div className="h-10 bg-gray-200 rounded-lg w-48" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-8 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="w-24 space-y-2">
                    <div className="h-6 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar titre="Prescriptions medicales" />
      <main className="p-4 md:p-6">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fade-in ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle size={18} weight="duotone" /> : <Warning size={18} weight="duotone" />}
            {toast.message}
          </div>
        )}

        <div className="glass-card !p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px] md:min-w-[240px]">
              <MagnifyingGlass size={16} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" placeholder="Rechercher une prescription..." className="glass-input w-full pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="glass-select" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="En attente">En attente</option>
              <option value="Dispensée">Dispensée</option>
              <option value="Annulée">Annulée</option>
            </select>
            {canCreatePrescription && (
              <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus size={16} weight="bold" />
                Nouvelle prescription
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="glass-card text-center py-12">
            <ClipboardText size={48} weight="duotone" className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)]">Aucune prescription trouvee</p>
          </div>
        )}

        <div className="space-y-4">
          {filtered.map(rx => {
            const patient = rx.patient;
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
                      <span className="font-mono text-xs">{rx.numero}</span> &bull; {rx.type_traitement} &bull; {rx.type_saignement || 'Non specifie'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {rx.lignes?.map((ligne: any) => (
                        <div key={ligne.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/50 border border-gray-100">
                          <Pill size={14} weight="duotone" className="text-[var(--accent)]" />
                          <span className="text-sm font-medium">{ligne.medicament?.nom_complet}</span>
                          <span className="text-xs text-[var(--text-muted)]">&times; {ligne.quantite_prescrite}</span>
                        </div>
                      ))}
                    </div>
                    {rx.autres_precisions && <p className="text-xs text-[var(--text-muted)] italic">{rx.autres_precisions}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge ${config.class}`}><StatusIcon size={14} weight="duotone" />{rx.statut}</span>
                    <p className="text-xs text-[var(--text-muted)] mt-2">{new Date(rx.date_prescription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    {rx.medecin && <p className="text-xs text-[var(--text-muted)]">Dr {rx.medecin.nom}</p>}
                    {rx.statut === 'En attente' && canConfirm && (
                      <button
                        className="btn btn-success btn-sm mt-3"
                        onClick={(e) => { e.stopPropagation(); handleConfirm(rx.id); }}
                        disabled={confirmingId === rx.id}
                      >
                        {confirmingId === rx.id ? (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Confirmation...
                          </span>
                        ) : (
                          <>
                            <CheckCircle size={14} weight="duotone" />
                            Dispenser
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Nouvelle Prescription */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => { setShowForm(false); resetForm(); }}>
            <div className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto !bg-white/90" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-5">Nouvelle prescription</h3>
              <div className="space-y-4">
                {/* Patient */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Patient *</label>
                  <select className="glass-select w-full" value={formPatientId} onChange={e => setFormPatientId(e.target.value)}>
                    <option value="">Selectionner un patient</option>
                    {patientsData.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.numero_cth} - {p.nom} {p.prenom} ({p.type_hemophilie === 'HA' ? 'Hemo. A' : 'Hemo. B'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type traitement + saignement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Type de traitement *</label>
                    <select className="glass-select w-full" value={formTypeTraitement} onChange={e => setFormTypeTraitement(e.target.value)}>
                      <option value="Demande">A la demande (episode aigu)</option>
                      <option value="Prophylaxie">Prophylaxie</option>
                      <option value="Pré-opératoire">Pré-opératoire</option>
                      <option value="Post-opératoire">Post-opératoire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Type de saignement aigu</label>
                    <select className="glass-select w-full" value={formTypeSaignement} onChange={e => setFormTypeSaignement(e.target.value)}>
                      <option value="">Non applicable</option>
                      {TYPES_SAIGNEMENT.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Lignes de prescription (medicaments) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Medicaments prescrits *</label>
                    <button type="button" className="btn btn-glass btn-sm" onClick={addLigne}>
                      <Plus size={14} weight="bold" />
                      Ajouter
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formLignes.map((ligne, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white/50 border border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--text-muted)]">Medicament {idx + 1}</span>
                          {formLignes.length > 1 && (
                            <button type="button" className="text-red-500 hover:text-red-700 text-xs" onClick={() => removeLigne(idx)}>Retirer</button>
                          )}
                        </div>
                        <select
                          className="glass-select w-full"
                          value={ligne.medicament_id}
                          onChange={e => updateLigne(idx, 'medicament_id', e.target.value)}
                        >
                          <option value="">Selectionner un medicament</option>
                          {medicamentsData.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.nom_complet} ({m.type_facteur} - {m.indication})</option>
                          ))}
                        </select>

                        {/* Stock availability indicator */}
                        {ligne.medicament_id && (
                          <div className="flex items-center gap-2 text-xs">
                            <Package size={14} weight="duotone" />
                            {stockLoading[ligne.medicament_id] ? (
                              <span className="text-[var(--text-muted)]">Verification du stock...</span>
                            ) : stockInfo[ligne.medicament_id] !== undefined ? (
                              stockInfo[ligne.medicament_id] > 0 ? (
                                <span className="text-emerald-600 font-semibold">{stockInfo[ligne.medicament_id]} unites disponibles</span>
                              ) : (
                                <span className="text-red-600 font-semibold">Stock insuffisant</span>
                              )
                            ) : null}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-[var(--text-muted)] mb-1">Quantite (UI/mg) *</label>
                            <input
                              type="number"
                              className="glass-input w-full"
                              placeholder="Ex : 1000"
                              value={ligne.quantite_prescrite || ''}
                              onChange={e => updateLigne(idx, 'quantite_prescrite', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-[var(--text-muted)] mb-1">Posologie</label>
                            <input
                              type="text"
                              className="glass-input w-full"
                              placeholder="Ex : 500 UI x 2/jour"
                              value={ligne.posologie}
                              onChange={e => updateLigne(idx, 'posologie', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Warning if requested > available */}
                        {ligne.medicament_id && ligne.quantite_prescrite > 0 && stockInfo[ligne.medicament_id] !== undefined && ligne.quantite_prescrite > stockInfo[ligne.medicament_id] && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                            <Warning size={14} weight="duotone" />
                            Quantite prescrite superieure au stock disponible ({stockInfo[ligne.medicament_id]} unites)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Precisions */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Precisions complementaires</label>
                  <textarea className="glass-input w-full h-20 resize-none" placeholder="Description chirurgie, remarques..." value={formPrecisions} onChange={e => setFormPrecisions(e.target.value)} />
                </div>

                {/* Urgence */}
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={formUrgence} onChange={e => setFormUrgence(e.target.checked)} />
                  <span className="font-medium text-red-600">Prescription urgente</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button className="btn btn-glass" onClick={() => { setShowForm(false); resetForm(); }}>Annuler</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creation...
                    </span>
                  ) : (
                    <>
                      <ClipboardText size={16} weight="duotone" />
                      Creer la prescription
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
