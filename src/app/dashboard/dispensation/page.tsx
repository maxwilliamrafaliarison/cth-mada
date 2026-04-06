'use client';

import Navbar from '@/components/layout/Navbar';
import { useState, useEffect, useCallback } from 'react';
import {
  Pill, UserCircle, Package, CheckCircle, Clock, X, XCircle, Warning,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { getPrescriptions, updatePrescriptionStatut } from '@/app/actions/prescriptions';
import { getLots, updateLot } from '@/app/actions/stock';
import { useUser } from '@/contexts/UserContext';
import { hasPermission } from '@/lib/rbac';
import type { Role } from '@/lib/rbac';

interface LotSelection {
  lot_id: string;
  numero_lot: string;
  quantite_restante: number;
  date_expiration: string;
  quantite_a_deduire: number;
}

export default function DispensationPage() {
  const { profile } = useUser();
  const role = (profile?.role || 'medecin') as Role;

  const canDispense = hasPermission(role, 'dispensations', 'create');

  const [prescriptionsData, setPrescriptionsData] = useState<any[]>([]);
  const [lotsData, setLotsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispensation modal
  const [dispensingRx, setDispensingRx] = useState<any | null>(null);
  const [lotSelections, setLotSelections] = useState<Record<string, LotSelection[]>>({});
  const [dispensing, setDispensing] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search
  const [search, setSearch] = useState('');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [rxData, lotData] = await Promise.all([
        getPrescriptions(),
        getLots(),
      ]);
      setPrescriptionsData(rxData);
      setLotsData(lotData);
    } catch (err) {
      console.error('Erreur chargement dispensation:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Helpers ---
  function getAvailableLots(medicament_id: string) {
    return lotsData
      .filter(l => l.medicament_id === medicament_id && l.quantite_restante > 0 && !l.deleted_at)
      .sort((a, b) => new Date(a.date_expiration).getTime() - new Date(b.date_expiration).getTime());
  }

  function getTotalAvailable(medicament_id: string): number {
    return getAvailableLots(medicament_id).reduce((sum, l) => sum + l.quantite_restante, 0);
  }

  // Open dispensation modal and pre-select lots with FEFO
  function openDispenseModal(rx: any) {
    const selections: Record<string, LotSelection[]> = {};

    for (const ligne of (rx.lignes || [])) {
      const lots = getAvailableLots(ligne.medicament_id);
      let remaining = ligne.quantite_prescrite;
      const picks: LotSelection[] = [];

      for (const lot of lots) {
        if (remaining <= 0) break;
        const qty = Math.min(remaining, lot.quantite_restante);
        picks.push({
          lot_id: lot.id,
          numero_lot: lot.numero_lot,
          quantite_restante: lot.quantite_restante,
          date_expiration: lot.date_expiration,
          quantite_a_deduire: qty,
        });
        remaining -= qty;
      }

      selections[ligne.id] = picks;
    }

    setLotSelections(selections);
    setDispensingRx(rx);
  }

  function updateLotQty(ligneId: string, lotIndex: number, newQty: number) {
    setLotSelections(prev => {
      const updated = { ...prev };
      const picks = [...(updated[ligneId] || [])];
      if (picks[lotIndex]) {
        picks[lotIndex] = {
          ...picks[lotIndex],
          quantite_a_deduire: Math.max(0, Math.min(newQty, picks[lotIndex].quantite_restante)),
        };
      }
      updated[ligneId] = picks;
      return updated;
    });
  }

  async function handleDispense() {
    if (!dispensingRx || dispensing) return;
    setDispensing(true);

    try {
      // 1. For each ligne, decrement lot stock
      for (const ligne of (dispensingRx.lignes || [])) {
        const picks = lotSelections[ligne.id] || [];
        for (const pick of picks) {
          if (pick.quantite_a_deduire > 0) {
            const newQty = pick.quantite_restante - pick.quantite_a_deduire;
            await updateLot(pick.lot_id, { quantite_restante: newQty });
          }
        }
      }

      // 2. Update prescription status
      await updatePrescriptionStatut(dispensingRx.id, 'Dispensée');

      showToast('success', `Prescription dispensée pour ${dispensingRx.patient?.nom} ${dispensingRx.patient?.prenom}`);
      setDispensingRx(null);
      setLotSelections({});
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la dispensation';
      showToast('error', message);
    } finally {
      setDispensing(false);
    }
  }

  // --- Data ---
  const enAttente = prescriptionsData
    .filter(rx => rx.statut === 'En attente')
    .filter(rx => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        `${rx.patient?.nom} ${rx.patient?.prenom}`.toLowerCase().includes(q) ||
        rx.patient?.numero_cth?.toLowerCase().includes(q) ||
        rx.numero?.toLowerCase().includes(q)
      );
    });

  const dispensees = prescriptionsData.filter(rx => rx.statut === 'Dispensée').slice(0, 10);

  if (loading) {
    return (
      <>
        <Navbar titre="Dispensation" />
        <main className="p-4 md:p-6">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-64 animate-pulse" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0 hidden sm:block" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-12 bg-gray-200 rounded w-full" />
                    </div>
                    <div className="w-28 space-y-2">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-10 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
            <div className="glass-card !p-0 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar titre="Dispensation" />
      <main className="p-4 md:p-6">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.type === 'success' ? <CheckCircle size={18} weight="duotone" /> : <XCircle size={18} weight="duotone" />}
            {toast.message}
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X size={14} /></button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="glass-card !p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={22} weight="duotone" className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{enAttente.length}</p>
              <p className="text-xs text-[var(--text-muted)]">En attente</p>
            </div>
          </div>
          <div className="glass-card !p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={22} weight="duotone" className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{prescriptionsData.filter(rx => rx.statut === 'Dispensée').length}</p>
              <p className="text-xs text-[var(--text-muted)]">Dispensées</p>
            </div>
          </div>
          <div className="glass-card !p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package size={22} weight="duotone" className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lotsData.filter(l => l.quantite_restante > 0 && !l.deleted_at).length}</p>
              <p className="text-xs text-[var(--text-muted)]">Lots disponibles</p>
            </div>
          </div>
          <div className="glass-card !p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Warning size={22} weight="duotone" className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {enAttente.filter(rx =>
                  (rx.lignes || []).some((l: any) => getTotalAvailable(l.medicament_id) < l.quantite_prescrite)
                ).length}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Stock insuffisant</p>
            </div>
          </div>
        </div>

        {/* Pending prescriptions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400 pulse-alert" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">En attente de dispensation ({enAttente.length})</h3>
            </div>
            <div className="relative flex-1 max-w-xs">
              <MagnifyingGlass size={14} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Rechercher patient..."
                className="glass-input w-full pl-9 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {enAttente.length === 0 ? (
            <div className="glass-card text-center py-8">
              <CheckCircle size={48} weight="duotone" className="text-emerald-400 mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] font-medium">Aucune prescription en attente</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Toutes les prescriptions ont été dispensées</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enAttente.map(rx => {
                const patient = rx.patient;
                return (
                  <div key={rx.id} className={`glass-card ${rx.urgence ? '!border-red-300 !bg-red-50/40' : ''} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}>
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 hidden sm:flex ${rx.urgence ? 'bg-red-100' : 'bg-blue-50'}`}>
                        <UserCircle size={32} weight="duotone" className={rx.urgence ? 'text-red-600' : 'text-blue-600'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-lg font-bold text-[var(--text-primary)]">{patient?.nom} {patient?.prenom}</h4>
                          <span className={`badge ${patient?.type_hemophilie === 'HA' ? 'badge-secondary' : 'badge-accent'}`}>
                            {patient?.numero_cth} - {patient?.type_hemophilie === 'HA' ? 'Hémophilie A' : 'Hémophilie B'}
                          </span>
                          {rx.urgence && <span className="badge badge-danger pulse-alert">URGENT</span>}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-3">
                          Prescrit par {rx.medecin ? `Dr ${rx.medecin.nom} ${rx.medecin.prenom}` : 'Médecin inconnu'} -- {rx.type_traitement} {rx.type_saignement ? `-- ${rx.type_saignement}` : ''}
                        </p>
                        <div className="space-y-2">
                          {rx.lignes?.map((ligne: any) => {
                            const med = ligne.medicament;
                            const totalAvailable = getTotalAvailable(ligne.medicament_id);
                            const insufficient = totalAvailable < ligne.quantite_prescrite;
                            const lotsDisponibles = getAvailableLots(ligne.medicament_id);
                            const lotSuggere = lotsDisponibles[0];

                            return (
                              <div key={ligne.id} className={`flex items-center gap-4 p-3 rounded-xl border ${insufficient ? 'bg-red-50/50 border-red-200' : 'bg-white/50 border-gray-100'}`}>
                                <Pill size={22} weight="duotone" className="text-[var(--accent)] flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm">{med?.nom_complet}</p>
                                    {insufficient && (
                                      <span className="badge badge-danger text-[0.6rem] !px-1.5 !py-0.5">
                                        <Warning size={10} weight="duotone" />
                                        Stock insuffisant
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[var(--text-muted)]">
                                    Quantité prescrite : <strong>{ligne.quantite_prescrite}</strong>
                                    {ligne.posologie && ` -- ${ligne.posologie}`}
                                    {' '} -- Dispo : <strong className={insufficient ? 'text-red-600' : 'text-emerald-600'}>{totalAvailable}</strong>
                                  </p>
                                </div>
                                {lotSuggere && (
                                  <div className="text-right hidden md:block">
                                    <p className="text-xs text-[var(--text-muted)]">Lot suggéré (FEFO)</p>
                                    <p className="text-sm font-mono font-bold text-[var(--primary)]">{lotSuggere.numero_lot}</p>
                                    <p className="text-[0.65rem] text-[var(--text-muted)]">
                                      Reste : {lotSuggere.quantite_restante} -- Exp. : {new Date(lotSuggere.date_expiration).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-[var(--text-muted)] mb-2">
                          {new Date(rx.date_prescription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        </p>
                        {canDispense && (
                          <button
                            className="btn btn-success"
                            onClick={() => openDispenseModal(rx)}
                          >
                            <CheckCircle size={18} weight="duotone" />Dispenser
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent dispensations */}
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Dispensations récentes</h3>
          <div className="glass-card !p-0 overflow-hidden">
            <table className="glass-table">
              <thead>
                <tr><th>Date</th><th>Patient</th><th>Médicament</th><th>Quantité</th><th>N° Lot</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {dispensees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-[var(--text-muted)]">
                      Aucune dispensation récente
                    </td>
                  </tr>
                ) : dispensees.map(rx => {
                  const patient = rx.patient;
                  return rx.lignes?.map((ligne: any) => {
                    const med = ligne.medicament;
                    return (
                      <tr key={ligne.id}>
                        <td className="text-sm">{new Date(rx.date_prescription).toLocaleDateString('fr-FR')}</td>
                        <td className="font-semibold text-sm">{patient?.nom} {patient?.prenom}</td>
                        <td className="text-sm">{med?.nom_complet}</td>
                        <td className="font-bold">{ligne.quantite_dispensee || ligne.quantite_prescrite}</td>
                        <td className="font-mono text-xs">{ligne.lot_numero || '-'}</td>
                        <td><span className="badge badge-success"><CheckCircle size={12} weight="duotone" />Dispensé</span></td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========= Dispensation Confirmation Modal ========= */}
        {dispensingRx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { if (!dispensing) setDispensingRx(null); }}>
            <div className="glass-card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Confirmer la dispensation</h3>
                <button onClick={() => { if (!dispensing) setDispensingRx(null); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={20} weight="bold" className="text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Patient info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100 mb-4">
                <UserCircle size={28} weight="duotone" className="text-blue-600" />
                <div>
                  <p className="font-bold text-[var(--text-primary)]">{dispensingRx.patient?.nom} {dispensingRx.patient?.prenom}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {dispensingRx.patient?.numero_cth} -- {dispensingRx.type_traitement}
                    {dispensingRx.medecin && ` -- Dr ${dispensingRx.medecin.nom}`}
                  </p>
                </div>
              </div>

              {/* Lines with lot selection */}
              <div className="space-y-4 mb-6">
                {(dispensingRx.lignes || []).map((ligne: any) => {
                  const med = ligne.medicament;
                  const picks = lotSelections[ligne.id] || [];
                  const totalDeducted = picks.reduce((sum, p) => sum + p.quantite_a_deduire, 0);
                  const totalAvailable = getTotalAvailable(ligne.medicament_id);
                  const insufficient = totalAvailable < ligne.quantite_prescrite;

                  return (
                    <div key={ligne.id} className="p-4 rounded-xl bg-white/60 border border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Pill size={20} weight="duotone" className="text-[var(--accent)]" />
                        <p className="font-bold text-sm">{med?.nom_complet}</p>
                        <span className="text-xs text-[var(--text-muted)]">-- Prescrit : <strong>{ligne.quantite_prescrite}</strong></span>
                        {insufficient && (
                          <span className="badge badge-danger text-[0.6rem] !px-1.5 !py-0.5">
                            <Warning size={10} weight="duotone" />
                            Stock insuffisant
                          </span>
                        )}
                      </div>

                      {picks.length === 0 ? (
                        <p className="text-sm text-red-500 font-medium">Aucun lot disponible pour ce médicament</p>
                      ) : (
                        <div className="space-y-2">
                          {picks.map((pick, idx) => (
                            <div key={pick.lot_id} className="flex items-center gap-3 text-sm">
                              <span className="font-mono text-xs text-[var(--primary)] min-w-[100px]">{pick.numero_lot}</span>
                              <span className="text-xs text-[var(--text-muted)]">
                                Dispo : {pick.quantite_restante} -- Exp : {new Date(pick.date_expiration).toLocaleDateString('fr-FR')}
                              </span>
                              <div className="flex items-center gap-1 ml-auto">
                                <label className="text-xs text-[var(--text-muted)]">Qté :</label>
                                <input
                                  type="number"
                                  className="glass-input !w-20 text-center text-sm !py-1"
                                  value={pick.quantite_a_deduire}
                                  onChange={e => updateLotQty(ligne.id, idx, parseInt(e.target.value) || 0)}
                                  min={0}
                                  max={pick.quantite_restante}
                                />
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-end pt-1 border-t border-gray-100">
                            <span className={`text-sm font-bold ${totalDeducted >= ligne.quantite_prescrite ? 'text-emerald-600' : 'text-amber-600'}`}>
                              Total : {totalDeducted} / {ligne.quantite_prescrite}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  className="btn btn-glass"
                  onClick={() => setDispensingRx(null)}
                  disabled={dispensing}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleDispense}
                  disabled={dispensing}
                >
                  {dispensing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Dispensation en cours...
                    </span>
                  ) : (
                    <>
                      <CheckCircle size={18} weight="duotone" />
                      Confirmer la dispensation
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
