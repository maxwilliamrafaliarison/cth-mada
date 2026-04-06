'use client';

import Navbar from '@/components/layout/Navbar';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowsLeftRight, Plus, ArrowRight, Clock, CheckCircle, Truck,
  Package, XCircle, X, Funnel, PaperPlaneTilt, Spinner, Trash,
  NotePencil, Eye,
} from '@phosphor-icons/react';
import { getTransferts, createTransfert, updateTransfertStatut } from '@/app/actions/transferts';
import { getCentres, getMedicaments } from '@/app/actions/stock';
import { useUser } from '@/contexts/UserContext';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LigneForm {
  medicament_id: string;
  quantite_demandee: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Transfert = any;
type Medicament = any;
type Centre = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ */
/*  Statut configuration                                               */
/* ------------------------------------------------------------------ */

const STATUTS = ['all', 'Demandé', 'Approuvé', 'En transit', 'Réceptionné', 'Refusé'] as const;

const statutConfig: Record<string, { icon: typeof Clock; class: string; color: string }> = {
  'Demandé':      { icon: Clock,       class: 'badge-warning', color: 'bg-amber-50' },
  'Approuvé':     { icon: CheckCircle, class: 'badge-info',    color: 'bg-blue-50' },
  'En transit':   { icon: Truck,       class: 'badge-accent',  color: 'bg-indigo-50' },
  'Réceptionné':  { icon: Package,     class: 'badge-success', color: 'bg-emerald-50' },
  'Refusé':       { icon: XCircle,     class: 'badge-danger',  color: 'bg-red-50' },
};

const statutLabels: Record<string, string> = {
  all:            'Tous les statuts',
  'Demandé':      'Demandé',
  'Approuvé':     'Approuvé',
  'En transit':   'En transit',
  'Réceptionné':  'Réceptionné',
  'Refusé':       'Refusé',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TransfertsPage() {
  const { profile, isAdmin, isPharmacien } = useUser();

  /* ---------- Data state ---------- */
  const [transfertsData, setTransfertsData] = useState<Transfert[]>([]);
  const [centresData, setCentresData]       = useState<Centre[]>([]);
  const [medsData, setMedsData]             = useState<Medicament[]>([]);
  const [loading, setLoading]               = useState(true);

  /* ---------- Filter ---------- */
  const [filterStatut, setFilterStatut] = useState<string>('all');

  /* ---------- Modal ---------- */
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ---------- Detail modal ---------- */
  const [detailTransfert, setDetailTransfert] = useState<Transfert | null>(null);

  /* ---------- Form ---------- */
  const [centreDestId, setCentreDestId] = useState('');
  const [motif, setMotif]               = useState('');
  const [lignes, setLignes]             = useState<LigneForm[]>([{ medicament_id: '', quantite_demandee: 1 }]);

  /* ---------- Toast ---------- */
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  /* ---------- Action loading per-transfert ---------- */
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  /* ---------------------------------------------------------------- */
  /*  Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  const fetchData = useCallback(async () => {
    try {
      const [trfResult, centresResult, medsResult] = await Promise.all([
        getTransferts({ statut: filterStatut }),
        getCentres(),
        getMedicaments(),
      ]);
      setTransfertsData(trfResult);
      setCentresData(centresResult);
      setMedsData(medsResult);
    } catch (err) {
      console.error('Erreur chargement transferts:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatut]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                          */
  /* ---------------------------------------------------------------- */

  const canApprove = isAdmin || isPharmacien;

  function resetForm() {
    setCentreDestId('');
    setMotif('');
    setLignes([{ medicament_id: '', quantite_demandee: 1 }]);
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    resetForm();
  }

  /* ---------- Lignes helpers ---------- */
  function addLigne() {
    setLignes(prev => [...prev, { medicament_id: '', quantite_demandee: 1 }]);
  }

  function removeLigne(idx: number) {
    setLignes(prev => prev.filter((_, i) => i !== idx));
  }

  function updateLigne(idx: number, field: keyof LigneForm, value: string | number) {
    setLignes(prev =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Actions                                                          */
  /* ---------------------------------------------------------------- */

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const validLignes = lignes.filter(l => l.medicament_id && l.quantite_demandee > 0);
    if (!centreDestId || validLignes.length === 0) {
      showToast('error', 'Veuillez remplir le centre destination et au moins une ligne.');
      return;
    }

    setSubmitting(true);
    try {
      await createTransfert(
        {
          centre_source_id: profile?.centre_id,
          centre_destination_id: centreDestId,
          motif: motif || null,
          date_demande: new Date().toISOString().split('T')[0],
        },
        validLignes.map(l => ({
          medicament_id: l.medicament_id,
          quantite_demandee: l.quantite_demandee,
        })),
      );
      showToast('success', 'Demande de transfert créée avec succès.');
      closeModal();
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      showToast('error', message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatutChange(id: string, statut: string) {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await updateTransfertStatut(id, statut);
      showToast('success', `Transfert mis à jour : ${statut}`);
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      showToast('error', message);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Loading skeleton                                         */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <>
        <Navbar titre="Transferts inter-centres" />
        <main className="p-4 md:p-6">
          <div className="glass-card !p-4 mb-6 animate-pulse">
            <div className="flex items-center justify-between gap-3">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-10 bg-gray-200 rounded w-48" />
            </div>
          </div>
          <div className="glass-card !p-3 mb-6 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-60" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="flex gap-3">
                      <div className="h-14 bg-gray-200 rounded w-40" />
                      <div className="h-14 bg-gray-200 rounded w-40" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                  <div className="w-28 space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-8 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      <Navbar titre="Transferts inter-centres" />
      <main className="p-4 md:p-6">
        {/* ========= Toast ========= */}
        {toast && (
          <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={18} weight="duotone" /> : <XCircle size={18} weight="duotone" />}
            {toast.message}
          </div>
        )}

        {/* ========= Header ========= */}
        <div className="glass-card !p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Les centres provinciaux demandent l&apos;approvisionnement au <strong>CTH Antananarivo (centre central)</strong>. Le stock est déduit du centre source à l&apos;expédition.
            </p>
            <button onClick={openCreateModal} className="btn btn-primary flex-shrink-0">
              <Plus size={16} weight="bold" />
              Demande de transfert
            </button>
          </div>
        </div>

        {/* ========= Filter bar ========= */}
        <div className="glass-card !p-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Funnel size={18} weight="duotone" className="text-[var(--text-muted)]" />
            <select
              className="glass-select text-sm"
              value={filterStatut}
              onChange={e => { setFilterStatut(e.target.value); setLoading(true); }}
            >
              {STATUTS.map(s => (
                <option key={s} value={s}>{statutLabels[s]}</option>
              ))}
            </select>
            <span className="text-xs text-[var(--text-muted)] ml-auto">
              {transfertsData.length} transfert{transfertsData.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ========= List ========= */}
        {transfertsData.length === 0 ? (
          <div className="glass-card text-center py-12">
            <ArrowsLeftRight size={48} weight="duotone" className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-[var(--text-muted)]">Aucun transfert trouvé</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transfertsData.map((trf: Transfert) => {
              const source = trf.centre_source;
              const dest   = trf.centre_destination;
              const config = statutConfig[trf.statut] || statutConfig['Demandé'];
              const StatusIcon = config.icon;
              const isLoading = actionLoading[trf.id];

              return (
                <div
                  key={trf.id}
                  className={`glass-card ${config.color} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
                      <ArrowsLeftRight size={24} weight="duotone" className="text-[var(--primary)]" />
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-xs text-[var(--text-muted)]">{trf.numero}</span>
                        <span className={`badge ${config.class}`}>
                          <StatusIcon size={12} weight="duotone" />
                          {trf.statut}
                        </span>
                        {trf.demandeur && (
                          <span className="text-xs text-[var(--text-muted)]">
                            par {trf.demandeur.prenom} {trf.demandeur.nom}
                          </span>
                        )}
                      </div>

                      {/* Source -> Dest */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
                        <div className="px-3 py-2 rounded-lg bg-white/50 border border-gray-100">
                          <p className="text-xs text-[var(--text-muted)]">De</p>
                          <p className="font-bold text-sm text-[var(--text-primary)]">{source?.nom}</p>
                        </div>
                        <ArrowRight size={20} weight="bold" className="text-[var(--text-muted)] hidden sm:block" />
                        <div className="px-3 py-2 rounded-lg bg-white/50 border border-gray-100">
                          <p className="text-xs text-[var(--text-muted)]">Vers</p>
                          <p className="font-bold text-sm text-[var(--text-primary)]">{dest?.nom}</p>
                        </div>
                      </div>

                      {/* Lignes preview (max 3) */}
                      <div className="space-y-1">
                        {trf.lignes?.slice(0, 3).map((ligne: any) => (
                          <div key={ligne.id} className="flex items-center gap-2 text-sm">
                            <Package size={14} weight="duotone" className="text-[var(--accent)]" />
                            <span className="font-medium">{ligne.medicament?.nom_complet}</span>
                            <span className="text-[var(--text-muted)]">&middot;</span>
                            <span>Demandé : <strong>{ligne.quantite_demandee}</strong></span>
                          </div>
                        ))}
                        {(trf.lignes?.length || 0) > 3 && (
                          <p className="text-xs text-[var(--text-muted)]">+ {trf.lignes.length - 3} autre(s)</p>
                        )}
                      </div>

                      {trf.motif && (
                        <p className="text-xs text-[var(--text-muted)] mt-2 italic">{trf.motif}</p>
                      )}
                    </div>

                    {/* Right side: date + actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(trf.date_demande).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>

                      {/* Detail button */}
                      <button
                        onClick={() => setDetailTransfert(trf)}
                        className="btn btn-ghost btn-sm"
                      >
                        <Eye size={14} weight="duotone" /> Détails
                      </button>

                      {/* Status actions */}
                      {isLoading ? (
                        <Spinner size={20} className="animate-spin text-[var(--primary)]" />
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {trf.statut === 'Demandé' && canApprove && (
                            <>
                              <button
                                onClick={() => handleStatutChange(trf.id, 'Approuvé')}
                                className="btn btn-success btn-sm"
                              >
                                <CheckCircle size={14} weight="duotone" /> Approuver
                              </button>
                              <button
                                onClick={() => handleStatutChange(trf.id, 'Refusé')}
                                className="btn btn-danger btn-sm"
                              >
                                <XCircle size={14} weight="duotone" /> Refuser
                              </button>
                            </>
                          )}
                          {trf.statut === 'Approuvé' && canApprove && (
                            <button
                              onClick={() => handleStatutChange(trf.id, 'En transit')}
                              className="btn btn-accent btn-sm"
                            >
                              <Truck size={14} weight="duotone" /> Expédier
                            </button>
                          )}
                          {trf.statut === 'En transit' && (
                            <button
                              onClick={() => handleStatutChange(trf.id, 'Réceptionné')}
                              className="btn btn-success btn-sm"
                            >
                              <Package size={14} weight="duotone" /> Réceptionner
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========= Create Modal ========= */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center glass-modal-overlay" onClick={closeModal}>
            <div
              className="glass-modal w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Nouvelle demande de transfert
                </h3>
                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={20} weight="bold" className="text-[var(--text-muted)]" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                {/* Centre source (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Centre source
                  </label>
                  <input
                    type="text"
                    className="glass-input w-full bg-gray-50 cursor-not-allowed"
                    value={profile?.centre?.nom || centresData.find((c: Centre) => c.id === profile?.centre_id)?.nom || ''}
                    readOnly
                  />
                </div>

                {/* Centre destination */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Centre destination <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="glass-select w-full"
                    value={centreDestId}
                    onChange={e => setCentreDestId(e.target.value)}
                    required
                  >
                    <option value="">-- Sélectionner un centre --</option>
                    {centresData
                      .filter((c: Centre) => c.id !== profile?.centre_id)
                      .map((c: Centre) => (
                        <option key={c.id} value={c.id}>{c.nom} ({c.code})</option>
                      ))}
                  </select>
                </div>

                {/* Motif */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Motif
                  </label>
                  <textarea
                    className="glass-input w-full"
                    rows={2}
                    placeholder="Raison de la demande..."
                    value={motif}
                    onChange={e => setMotif(e.target.value)}
                  />
                </div>

                {/* Lignes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">
                      Médicaments demandés <span className="text-red-400">*</span>
                    </label>
                    <button type="button" onClick={addLigne} className="btn btn-ghost btn-sm">
                      <Plus size={14} weight="bold" /> Ajouter
                    </button>
                  </div>

                  <div className="space-y-3">
                    {lignes.map((ligne, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-white/40 border border-gray-100">
                        <div className="flex-1">
                          <select
                            className="glass-select w-full text-sm"
                            value={ligne.medicament_id}
                            onChange={e => updateLigne(idx, 'medicament_id', e.target.value)}
                            required
                          >
                            <option value="">-- Médicament --</option>
                            {medsData.map((m: Medicament) => (
                              <option key={m.id} value={m.id}>{m.nom_complet}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            min={1}
                            className="glass-input w-full text-sm text-center"
                            placeholder="Qté"
                            value={ligne.quantite_demandee}
                            onChange={e => updateLigne(idx, 'quantite_demandee', parseInt(e.target.value) || 1)}
                            required
                          />
                        </div>
                        {lignes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLigne(idx)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash size={16} weight="duotone" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn btn-ghost">
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <><Spinner size={16} className="animate-spin" /> Envoi...</>
                    ) : (
                      <><PaperPlaneTilt size={16} weight="duotone" /> Envoyer la demande</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========= Detail Modal ========= */}
        {detailTransfert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center glass-modal-overlay" onClick={() => setDetailTransfert(null)}>
            <div
              className="glass-modal w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    Détails du transfert
                  </h3>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{detailTransfert.numero}</span>
                </div>
                <button onClick={() => setDetailTransfert(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={20} weight="bold" className="text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-white/50 border border-gray-100">
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Statut</p>
                  <span className={`badge ${(statutConfig[detailTransfert.statut] || statutConfig['Demandé']).class}`}>
                    {detailTransfert.statut}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white/50 border border-gray-100">
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Date</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(detailTransfert.date_demande).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/50 border border-gray-100">
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Centre source</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{detailTransfert.centre_source?.nom}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/50 border border-gray-100">
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Centre destination</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{detailTransfert.centre_destination?.nom}</p>
                </div>
                {detailTransfert.demandeur && (
                  <div className="p-3 rounded-lg bg-white/50 border border-gray-100 col-span-2">
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Demandeur</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {detailTransfert.demandeur.prenom} {detailTransfert.demandeur.nom}
                    </p>
                  </div>
                )}
              </div>

              {/* Motif */}
              {detailTransfert.motif && (
                <div className="mb-6 p-3 rounded-lg bg-white/50 border border-gray-100">
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Motif</p>
                  <p className="text-sm text-[var(--text-primary)]">{detailTransfert.motif}</p>
                </div>
              )}

              {/* Lines table */}
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Médicaments</p>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/40">
                        <th className="text-left p-2 text-xs font-medium text-[var(--text-muted)]">Médicament</th>
                        <th className="text-right p-2 text-xs font-medium text-[var(--text-muted)]">Qté demandée</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailTransfert.lignes?.map((ligne: any) => (
                        <tr key={ligne.id} className="border-t border-gray-100">
                          <td className="p-2 font-medium text-[var(--text-primary)]">{ligne.medicament?.nom_complet}</td>
                          <td className="p-2 text-right">{ligne.quantite_demandee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Close */}
              <div className="flex justify-end mt-6">
                <button onClick={() => setDetailTransfert(null)} className="btn btn-ghost">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
