'use client';

import Navbar from '@/components/layout/Navbar';
import {
  FileText,
  DownloadSimple,
  PaperPlaneTilt,
  Printer,
  Users,
  Package,
  Pill,
  ChartBar,
  Buildings,
  Warning,
  CalendarBlank,
  EnvelopeSimple,
} from '@phosphor-icons/react';
import { getReportData } from '@/app/actions/rapports';
import { getCentres } from '@/app/actions/stock';
import { useState, useEffect, useRef } from 'react';

type ReportData = Awaited<ReturnType<typeof getReportData>>;
type Centre = Awaited<ReturnType<typeof getCentres>>[number];

function niveauColor(niveau: string) {
  switch (niveau) {
    case 'critique': return '#dc2626';
    case 'urgent': return '#ea580c';
    case 'attention': return '#d97706';
    default: return '#2563eb';
  }
}

function niveauLabel(niveau: string) {
  switch (niveau) {
    case 'critique': return 'CRITIQUE';
    case 'urgent': return 'URGENT';
    case 'attention': return 'ATTENTION';
    default: return 'INFO';
  }
}

function typeLabel(type: string) {
  switch (type) {
    case 'expiration': return 'Expiration';
    case 'stock_faible': return 'Stock faible';
    case 'suivi_patient': return 'Suivi patient';
    case 'transfert': return 'Transfert';
    case 'systeme': return 'Systeme';
    default: return type;
  }
}

