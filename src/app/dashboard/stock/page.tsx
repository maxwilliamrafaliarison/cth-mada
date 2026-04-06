'use client';

import Navbar from '@/components/layout/Navbar';
import { useState, useEffect } from 'react';
import { MagnifyingGlass, Plus, Package, Warning, Clock, Eye, SortAscending } from '@phosphor-icons/react';
import { getLots, getMedicaments, getCentres } from '@/app/actions/stock';

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

export default function StockPage() {
  const [search, setSearch] = useState('');
  const [filterCentre, setFilterCentre] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState<'expiration' | 'stock' | 'nom'>('expiration');

  const [lotsData, setLotsData] = useState<Awaited<ReturnType<typeof getLots>>>([]);
  const [centresData, setCentresData] = useState<Awaited<ReturnType<typeof getCentres>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [lotsResult, centresResult] = await Promise.all([
          getLots(),
          getCentres(),
        ]);
        setLotsData(lotsResult);
        setCentresData(centresResult);
      } catch (err) {
        console.error('Erreur chargement stock:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
                <button className="btn btn-primary"><Plus size={16} weight="bold" />Réception de lot</button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                <strong>FEFO</strong> (First Expiry, First Out) : les lots les plus proches de l&apos;expiration sont affichés en premier pour être dispensés en priorité.
              </p>
            </div>

            <div className="glass-card !p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="glass-table">
                  <thead><tr><th>Médicament</th><th>Dosage</th><th>Type</th><th>N° de lot</th><th>N° commande</th><th>Centre</th><th>Qté reçue</th><th>Qté restante</th><th>Livraison</th><th>Expiration</th><th>Statut</th><th>Actions</th></tr></thead>
                  <tbody>
                    {sorted.map(lot => {
                      const expBadge = getExpirationBadge(lot.jours_avant_expiration);
                      const stockBadge = getStockBadge(lot.quantite_restante);
                      const pctRestant = lot.quantite_recue > 0 ? (lot.quantite_restante / lot.quantite_recue) * 100 : 0;
                      return (
                        <tr key={lot.id} className={lot.jours_avant_expiration <= 90 ? '!bg-amber-50/30' : lot.jours_avant_expiration <= 0 ? '!bg-red-50/30' : ''}>
                          <td className="font-semibold">{lot.medicament?.nom || '-'}</td>
                          <td>{lot.medicament?.dosage} {lot.medicament?.unite}</td>
                          <td><span className={`badge ${lot.medicament?.type_facteur === 'FVIII' ? 'badge-secondary' : lot.medicament?.type_facteur === 'FIX' ? 'badge-accent' : 'badge-info'}`}>{lot.medicament?.type_facteur}</span></td>
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
                          <td><span className={`badge ${stockBadge.class}`}>{stockBadge.text}</span></td>
                          <td><button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Détails"><Eye size={16} weight="duotone" /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
