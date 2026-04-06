'use client';

import Navbar from '@/components/layout/Navbar';
import { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlass, Plus, Package, Warning, Clock, Eye, SortAscending,
  PencilSimple, Trash, ArrowCounterClockwise, X, FloppyDisk, CheckCircle,
  XCircle,
} from '@phosphor-icons/react';
import { getLots, getMedicaments, getCentres, createLot, updateLot, deleteLot, restoreLot } from '@/app/actions/stock';
import { useUser } from '@/contexts/UserContext';
import { hasPermission } from '@/lib/rbac';
import type { Role } from '@/lib/rbac';

function joursAvantExpiration(dateExp: string): number {
  return Math.ceil((new Date(dateExp).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getExpirationBadge(jours: number) {
  if (jours <= 0) return { class: 'badge-danger', text: 'Expiré' };
  if (jours <= 90) return { class: 'badge-warning', text: `${jours}j restants` };
  if (jours <= 180) return { class: 'badge-info', text: `${jours}j restants` };
  return { class: 'badge-success', text: `${jours}j restants` };
}

function getStockBadge(qty: number) {
  if (qty === 0) return { class: 'badge-danger', text: 'Épuisé' };
  if (qty <= 10) return { class: 'badge-warning', text: 'Stock faible' };
  return { class: 'badge-success', text: 'En stock' };
}

interface LotFormData {
  medicament_id: string;
  numero_lot: string;
  quantite_initiale: number;
  quantite_restante: number;
  quantite_recue: number;
  date_fabrication: string;
  date_expiration: string;
  date_livraison: string;
  centre_id: string;
  fournisseur: string;
  numero_commande: string;
}

const emptyForm: LotFormData = {
  medicament_id: '',
  numero_lot: '',
  quantite_initiale: 0,
  quantite_restante: 0,
  quantite_recue: 0,
  date_fabrication: '',
  date_expiration: '',
  date_livraison: new Date().toISOString().split('T')[0],
  centre_id: '',
  fournisseur: '',
  numero_commande: '',
};

export default function StockPage() {
  const { profile, isAdmin, isMedecin } = useUser();
  const role = (profile?.role || 'medecin') as Role;

  const canCreate = hasPermission(role, 'lots', 'create');
  const canUpdate = hasPermission(role, 'lots', 'update');
  const canDelete = hasPermission(role, 'lots', 'delete');
  const canSeeDeleted = hasPermission(role, 'lots', 'read_deleted');

  const [search, setSearch] = useState('');
  const [filterCentre, setFilterCentre] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState<'expiration' | 'stock' | 'nom'>('expiration');
  const [showDeleted, setShowDeleted] = useState(false);

  const [lotsData, setLotsData] = useState<Awaited<ReturnType<typeof getLots>>>([]);
  const [medsData, setMedsData] = useState<Awaited<ReturnType<typeof getMedicaments>>>([]);
  const [centresData, setCentresData] = useState<Awaited<ReturnType<typeof getCentres>>>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LotFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [lotsResult, medsResult, centresResult] = await Promise.all([
        getLots({ include_deleted: showDeleted && canSeeDeleted }),
        getMedicaments(),
        getCentres(),
      ]);
      setLotsData(lotsResult);
      setMedsData(medsResult);
      setCentresData(centresResult);
    } catch (err) {
      console.error('Erreur chargement stock:', err);
    } finally {
      setLoading(false);
    }
  }, [showDeleted, canSeeDeleted]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Form helpers ---
  function openCreateModal() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      centre_id: profile?.centre_id || '',
    });
    setModalOpen(true);
  }

  function openEditModal(lot: (typeof lotsData)[0]) {
    setEditingId(lot.id);
    setForm({
      medicament_id: lot.medicament_id,
      numero_lot: lot.numero_lot,
      quantite_initiale: lot.quantite_initiale ?? lot.quantite_recue,
      quantite_restante: lot.quantite_restante,
      quantite_recue: lot.quantite_recue,
      date_fabrication: lot.date_fabrication ? lot.date_fabrication.split('T')[0] : '',
      date_expiration: lot.date_expiration ? lot.date_expiration.split('T')[0] : '',
      date_livraison: lot.date_livraison ? lot.date_livraison.split('T')[0] : '',
      centre_id: lot.centre_id,
      fournisseur: lot.fournisseur || '',
      numero_commande: lot.numero_commande || '',
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function updateField<K extends keyof LotFormData>(key: K, value: LotFormData[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      // When creating, keep quantite_restante and quantite_recue in sync with quantite_initiale
      if (!editingId && key === 'quantite_initiale') {
        next.quantite_restante = value as number;
        next.quantite_recue = value as number;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        medicament_id: form.medicament_id,
        numero_lot: form.numero_lot,
        quantite_initiale: form.quantite_initiale,
        quantite_restante: form.quantite_restante,
        quantite_recue: form.quantite_recue,
        date_fabrication: form.date_fabrication || null,
        date_expiration: form.date_expiration,
        date_livraison: form.date_livraison,
        centre_id: form.centre_id,
        fournisseur: form.fournisseur || null,
        numero_commande: form.numero_commande || null,
      };

      if (editingId) {
        await updateLot(editingId, payload);
        showToast('success', 'Lot modifié avec succès');
      } else {
        await createLot(payload);
        showToast('success', 'Lot créé avec succès');
      }
      closeModal();
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      showToast('error', message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteLot(id);
      showToast('success', 'Lot supprimé');
      setDeleteConfirmId(null);
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      showToast('error', message);
    }
  }

  async function handleRestore(id: string) {
    try {
      await restoreLot(id);
      showToast('success', 'Lot restauré');
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la restauration';
      showToast('error', message);
    }
  }

  // --- Filtering & sorting ---
  const enrichedLots = lotsData.map(lot => {
    const jours = joursAvantExpiration(lot.date_expiration);
    const fullCentre = centresData.find(c => c.id === lot.centre_id);
    return {
      ...lot,
      jours_avant_expiration: jours,
      _centre_ville: fullCentre?.ville || lot.centre?.nom || '-',
    };
  });

  const filtered = enrichedLots.filter(lot => {
    const matchSearch = !search ||
      `${lot.medicament?.nom_complet} ${lot.numero_lot} ${lot.numero_commande}`.toLowerCase().includes(search.toLowerCase());
    const matchCentre = !filterCentre || lot.centre_id === filterCentre;
    const matchType = !filterType || lot.medicament?.type_facteur === filterType;
    return matchSearch && matchCentre && matchType;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'expiration') return a.jours_avant_expiration - b.jours_avant_expiration;
    if (sortBy === 'stock') return a.quantite_restante - b.quantite_restante;
    return (a.medicament?.nom_complet || '').localeCompare(b.medicament?.nom_complet || '');
  });

  const totalUnites = filtered.reduce((s, l) => s + l.quantite_restante, 0);
  const alertesExp = filtered.filter(l => l.jours_avant_expiration <= 90 && l.jours_avant_expiration > 0).length;
  const expires = filtered.filter(l => l.jours_avant_expiration <= 0).length;
  const stockFaible = filtered.filter(l => l.quantite_restante <= 10 && l.quantite_restante > 0).length;

  return (
    <>
      <Navbar titre="Gestion du stock" />
      <main className="p-4 md:p-6">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.type === 'success' ? <CheckCircle size={18} weight="duotone" /> : <XCircle size={18} weight="duotone" />}
            {toast.message}
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X size={14} /></button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card !p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-6 bg-gray-200 rounded w-16" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass-card !p-4 animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-full" />
            </div>
            <div className="glass-card !p-0 animate-pulse">
              <div className="h-64 bg-gray-200 rounded" />
            </div>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
              <div className="glass-card !p-4 flex items-center gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Package size={22} weight="duotone" className="text-emerald-600" /></div>
                <div><p className="text-2xl font-bold">{totalUnites.toLocaleString('fr-FR')}</p><p className="text-xs text-[var(--text-muted)]">Unités en stock</p></div>
              </div>
              <div className="glass-card !p-4 flex items-center gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Package size={22} weight="duotone" className="text-blue-600" /></div>
                <div><p className="text-2xl font-bold">{filtered.length}</p><p className="text-xs text-[var(--text-muted)]">Lots actifs</p></div>
              </div>
              <div className="glass-card !p-4 flex items-center gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Clock size={22} weight="duotone" className="text-amber-600" /></div>
                <div><p className="text-2xl font-bold text-amber-600">{alertesExp}</p><p className="text-xs text-[var(--text-muted)]">Expiration proche (&lt;90j)</p></div>
              </div>
              <div className="glass-card !p-4 flex items-center gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><Warning size={22} weight="duotone" className="text-red-600" /></div>
                <div><p className="text-2xl font-bold text-red-600">{stockFaible + expires}</p><p className="text-xs text-[var(--text-muted)]">Stock faible / Expiré</p></div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="glass-card !p-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px] md:min-w-[240px]">
                  <MagnifyingGlass size={16} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input type="text" placeholder="Rechercher un médicament, n° de lot..." className="glass-input w-full pl-10" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="glass-select" value={filterCentre} onChange={e => setFilterCentre(e.target.value)}>
                  <option value="">Tous les centres</option>
                  {centresData.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
                <select className="glass-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">Type de facteur</option>
                  <option value="FVIII">Facteur VIII</option>
                  <option value="FIX">Facteur IX</option>
                  <option value="Emicizumab">Emicizumab</option>
                  <option value="Bypassing">Agents bypassing</option>
                </select>
                <button className="btn btn-glass btn-sm" onClick={() => setSortBy(sortBy === 'expiration' ? 'stock' : sortBy === 'stock' ? 'nom' : 'expiration')}>
                  <SortAscending size={14} weight="duotone" />
                  {sortBy === 'expiration' ? 'FEFO' : sortBy === 'stock' ? 'Stock' : 'Nom'}
                </button>
                {canSeeDeleted && (
                  <button
                    className={`btn btn-glass btn-sm ${showDeleted ? '!bg-amber-100 !text-amber-700' : ''}`}
                    onClick={() => setShowDeleted(prev => !prev)}
                  >
                    <Trash size={14} weight="duotone" />
                    {showDeleted ? 'Masquer supprimés' : 'Voir supprimés'}
                  </button>
                )}
                {canCreate && (
                  <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={16} weight="bold" />Réception de lot
                  </button>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                <strong>FEFO</strong> (First Expiry, First Out) : les lots les plus proches de l&apos;expiration sont affichés en premier pour être dispensés en priorité.
              </p>
            </div>

            {/* Table */}
            <div className="glass-card !p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Médicament</th><th>Dosage</th><th>Type</th><th>N° de lot</th>
                      <th>N° commande</th><th>Centre</th><th>Qté reçue</th><th>Qté restante</th>
                      <th>Livraison</th><th>Expiration</th><th>Statut</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-8 text-[var(--text-muted)]">
                          Aucun lot trouvé
                        </td>
                      </tr>
                    ) : sorted.map(lot => {
                      const expBadge = getExpirationBadge(lot.jours_avant_expiration);
                      const stockBadge = getStockBadge(lot.quantite_restante);
                      const pctRestant = lot.quantite_recue > 0 ? (lot.quantite_restante / lot.quantite_recue) * 100 : 0;
                      const isDeleted = !!(lot as Record<string, unknown>).deleted_at;

                      return (
                        <tr
                          key={lot.id}
                          className={
                            isDeleted
                              ? '!bg-gray-100/50 opacity-60'
                              : lot.jours_avant_expiration <= 0
                                ? '!bg-red-50/30'
                                : lot.jours_avant_expiration <= 90
                                  ? '!bg-amber-50/30'
                                  : ''
                          }
                        >
                          <td className="font-semibold">{lot.medicament?.nom || '-'}</td>
                          <td>{lot.medicament?.dosage} {lot.medicament?.unite}</td>
                          <td>
                            <span className={`badge ${lot.medicament?.type_facteur === 'FVIII' ? 'badge-secondary' : lot.medicament?.type_facteur === 'FIX' ? 'badge-accent' : 'badge-info'}`}>
                              {lot.medicament?.type_facteur}
                            </span>
                          </td>
                          <td className="font-mono text-xs">{lot.numero_lot}</td>
                          <td className="text-xs">{lot.numero_commande || '-'}</td>
                          <td className="text-xs">{lot._centre_ville}</td>
                          <td className="text-right">{lot.quantite_recue}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pctRestant}%`, backgroundColor: pctRestant <= 15 ? '#EF4444' : pctRestant <= 30 ? '#F59E0B' : '#10B981' }} />
                              </div>
                              <span className="font-bold text-sm">{lot.quantite_restante}</span>
                            </div>
                          </td>
                          <td className="text-xs">{new Date(lot.date_livraison).toLocaleDateString('fr-FR')}</td>
                          <td><span className={`badge ${expBadge.class}`}>{expBadge.text}</span></td>
                          <td>
                            {isDeleted
                              ? <span className="badge badge-danger">Supprimé</span>
                              : <span className={`badge ${stockBadge.class}`}>{stockBadge.text}</span>
                            }
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              {isDeleted && canSeeDeleted ? (
                                <button
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                                  title="Restaurer"
                                  onClick={() => handleRestore(lot.id)}
                                >
                                  <ArrowCounterClockwise size={16} weight="duotone" />
                                </button>
                              ) : (
                                <>
                                  <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Détails">
                                    <Eye size={16} weight="duotone" />
                                  </button>
                                  {canUpdate && (
                                    <button
                                      className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"
                                      title="Modifier"
                                      onClick={() => openEditModal(lot)}
                                    >
                                      <PencilSimple size={16} weight="duotone" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                                      title="Supprimer"
                                      onClick={() => setDeleteConfirmId(lot.id)}
                                    >
                                      <Trash size={16} weight="duotone" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ========= Create / Edit Modal ========= */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={closeModal}>
            <div className="glass-card w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {editingId ? 'Modifier le lot' : 'Réception de lot'}
                </h3>
                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={20} weight="bold" className="text-[var(--text-muted)]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Medicament */}
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Médicament *</label>
                  <select
                    className="glass-input w-full"
                    value={form.medicament_id}
                    onChange={e => updateField('medicament_id', e.target.value)}
                    required
                  >
                    <option value="">Sélectionner un médicament</option>
                    {medsData.map(m => (
                      <option key={m.id} value={m.id}>{m.nom_complet}</option>
                    ))}
                  </select>
                </div>

                {/* Numero lot + Numero commande */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">N° de lot *</label>
                    <input
                      type="text"
                      className="glass-input w-full"
                      value={form.numero_lot}
                      onChange={e => updateField('numero_lot', e.target.value)}
                      required
                      placeholder="Ex: LOT-2024-001"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">N° commande</label>
                    <input
                      type="text"
                      className="glass-input w-full"
                      value={form.numero_commande}
                      onChange={e => updateField('numero_commande', e.target.value)}
                      placeholder="Optionnel"
                    />
                  </div>
                </div>

                {/* Quantities */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Quantité initiale *</label>
                    <input
                      type="number"
                      className="glass-input w-full"
                      value={form.quantite_initiale || ''}
                      onChange={e => updateField('quantite_initiale', parseInt(e.target.value) || 0)}
                      required
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Quantité restante</label>
                    <input
                      type="number"
                      className="glass-input w-full"
                      value={form.quantite_restante || ''}
                      onChange={e => updateField('quantite_restante', parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Fabrication</label>
                    <input
                      type="date"
                      className="glass-input w-full"
                      value={form.date_fabrication}
                      onChange={e => updateField('date_fabrication', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Expiration *</label>
                    <input
                      type="date"
                      className="glass-input w-full"
                      value={form.date_expiration}
                      onChange={e => updateField('date_expiration', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Livraison</label>
                    <input
                      type="date"
                      className="glass-input w-full"
                      value={form.date_livraison}
                      onChange={e => updateField('date_livraison', e.target.value)}
                    />
                  </div>
                </div>

                {/* Centre */}
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Centre *</label>
                  <select
                    className="glass-input w-full"
                    value={form.centre_id}
                    onChange={e => updateField('centre_id', e.target.value)}
                    required
                  >
                    <option value="">Sélectionner un centre</option>
                    {centresData.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Fournisseur */}
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Fournisseur</label>
                  <input
                    type="text"
                    className="glass-input w-full"
                    value={form.fournisseur}
                    onChange={e => updateField('fournisseur', e.target.value)}
                    placeholder="Optionnel"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" className="btn btn-glass" onClick={closeModal}>Annuler</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enregistrement...
                      </span>
                    ) : (
                      <>
                        <FloppyDisk size={16} weight="duotone" />
                        {editingId ? 'Modifier' : 'Enregistrer'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========= Delete Confirmation Modal ========= */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}>
            <div className="glass-card w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <Trash size={28} weight="duotone" className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Supprimer ce lot ?</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  Le lot sera marqué comme supprimé. Un administrateur pourra le restaurer si nécessaire.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button className="btn btn-glass" onClick={() => setDeleteConfirmId(null)}>Annuler</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirmId)}>
                    <Trash size={16} weight="duotone" />Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