function generatePrintHTML(data: ReportData, periode: string, mois: string, centreName: string) {
  const periodeLabel = new Date(mois + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const periodeType = periode === 'mensuel' ? 'Mensuel' : periode === 'trimestriel' ? 'Trimestriel' : periode === 'annuel' ? 'Annuel' : periode === 'stock' ? 'Etat du stock' : 'Consommation';
  const generatedDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const totalStock = data.stock_par_type_facteur.reduce((s, d) => s + d.quantite, 0);
  const maxMed = data.top_medicaments.length > 0 ? Math.max(...data.top_medicaments.map(m => m.quantite)) : 1;
  const maxConso = data.consommation_6_mois.length > 0 ? Math.max(...data.consommation_6_mois.map(c => c.count), 1) : 1;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport CTH Madagascar - ${periodeLabel}</title>
<style>
  @page { size: A4; margin: 15mm 18mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.5; background: #fff; }
  .page { max-width: 210mm; margin: 0 auto; padding: 20px; }
  @media print {
    body { background: white; color: black; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
    .avoid-break { page-break-inside: avoid; }
    .page { padding: 0; max-width: none; }
  }
  @media screen {
    body { background: #e5e7eb; padding: 20px; }
    .page { background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 4px; margin-bottom: 20px; }
  }
  .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #1e40af; color: white; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; z-index: 999; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
  .print-bar button { background: white; color: #1e40af; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; }
  .print-bar button:hover { background: #dbeafe; }
  .print-spacer { height: 60px; }
  h1.title { font-size: 18px; font-weight: 700; color: #1e40af; text-align: center; margin-bottom: 2px; }
  h2.subtitle { font-size: 14px; font-weight: 700; color: #1e40af; text-align: center; margin-bottom: 8px; }
  .header-info { text-align: center; font-size: 10px; color: #6b7280; margin-bottom: 4px; }
  .header-line { border-bottom: 2.5px solid #1e40af; margin-bottom: 20px; padding-bottom: 10px; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 12px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #dbeafe; padding-bottom: 4px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .section-icon { display: inline-block; width: 18px; height: 18px; background: #1e40af; color: white; border-radius: 4px; text-align: center; line-height: 18px; font-size: 10px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f1f5f9; color: #374151; font-weight: 600; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
  td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  .total-row { background: #f1f5f9; font-weight: 700; }
  .total-row td { border-top: 1.5px solid #cbd5e1; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: 700; }
  .text-red { color: #dc2626; }
  .text-amber { color: #d97706; }
  .text-primary { color: #1e40af; }
  .progress-bar { height: 12px; background: #e5e7eb; border-radius: 6px; overflow: hidden; flex: 1; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #1e40af); border-radius: 6px; min-width: 2px; }
  .med-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .med-rank { width: 22px; height: 22px; background: #1e40af; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
  .med-name { width: 160px; font-size: 10px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .med-qty { width: 50px; text-align: right; font-weight: 700; font-size: 10px; flex-shrink: 0; }
  .chart-container { display: flex; align-items: flex-end; gap: 8px; height: 120px; padding: 10px 0; }
  .chart-bar-wrapper { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; justify-content: flex-end; }
  .chart-bar { width: 100%; max-width: 40px; background: linear-gradient(180deg, #3b82f6, #1e40af); border-radius: 4px 4px 0 0; min-height: 2px; transition: height 0.3s; }
  .chart-label { font-size: 9px; color: #6b7280; margin-top: 4px; text-align: center; }
  .chart-value { font-size: 9px; font-weight: 700; color: #1e40af; margin-bottom: 2px; }
  .alert-item { display: flex; gap: 8px; margin-bottom: 6px; padding: 6px 8px; background: #fafafa; border-radius: 4px; border-left: 3px solid; }
  .alert-badge { display: inline-block; font-size: 8px; font-weight: 700; color: white; padding: 1px 5px; border-radius: 3px; text-transform: uppercase; white-space: nowrap; }
  .alert-type { font-size: 9px; color: #6b7280; }
  .alert-title { font-size: 10px; font-weight: 600; }
  .footer { border-top: 2.5px solid #1e40af; padding-top: 10px; margin-top: 30px; text-align: center; font-size: 9px; color: #9ca3af; }
  .footer-line { margin-bottom: 2px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
  .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; text-align: center; }
  .kpi-value { font-size: 20px; font-weight: 800; color: #1e40af; }
  .kpi-label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
</style>
</head>
<body>
<div class="no-print print-bar">
  <span style="font-weight:600;">Rapport CTH Madagascar</span>
  <div style="display:flex;gap:10px;">
    <button onclick="window.print()">Imprimer / PDF</button>
    <button onclick="window.close()">Fermer</button>
  </div>
</div>
<div class="no-print print-spacer"></div>

<div class="page">
  <div class="header-line">
    <h1 class="title">CENTRE DE TRAITEMENT DE L'HEMOPHILIE</h1>
    <h2 class="subtitle">MADAGASCAR</h2>
    <div class="header-info">Rapport ${periodeType} &mdash; ${periodeLabel}${centreName ? ' &mdash; ' + centreName : ' &mdash; Tous les centres'}</div>
    <div class="header-info">Destinataire : Dr Fitahiana &bull; Genere le ${generatedDate}</div>
  </div>

  <!-- Section 1: Resume des patients -->
  <div class="section avoid-break">
    <div class="section-title"><span class="section-icon">1</span> Resume des patients</div>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-value">${data.total_patients}</div><div class="kpi-label">Total patients</div></div>
      <div class="kpi-card"><div class="kpi-value">${data.patients_actifs}</div><div class="kpi-label">Actifs</div></div>
      <div class="kpi-card"><div class="kpi-value">${data.patients_hemophilie_a}</div><div class="kpi-label">Hemophilie A</div></div>
      <div class="kpi-card"><div class="kpi-value">${data.patients_hemophilie_b}</div><div class="kpi-label">Hemophilie B</div></div>
    </div>
    <table>
      <tbody>
        <tr><td>Patients severes</td><td class="text-right font-bold">${data.patients_severes}</td></tr>
        <tr><td>Patients moderes</td><td class="text-right font-bold">${data.patients_moderes}</td></tr>
        <tr><td>Patients mineurs</td><td class="text-right font-bold">${data.patients_mineurs}</td></tr>
        <tr><td>Patients decedes</td><td class="text-right font-bold text-red">${data.patients_decedes}</td></tr>
      </tbody>
    </table>
  </div>

  <!-- Section 2: Etat du stock -->
  <div class="section avoid-break">
    <div class="section-title"><span class="section-icon">2</span> Etat du stock</div>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-value">${data.total_lots_actifs}</div><div class="kpi-label">Lots actifs</div></div>
      <div class="kpi-card"><div class="kpi-value">${totalStock.toLocaleString('fr-FR')}</div><div class="kpi-label">Total unites</div></div>
      <div class="kpi-card"><div class="kpi-value text-amber">${data.lots_proches_expiration}</div><div class="kpi-label">Proches exp.</div></div>
      <div class="kpi-card"><div class="kpi-value text-red">${data.lots_expires}</div><div class="kpi-label">Expires</div></div>
    </div>
    <table>
      <thead><tr><th>Type de facteur</th><th class="text-right">Quantite en stock</th></tr></thead>
      <tbody>
        ${data.stock_par_type_facteur.map(s => `<tr><td>${s.type}</td><td class="text-right font-bold">${s.quantite.toLocaleString('fr-FR')} unites</td></tr>`).join('')}
        <tr class="total-row"><td>Total</td><td class="text-right">${totalStock.toLocaleString('fr-FR')} unites</td></tr>
      </tbody>
    </table>
    ${data.stock_faible_count > 0 ? `<div style="margin-top:6px;padding:4px 8px;background:#fef3c7;border-radius:4px;font-size:10px;color:#92400e;">&#9888; ${data.stock_faible_count} lot(s) avec stock faible (≤20 unites)</div>` : ''}
  </div>

  <!-- Section 3: Top 10 medicaments -->
  <div class="section avoid-break">
    <div class="section-title"><span class="section-icon">3</span> Top 10 medicaments en stock</div>
    ${data.top_medicaments.map((m, i) => `
    <div class="med-row">
      <div class="med-rank">${i + 1}</div>
      <div class="med-name">${m.nom}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.round((m.quantite / maxMed) * 100)}%"></div></div>
      <div class="med-qty">${m.quantite}</div>
    </div>`).join('')}
  </div>

  <div class="page-break"></div>

  <!-- Section 4: Activite du mois -->
  <div class="section avoid-break">
    <div class="section-title"><span class="section-icon">4</span> Activite du mois</div>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-value">${data.prescriptions_mois}</div><div class="kpi-label">Prescriptions</div></div>
      <div class="kpi-card"><div class="kpi-value">${data.dispensations_mois}</div><div class="kpi-label">Dispensations</div></div>
      <div class="kpi-card"><div class="kpi-value">${data.transferts_en_cours}</div><div class="kpi-label">Transferts</div></div>
      <div class="kpi-card"><div class="kpi-value text-amber">${data.alertes_non_lues_count}</div><div class="kpi-label">Alertes</div></div>
    </div>
  </div>

  <!-- Section 5: Repartition par centre -->
  <div class="section avoid-break">
    <div class="section-title"><span class="section-icon">5</span> Repartition par centre</div>
    <table>
      <thead><tr><th>Centre</th><th class="text-right">Patients</th><th class="text-right">Lots</th><th class="text-right">Prescriptions</th></tr></thead>
      <tbody>
        ${data.repartition_par_centre.map(c => `<tr><td>${c.nom}</td><td class="text-right font-bold">${c.patients}</td><td class="text-right font-bold">${c.lots}</td><td class="text-right font-bold">${c.prescriptions}</td></tr>`).join('')}
        <tr class="total-row">
          <td>Total</td>
          <td class="text-right">${data.repartition_par_centre.reduce((s, c) => s + c.patients, 0)}</td>
          <td class="text-right">${data.repartition_par_centre.reduce((s, c) => s + c.lots, 0)}</td>
          <td class="text-right">${data.repartition_par_centre.reduce((s, c) => s + c.prescriptions, 0)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Section 6: Consommation mensuelle -->
  <div class="section avoid-break">
    <div class="section-title"><span class="section-icon">6</span> Consommation mensuelle (6 derniers mois)</div>
    <div class="chart-container">
      ${data.consommation_6_mois.map(c => `
      <div class="chart-bar-wrapper">
        <div class="chart-value">${c.count}</div>
        <div class="chart-bar" style="height:${Math.max(Math.round((c.count / maxConso) * 90), 4)}px"></div>
        <div class="chart-label">${c.label}</div>
      </div>`).join('')}
    </div>
  </div>

  <!-- Section 7: Alertes et incidents -->
  <div class="section avoid-break">
    <div class="section-title"><span class="section-icon">7</span> Alertes et incidents recents</div>
    ${data.alertes_recentes.length === 0 ? '<div style="font-size:10px;color:#6b7280;padding:8px;">Aucune alerte non lue.</div>' : ''}
    ${data.alertes_recentes.map(a => `
    <div class="alert-item" style="border-left-color:${niveauColor(a.niveau)}">
      <div>
        <span class="alert-badge" style="background:${niveauColor(a.niveau)}">${niveauLabel(a.niveau)}</span>
        <span class="alert-type">${typeLabel(a.type)}</span>
      </div>
      <div style="flex:1">
        <div class="alert-title">${a.titre}</div>
      </div>
    </div>`).join('')}
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-line"><strong>CTH Madagascar</strong> &mdash; Centre de Traitement de l'Hemophilie de Madagascar</div>
    <div class="footer-line">Rapport genere automatiquement &bull; Document confidentiel &mdash; Diffusion restreinte</div>
    <div class="footer-line">Page 1</div>
  </div>
</div>

</body>
</html>`;
}

export default function RapportsPage() {
  const [periode, setPeriode] = useState('mensuel');
  const [mois, setMois] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [centreId, setCentreId] = useState('');
  const [data, setData] = useState<ReportData | null>(null);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getReportData(), getCentres()])
      .then(([reportData, centresData]) => {
        setData(reportData);
        setCentres(centresData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(''), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  const centreName = centreId ? centres.find(c => c.id === centreId)?.nom || '' : '';

  const handlePDFExport = () => {
    if (!data) return;
    const html = generatePrintHTML(data, periode, mois, centreName);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  const handlePrint = () => {
    if (!data) return;
    const html = generatePrintHTML(data, periode, mois, centreName);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.onload = () => w.print();
    }
  };

  const handleEmail = () => {
    setToastMsg('Fonctionnalite email en developpement');
  };

  if (loading || !data) {
    return (
      <>
        <Navbar titre="Rapports" />
        <main className="p-4 md:p-6">
          <div className="glass-card mb-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="glass-card animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-6" />
            <div className="bg-white rounded-xl p-8 shadow-inner border border-gray-100 max-w-4xl mx-auto space-y-6">
              <div className="h-6 bg-gray-100 rounded w-2/3 mx-auto" />
              <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" />
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-50 rounded" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  const periodeLabel = new Date(mois + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const totalStock = data.stock_par_type_facteur.reduce((s, d) => s + d.quantite, 0);
  const maxMed = data.top_medicaments.length > 0 ? Math.max(...data.top_medicaments.map(m => m.quantite)) : 1;
  const maxConso = data.consommation_6_mois.length > 0 ? Math.max(...data.consommation_6_mois.map(c => c.count), 1) : 1;

  return (
    <>
      <Navbar titre="Rapports" />
      <main className="p-4 md:p-6">
        {/* Toast */}
        {toastMsg && (
          <div className="fixed top-4 right-4 z-50 bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-fade-in flex items-center gap-2">
            <EnvelopeSimple size={16} weight="duotone" />
            {toastMsg}
          </div>
        )}

        {/* Report generation form */}
        <div className="glass-card mb-6">
          <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <FileText size={20} weight="duotone" className="text-[var(--primary)]" />
            Generer un rapport
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Type de rapport</label>
              <select className="glass-select w-full" value={periode} onChange={e => setPeriode(e.target.value)}>
                <option value="mensuel">Rapport mensuel</option>
                <option value="trimestriel">Rapport trimestriel</option>
                <option value="annuel">Rapport annuel</option>
                <option value="stock">Etat du stock</option>
                <option value="consommation">Consommation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Periode</label>
              <input type="month" className="glass-input w-full" value={mois} onChange={e => setMois(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Centre</label>
              <select className="glass-select w-full" value={centreId} onChange={e => setCentreId(e.target.value)}>
                <option value="">Tous les centres</option>
                {centres.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button className="btn btn-primary flex-1" onClick={handlePDFExport}>
                <DownloadSimple size={18} weight="duotone" />
                Telecharger PDF
              </button>
            </div>
          </div>
        </div>

        {/* Report preview */}
        <div className="glass-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FileText size={20} weight="duotone" className="text-[var(--primary)]" />
              Apercu du rapport
            </h3>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-glass btn-sm" onClick={handlePrint}>
                <Printer size={14} weight="duotone" />
                Imprimer
              </button>
              <button className="btn btn-primary btn-sm" onClick={handlePDFExport}>
                <DownloadSimple size={14} weight="duotone" />
                Telecharger PDF
              </button>
              <button className="btn btn-glass btn-sm" onClick={handleEmail}>
                <PaperPlaneTilt size={14} weight="duotone" />
                Envoyer par email
              </button>
            </div>
          </div>

          {/* A4-like document preview */}
          <div ref={reportRef} className="bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-gray-200 max-w-4xl mx-auto" style={{ minHeight: '297mm' }}>
            <div className="p-6 md:p-10">

              {/* Header */}
              <div className="text-center border-b-[3px] border-[var(--primary)] pb-5 mb-8">
                <h1 className="text-xl md:text-2xl font-extrabold text-[var(--primary)] tracking-tight">
                  CENTRE DE TRAITEMENT DE L&apos;HEMOPHILIE
                </h1>
                <h2 className="text-lg font-bold text-[var(--primary)]">MADAGASCAR</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-3">
                  Rapport {periode} &mdash; {periodeLabel}
                  {centreName && <> &mdash; {centreName}</>}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Destinataire : Dr Fitahiana &bull; Genere le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Section 1: Resume des patients */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[var(--primary)] text-white text-[10px] font-bold">1</span>
                  <Users size={16} weight="duotone" className="text-[var(--primary)]" />
                  Resume des patients
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-[var(--primary)]">{data.total_patients}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Total patients</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-green-700">{data.patients_actifs}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Actifs</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-indigo-700">{data.patients_hemophilie_a}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Hemophilie A (FVIII)</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-purple-700">{data.patients_hemophilie_b}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Hemophilie B (FIX)</div>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {data.repartition_severite.map(s => (
                      <tr key={s.severite} className="border-b border-gray-50">
                        <td className="py-2 text-[var(--text-secondary)]">Patients {s.severite.toLowerCase()}s</td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${data.total_patients > 0 ? Math.round((s.count / data.total_patients) * 100) : 0}%`,
                                  background: s.severite === 'Severe' ? '#dc2626' : s.severite === 'Moderee' ? '#d97706' : '#16a34a',
                                }}
                              />
                            </div>
                            <span className="font-bold w-8 text-right">{s.count}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 text-[var(--text-secondary)]">Patients decedes</td>
                      <td className="py-2 font-bold text-right text-red-600">{data.patients_decedes}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 2: Etat du stock */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[var(--primary)] text-white text-[10px] font-bold">2</span>
                  <Package size={16} weight="duotone" className="text-[var(--primary)]" />
                  Etat du stock
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-[var(--primary)]">{data.total_lots_actifs}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Lots actifs</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-green-700">{totalStock.toLocaleString('fr-FR')}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Total unites</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-amber-600">{data.lots_proches_expiration}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Proches expiration</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-red-600">{data.lots_expires}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Expires</div>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-2 px-3 text-left font-semibold text-xs">Type de facteur</th>
                      <th className="py-2 px-3 text-right font-semibold text-xs">Quantite en stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stock_par_type_facteur.map(item => (
                      <tr key={item.type} className="border-b border-gray-50">
                        <td className="py-2 px-3">{item.type}</td>
                        <td className="py-2 px-3 text-right font-bold">{item.quantite.toLocaleString('fr-FR')} unites</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="py-2 px-3 border-t border-gray-200">Total</td>
                      <td className="py-2 px-3 text-right border-t border-gray-200">{totalStock.toLocaleString('fr-FR')} unites</td>
                    </tr>
                  </tbody>
                </table>
                {data.stock_faible_count > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    <Warning size={14} weight="duotone" />
                    {data.stock_faible_count} lot(s) avec stock faible (&#8804; 20 unites)
                  </div>
                )}
              </div>

              {/* Section 3: Top 10 medicaments */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[var(--primary)] text-white text-[10px] font-bold">3</span>
                  <Pill size={16} weight="duotone" className="text-[var(--primary)]" />
                  Top 10 medicaments en stock
                </h3>
                <div className="space-y-2">
                  {data.top_medicaments.map((item, i) => (
                    <div key={item.nom} className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-xs w-40 md:w-48 truncate flex-shrink-0">{item.nom}</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[var(--primary)]"
                          style={{ width: `${Math.round((item.quantite / maxMed) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-right w-12 flex-shrink-0">{item.quantite}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Activite du mois */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[var(--primary)] text-white text-[10px] font-bold">4</span>
                  <CalendarBlank size={16} weight="duotone" className="text-[var(--primary)]" />
                  Activite du mois
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-[var(--primary)]">{data.prescriptions_mois}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Prescriptions</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-green-700">{data.dispensations_mois}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Dispensations</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-indigo-700">{data.transferts_en_cours}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Transferts</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-amber-600">{data.alertes_non_lues_count}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Alertes</div>
                  </div>
                </div>
              </div>

              {/* Section 5: Repartition par centre */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[var(--primary)] text-white text-[10px] font-bold">5</span>
                  <Buildings size={16} weight="duotone" className="text-[var(--primary)]" />
                  Repartition par centre
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-2 px-3 text-left font-semibold text-xs">Centre</th>
                      <th className="py-2 px-3 text-right font-semibold text-xs">Patients</th>
                      <th className="py-2 px-3 text-right font-semibold text-xs">Lots</th>
                      <th className="py-2 px-3 text-right font-semibold text-xs">Prescriptions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.repartition_par_centre.map(c => (
                      <tr key={c.id} className="border-b border-gray-50">
                        <td className="py-2 px-3">{c.nom}</td>
                        <td className="py-2 px-3 text-right font-bold">{c.patients}</td>
                        <td className="py-2 px-3 text-right font-bold">{c.lots}</td>
                        <td className="py-2 px-3 text-right font-bold">{c.prescriptions}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="py-2 px-3 border-t border-gray-200">Total</td>
                      <td className="py-2 px-3 text-right border-t border-gray-200">{data.repartition_par_centre.reduce((s, c) => s + c.patients, 0)}</td>
                      <td className="py-2 px-3 text-right border-t border-gray-200">{data.repartition_par_centre.reduce((s, c) => s + c.lots, 0)}</td>
                      <td className="py-2 px-3 text-right border-t border-gray-200">{data.repartition_par_centre.reduce((s, c) => s + c.prescriptions, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 6: Consommation mensuelle */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[var(--primary)] text-white text-[10px] font-bold">6</span>
                  <ChartBar size={16} weight="duotone" className="text-[var(--primary)]" />
                  Consommation mensuelle (6 derniers mois)
                </h3>
                <div className="flex items-end gap-2 md:gap-4 h-36 px-2 pt-4">
                  {data.consommation_6_mois.map(c => (
                    <div key={c.mois} className="flex flex-col items-center flex-1" style={{ height: '100%', justifyContent: 'flex-end' }}>
                      <span className="text-[10px] font-bold text-[var(--primary)] mb-1">{c.count}</span>
                      <div
                        className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-[var(--primary)] to-blue-400"
                        style={{ height: `${Math.max(Math.round((c.count / maxConso) * 100), 4)}%`, minHeight: '4px' }}
                      />
                      <span className="text-[9px] text-[var(--text-muted)] mt-1.5 text-center">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 7: Alertes et incidents */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[var(--primary)] text-white text-[10px] font-bold">7</span>
                  <Warning size={16} weight="duotone" className="text-[var(--primary)]" />
                  Alertes et incidents recents
                </h3>
                {data.alertes_recentes.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-4">Aucune alerte non lue.</p>
                ) : (
                  <div className="space-y-2">
                    {data.alertes_recentes.map(a => (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                        style={{ borderLeft: `3px solid ${niveauColor(a.niveau)}` }}
                      >
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <span
                            className="inline-block text-[9px] font-bold text-white px-1.5 py-0.5 rounded uppercase"
                            style={{ background: niveauColor(a.niveau) }}
                          >
                            {niveauLabel(a.niveau)}
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)]">{typeLabel(a.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{a.titre}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t-[3px] border-[var(--primary)] pt-4 mt-10 text-center">
                <p className="text-xs text-[var(--text-muted)] font-semibold">
                  CTH Madagascar &mdash; Centre de Traitement de l&apos;Hemophilie de Madagascar
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Rapport genere automatiquement &bull; Document confidentiel &mdash; Diffusion restreinte
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
