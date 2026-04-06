'use client';

import { ClipboardText, Clock, CheckCircle, XCircle } from '@phosphor-icons/react';
import { prescriptions, patients } from '@/lib/demo-data';

const statutConfig: Record<string, { icon: typeof CheckCircle; class: string }> = {
  'En attente': { icon: Clock, class: 'badge-warning' },
  'Dispensée': { icon: CheckCircle, class: 'badge-success' },
  'Annulée': { icon: XCircle, class: 'badge-danger' },
  'Partiellement dispensée': { icon: Clock, class: 'badge-info' },
};

export default function RecentPrescriptions() {
  const recentRx = [...prescriptions].sort((a, b) =>
    new Date(b.date_prescription).getTime() - new Date(a.date_prescription).getTime()
  ).slice(0, 5);

  return (
    <div className="glass-card animate-fade-in opacity-0 delay-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardText size={22} weight="duotone" className="text-[var(--info)]" />
          <h3 className="font-bold text-[var(--text-primary)]">Prescriptions récentes</h3>
        </div>
        <a href="/dashboard/prescriptions" className="text-sm text-[var(--accent)] hover:underline font-medium">
          Voir tout →
        </a>
      </div>

      <div className="space-y-3">
        {recentRx.map(rx => {
          const patient = patients.find(p => p.id === rx.patient_id);
          const config = statutConfig[rx.statut] || statutConfig['En attente'];
          const StatusIcon = config.icon;

          return (
            <div key={rx.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/30 hover:bg-white/50 transition-colors">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                rx.urgence ? 'bg-red-100' : 'bg-blue-50'
              }`}>
                <ClipboardText size={18} weight="duotone" className={rx.urgence ? 'text-red-600' : 'text-blue-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {patient?.nom} {patient?.prenom}
                  </p>
                  {rx.urgence && <span className="badge badge-danger text-[0.6rem]">URGENT</span>}
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {rx.numero} • {rx.type_saignement || rx.type_traitement}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`badge ${config.class} text-[0.65rem]`}>
                  <StatusIcon size={12} weight="duotone" />
                  {rx.statut}
                </span>
                <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">
                  {new Date(rx.date_prescription).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
