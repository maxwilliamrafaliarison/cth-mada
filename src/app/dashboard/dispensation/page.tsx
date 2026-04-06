'use client';

import Navbar from '@/components/layout/Navbar';
import { useState, useEffect } from 'react';
import { Pill, UserCircle, Package, CheckCircle, Clock } from '@phosphor-icons/react';
import { getPrescriptions } from '@/app/actions/prescriptions';
import { getLots } from '@/app/actions/stock';

export default function DispensationPage() {
  const [prescriptionsData, setPrescriptionsData] = useState<any[]>([]);
  const [lotsData, setLotsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
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
    }
    fetchData();
  }, []);

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

  const enAttente = prescriptionsData.filter(rx => rx.statut === 'En attente');
  const dispensees = prescriptionsData.filter(rx => rx.statut === 'Dispensée').slice(0, 5);

  return (
    <>
      <Navbar titre="Dispensation" />
      <main className="p-4 md:p-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-amber-400 pulse-alert" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">En attente de dispensation ({enAttente.length})</h3>
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
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-bold text-[var(--text-primary)]">{patient?.nom} {patient?.prenom}</h4>
                          <span className={`badge ${patient?.type_hemophilie === 'HA' ? 'badge-secondary' : 'badge-accent'}`}>{patient?.numero_cth} - {patient?.type_hemophilie === 'HA' ? 'Hémophilie A' : 'Hémophilie B'}</span>
                          {rx.urgence && <span className="badge badge-danger pulse-alert">URGENT</span>}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-3">Prescrit par {rx.medecin ? `Dr ${rx.medecin.nom} ${rx.medecin.prenom}` : 'Médecin inconnu'} • {rx.type_traitement} • {rx.type_saignement || ''}</p>
                        <div className="space-y-2">
                          {rx.lignes?.map((ligne: any) => {
                            const med = ligne.medicament;
                            const lotsDisponibles = lotsData.filter(l => l.medicament_id === ligne.medicament_id && l.quantite_restante > 0).sort((a, b) => new Date(a.date_expiration).getTime() - new Date(b.date_expiration).getTime());
                            const lotSuggere = lotsDisponibles[0];
                            return (
                              <div key={ligne.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/50 border border-gray-100">
                                <Pill size={22} weight="duotone" className="text-[var(--accent)] flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{med?.nom_complet}</p>
                                  <p className="text-xs text-[var(--text-muted)]">Quantité prescrite : <strong>{ligne.quantite_prescrite}</strong>{ligne.posologie && ` • ${ligne.posologie}`}</p>
                                </div>
                                {lotSuggere && (
                                  <div className="text-right">
                                    <p className="text-xs text-[var(--text-muted)]">Lot suggéré (FEFO)</p>
                                    <p className="text-sm font-mono font-bold text-[var(--primary)]">{lotSuggere.numero_lot}</p>
                                    <p className="text-[0.65rem] text-[var(--text-muted)]">Reste : {lotSuggere.quantite_restante} • Exp. : {new Date(lotSuggere.date_expiration).toLocaleDateString('fr-FR')}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-[var(--text-muted)] mb-2">{new Date(rx.date_prescription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                        <button className="btn btn-success"><CheckCircle size={18} weight="duotone" />Dispenser</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Dispensations récentes</h3>
          <div className="glass-card !p-0 overflow-hidden">
            <table className="glass-table">
              <thead><tr><th>Date</th><th>Patient</th><th>Médicament</th><th>Quantité</th><th>N° Lot</th><th>Statut</th></tr></thead>
              <tbody>
                {dispensees.map(rx => {
                  const patient = rx.patient;
                  return rx.lignes?.map((ligne: any) => {
                    const med = ligne.medicament;
                    return (
                      <tr key={ligne.id}>
                        <td className="text-sm">{new Date(rx.date_prescription).toLocaleDateString('fr-FR')}</td>
                        <td className="font-semibold text-sm">{patient?.nom} {patient?.prenom}</td>
                        <td className="text-sm">{med?.nom_complet}</td>
                        <td className="font-bold">{ligne.quantite_dispensee}</td>
                        <td className="font-mono text-xs">-</td>
                        <td><span className="badge badge-success"><CheckCircle size={12} weight="duotone" />Dispensé</span></td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
