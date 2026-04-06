'use client';

import Navbar from '@/components/layout/Navbar';
import { FileText, DownloadSimple, PaperPlaneTilt, Printer } from '@phosphor-icons/react';
import { centres, statistiques } from '@/lib/demo-data';
import { useState } from 'react';

export default function RapportsPage() {
  const [periode, setPeriode] = useState('mensuel');
  const [mois, setMois] = useState('2026-04');
  const [centreId, setCentreId] = useState('');

  return (
    <>
      <Navbar titre="Rapports" />
      <main className="p-6">
        <div className="glass-card mb-6">
          <h3 className="font-bold text-[var(--text-primary)] mb-4">Générer un rapport</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Type de rapport</label><select className="glass-select w-full" value={periode} onChange={e => setPeriode(e.target.value)}><option value="mensuel">Rapport mensuel</option><option value="trimestriel">Rapport trimestriel</option><option value="annuel">Rapport annuel</option><option value="stock">État du stock</option><option value="consommation">Consommation</option></select></div>
            <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Période</label><input type="month" className="glass-input w-full" value={mois} onChange={e => setMois(e.target.value)} /></div>
            <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Centre</label><select className="glass-select w-full" value={centreId} onChange={e => setCentreId(e.target.value)}><option value="">Tous les centres</option>{centres.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
            <div className="flex items-end gap-2">
              <button className="btn btn-primary flex-1"><FileText size={18} weight="duotone" />Générer PDF</button>
              <button className="btn btn-accent" title="Envoyer par email"><PaperPlaneTilt size={18} weight="duotone" /></button>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[var(--text-primary)]">Aperçu du rapport</h3>
            <div className="flex gap-2">
              <button className="btn btn-glass btn-sm"><Printer size={14} weight="duotone" />Imprimer</button>
              <button className="btn btn-primary btn-sm"><DownloadSimple size={14} weight="duotone" />Télécharger PDF</button>
              <button className="btn btn-accent btn-sm"><PaperPlaneTilt size={14} weight="duotone" />Envoyer à Dr Fitahiana</button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-inner border border-gray-100 max-w-4xl mx-auto">
            <div className="text-center border-b-2 border-[var(--primary)] pb-4 mb-6">
              <h1 className="text-xl font-bold text-[var(--primary)]">CENTRE DE TRAITEMENT DE L&apos;HÉMOPHILIE</h1>
              <h2 className="text-lg font-bold text-[var(--primary)]">MADAGASCAR</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2">Rapport {periode} — {new Date(mois + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
              <p className="text-xs text-[var(--text-muted)]">Destinataire : Dr Fitahiana • Généré le {new Date().toLocaleDateString('fr-FR')}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">1. Résumé des patients</h3>
              <table className="w-full text-sm"><tbody>
                <tr className="border-b border-gray-50"><td className="py-1.5 text-[var(--text-secondary)]">Total patients enregistrés</td><td className="py-1.5 font-bold text-right">{statistiques.total_patients}</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 text-[var(--text-secondary)]">Patients actifs</td><td className="py-1.5 font-bold text-right">{statistiques.patients_actifs}</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 text-[var(--text-secondary)]">Hémophilie A (FVIII)</td><td className="py-1.5 font-bold text-right">{statistiques.patients_hemophilie_a}</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 text-[var(--text-secondary)]">Hémophilie B (FIX)</td><td className="py-1.5 font-bold text-right">{statistiques.patients_hemophilie_b}</td></tr>
                <tr><td className="py-1.5 text-[var(--text-secondary)]">Patients décédés</td><td className="py-1.5 font-bold text-right text-red-600">{statistiques.patients_decedes}</td></tr>
              </tbody></table>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">2. État du stock par type de facteur</h3>
              <table className="w-full text-sm"><thead><tr className="bg-gray-50"><th className="py-2 px-3 text-left font-semibold text-xs">Type de facteur</th><th className="py-2 px-3 text-right font-semibold text-xs">Quantité en stock</th></tr></thead>
              <tbody>
                {statistiques.stock_par_type_facteur.map(item => (<tr key={item.type} className="border-b border-gray-50"><td className="py-1.5 px-3">{item.type}</td><td className="py-1.5 px-3 text-right font-bold">{item.quantite.toLocaleString('fr-FR')} unités</td></tr>))}
                <tr className="bg-gray-50 font-bold"><td className="py-2 px-3">Total</td><td className="py-2 px-3 text-right">{statistiques.stock_par_type_facteur.reduce((s, d) => s + d.quantite, 0).toLocaleString('fr-FR')} unités</td></tr>
              </tbody></table>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">3. Top 5 médicaments en stock</h3>
              <table className="w-full text-sm"><thead><tr className="bg-gray-50"><th className="py-2 px-3 text-left font-semibold text-xs">#</th><th className="py-2 px-3 text-left font-semibold text-xs">Médicament</th><th className="py-2 px-3 text-right font-semibold text-xs">Quantité restante</th></tr></thead>
              <tbody>{statistiques.top_medicaments.map((item, i) => (<tr key={item.nom} className="border-b border-gray-50"><td className="py-1.5 px-3 font-bold text-[var(--primary)]">{i + 1}</td><td className="py-1.5 px-3">{item.nom}</td><td className="py-1.5 px-3 text-right font-bold">{item.quantite}</td></tr>))}</tbody></table>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">4. Activité du mois</h3>
              <table className="w-full text-sm"><tbody>
                <tr className="border-b border-gray-50"><td className="py-1.5">Prescriptions émises</td><td className="py-1.5 font-bold text-right">{statistiques.prescriptions_mois}</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5">Dispensations effectuées</td><td className="py-1.5 font-bold text-right">{statistiques.dispensations_mois}</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5">Transferts inter-centres</td><td className="py-1.5 font-bold text-right">{statistiques.transferts_en_cours}</td></tr>
                <tr><td className="py-1.5">Alertes générées</td><td className="py-1.5 font-bold text-right text-amber-600">{statistiques.alertes_non_lues}</td></tr>
              </tbody></table>
            </div>

            <div className="border-t-2 border-[var(--primary)] pt-4 mt-8 text-center">
              <p className="text-xs text-[var(--text-muted)]">CTH Madagascar — Centre de Traitement de l&apos;Hémophilie de Madagascar</p>
              <p className="text-xs text-[var(--text-muted)]">Rapport généré automatiquement • Confidentiel</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
