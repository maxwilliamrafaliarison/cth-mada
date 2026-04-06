'use client';

import Navbar from '@/components/layout/Navbar';
import { ArrowsLeftRight, Plus, ArrowRight, Clock, CheckCircle, Truck, Package, XCircle } from '@phosphor-icons/react';
import { transferts, centres, medicaments, lots } from '@/lib/demo-data';

const statutConfig: Record<string, { icon: typeof Clock; class: string; color: string }> = {
  'Demandé': { icon: Clock, class: 'badge-warning', color: 'bg-amber-50' },
  'Approuvé': { icon: CheckCircle, class: 'badge-info', color: 'bg-blue-50' },
  'En transit': { icon: Truck, class: 'badge-accent', color: 'bg-indigo-50' },
  'Réceptionné': { icon: Package, class: 'badge-success', color: 'bg-emerald-50' },
  'Refusé': { icon: XCircle, class: 'badge-danger', color: 'bg-red-50' },
};

export default function TransfertsPage() {
  return (
    <>
      <Navbar titre="Transferts inter-centres" />
      <main className="p-4 md:p-6">
        <div className="glass-card !p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Les centres provinciaux demandent l&apos;approvisionnement au <strong>CTH Antananarivo (centre central)</strong>. Le stock est déduit du centre source à l&apos;expédition.
            </p>
            <button className="btn btn-primary flex-shrink-0"><Plus size={16} weight="bold" />Demande de transfert</button>
          </div>
        </div>

        <div className="space-y-4">
          {transferts.map(trf => {
            const source = centres.find(c => c.id === trf.centre_source_id);
            const dest = centres.find(c => c.id === trf.centre_destination_id);
            const config = statutConfig[trf.statut] || statutConfig['Demandé'];
            const StatusIcon = config.icon;
            return (
              <div key={trf.id} className={`glass-card ${config.color} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
                    <ArrowsLeftRight size={24} weight="duotone" className="text-[var(--primary)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-[var(--text-muted)]">{trf.numero}</span>
                      <span className={`badge ${config.class}`}><StatusIcon size={12} weight="duotone" />{trf.statut}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
                      <div className="px-3 py-2 rounded-lg bg-white/50 border border-gray-100">
                        <p className="text-xs text-[var(--text-muted)]">De</p>
                        <p className="font-bold text-sm text-[var(--text-primary)]">{source?.nom}</p>
                      </div>
                      <ArrowRight size={20} weight="bold" className="text-[var(--text-muted)]" />
                      <div className="px-3 py-2 rounded-lg bg-white/50 border border-gray-100">
                        <p className="text-xs text-[var(--text-muted)]">Vers</p>
                        <p className="font-bold text-sm text-[var(--text-primary)]">{dest?.nom}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {trf.lignes.map(ligne => {
                        const med = medicaments.find(m => m.id === ligne.medicament_id);
                        const lot = lots.find(l => l.id === ligne.lot_id);
                        return (
                          <div key={ligne.id} className="flex items-center gap-2 text-sm">
                            <Package size={14} weight="duotone" className="text-[var(--accent)]" />
                            <span className="font-medium">{med?.nom_complet}</span>
                            <span className="text-[var(--text-muted)]">•</span>
                            <span>Demandé : <strong>{ligne.quantite_demandee}</strong></span>
                            {lot && <span className="font-mono text-xs text-[var(--text-muted)]">(Lot {lot.numero_lot})</span>}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2 italic">{trf.motif}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[var(--text-muted)]">{new Date(trf.date_demande).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    {trf.statut === 'Demandé' && (
                      <div className="flex gap-2 mt-3">
                        <button className="btn btn-success btn-sm">Approuver</button>
                        <button className="btn btn-danger btn-sm">Refuser</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
