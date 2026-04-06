'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  UsersThree, Heartbeat, Package, Warning, ClipboardText, Pill,
  ArrowsLeftRight, BellRinging, TrendUp, CalendarBlank, Skull,
  ArrowsClockwise, Lightning, UserCircle, Stethoscope
} from '@phosphor-icons/react';
import StatCard from '@/components/ui/StatCard';
import StockChart from './StockChart';
import RecentPrescriptions from './RecentPrescriptions';
import AlertesBanner from './AlertesBanner';
import PatientsBySeverity from './PatientsBySeverity';
import StockParCentre from './StockParCentre';
import ConsommationMensuelle from './ConsommationMensuelle';
import { getDashboardStats } from '@/app/actions/dashboard';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import type { StatistiquesDashboard } from '@/types';

interface PrescriptionEnAttente {
  id: string;
  patient_nom: string;
  medecin_nom: string;
  urgence: boolean;
  created_at: string;
}

const REFRESH_INTERVAL = 30_000; // 30 seconds fallback

export default function DashboardPage() {
  const [stats, setStats] = useState<StatistiquesDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingPrescriptions, setPendingPrescriptions] = useState<PrescriptionEnAttente[]>([]);
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabaseClient>['channel']> | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch pending prescriptions from client-side Supabase
  const fetchPendingPrescriptions = useCallback(async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase
        .from('prescriptions')
        .select(`
          id,
          urgence,
          created_at,
          patient:patients(nom, prenom),
          medecin:profiles!prescriptions_medecin_id_fkey(nom, prenom)
        `)
        .eq('statut', 'En attente')
        .order('urgence', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setPendingPrescriptions(
          data.map((p: Record<string, unknown>) => {
            const patient = p.patient as { nom?: string; prenom?: string } | null;
            const medecin = p.medecin as { nom?: string; prenom?: string } | null;
            return {
              id: p.id as string,
              patient_nom: patient
                ? `${patient.prenom ?? ''} ${patient.nom ?? ''}`.trim()
                : 'Patient inconnu',
              medecin_nom: medecin
                ? `Dr ${medecin.prenom ?? ''} ${medecin.nom ?? ''}`.trim()
                : 'Medecin inconnu',
              urgence: p.urgence as boolean,
              created_at: p.created_at as string,
            };
          })
        );
      }
    } catch (err) {
      console.error('Erreur chargement prescriptions en attente:', err);
    }
  }, []);

  // Main stats refresh
  const refreshStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [newStats] = await Promise.all([
        getDashboardStats(),
        fetchPendingPrescriptions(),
      ]);
      setStats(newStats);
    } catch (err) {
      console.error('Erreur rafraichissement dashboard:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPendingPrescriptions]);

  // Initial load
  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      fetchPendingPrescriptions(),
    ])
      .then(([dashStats]) => setStats(dashStats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fetchPendingPrescriptions]);

  // Supabase Realtime subscriptions
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions' },
        () => refreshStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lots' },
        () => refreshStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alertes' },
        () => refreshStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dispensations' },
        () => refreshStats()
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshStats]);

  // Fallback polling every 30s
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refreshStats();
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshStats]);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card !p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicateur de mise a jour en temps reel */}
      {isRefreshing && (
        <div className="flex items-center gap-2 text-sm text-blue-600 animate-pulse">
          <ArrowsClockwise size={16} className="animate-spin" />
          <span>Mise a jour...</span>
        </div>
      )}

      {/* Alertes en banniere */}
      <AlertesBanner />

      {/* KPI Cards - Premiere rangee */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          titre="Patients enregistres"
          valeur={stats.total_patients}
          sousTitre={`${stats.patients_actifs} actifs`}
          icon={UsersThree}
          couleur="primary"
          delayClass="delay-1"
          href="/dashboard/patients"
        />
        <StatCard
          titre="Hemophilie A"
          valeur={stats.patients_hemophilie_a}
          sousTitre="Deficit en facteur VIII"
          icon={Heartbeat}
          couleur="secondary"
          delayClass="delay-2"
          href="/dashboard/patients"
        />
        <StatCard
          titre="Hemophilie B"
          valeur={stats.patients_hemophilie_b}
          sousTitre="Deficit en facteur IX"
          icon={Heartbeat}
          couleur="accent"
          delayClass="delay-3"
          href="/dashboard/patients"
        />
        <StatCard
          titre="Patients decedes"
          valeur={stats.patients_decedes}
          icon={Skull}
          couleur="danger"
          delayClass="delay-4"
          href="/dashboard/patients"
        />
      </div>

      {/* KPI Cards - Deuxieme rangee: Stock & Activite */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          titre="Lots en stock"
          valeur={stats.total_lots_actifs}
          sousTitre={`${stats.lots_proches_expiration} en expiration proche`}
          icon={Package}
          couleur="success"
          delayClass="delay-1"
          href="/dashboard/stock"
        />
        <StatCard
          titre="Alertes stock"
          valeur={stats.stock_faible_count}
          sousTitre="Produits en stock faible"
          icon={Warning}
          couleur="warning"
          delayClass="delay-2"
          href="/dashboard/alertes"
        />
        <StatCard
          titre="Prescriptions ce mois"
          valeur={stats.prescriptions_mois}
          sousTitre={`${stats.prescriptions_en_attente} en attente`}
          icon={ClipboardText}
          couleur="info"
          delayClass="delay-3"
          href="/dashboard/prescriptions"
        />
        <StatCard
          titre="Dispensations ce mois"
          valeur={stats.dispensations_mois}
          icon={Pill}
          couleur="primary"
          delayClass="delay-4"
          href="/dashboard/dispensation"
        />
      </div>

      {/* KPI Cards - Troisieme rangee */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          titre="Transferts en cours"
          valeur={stats.transferts_en_cours}
          icon={ArrowsLeftRight}
          couleur="accent"
          delayClass="delay-1"
          href="/dashboard/transferts"
        />
        <StatCard
          titre="Alertes non lues"
          valeur={stats.alertes_non_lues}
          icon={BellRinging}
          couleur="danger"
          delayClass="delay-2"
          href="/dashboard/alertes"
        />
        <StatCard
          titre="Severes"
          valeur={stats.patients_severes}
          sousTitre={stats.total_patients > 0 ? `${((stats.patients_severes / stats.total_patients) * 100).toFixed(0)}% des patients` : undefined}
          icon={TrendUp}
          couleur="secondary"
          delayClass="delay-3"
          href="/dashboard/patients"
        />
        <StatCard
          titre="Mois en cours"
          valeur={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          icon={CalendarBlank}
          couleur="info"
          delayClass="delay-4"
          href="/dashboard/rapports"
        />
      </div>

      {/* Prescriptions en attente - Quick action section */}
      {pendingPrescriptions.length > 0 && (
        <div className="glass-card !p-4 md:!p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightning size={20} weight="fill" className="text-amber-500" />
              <h3 className="font-semibold text-gray-800">
                Prescriptions en attente
              </h3>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">
                {pendingPrescriptions.length}
              </span>
            </div>
            <Link
              href="/dashboard/dispensation"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Voir tout
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {pendingPrescriptions.map((rx) => (
              <Link
                key={rx.id}
                href="/dashboard/dispensation"
                className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-shrink-0">
                  <UserCircle size={32} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 truncate text-sm">
                      {rx.patient_nom}
                    </span>
                    {rx.urgence && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-red-100 text-red-700 flex-shrink-0">
                        Urgent
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <Stethoscope size={12} />
                    <span className="truncate">{rx.medecin_nom}</span>
                    <span className="text-gray-300">|</span>
                    <span className="flex-shrink-0">
                      {new Date(rx.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Pill size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Graphiques et details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <StockChart data={stats.stock_par_type_facteur} />
        <ConsommationMensuelle data={stats.consommation_mensuelle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <PatientsBySeverity data={stats.repartition_severite} />
        <RecentPrescriptions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <StockParCentre data={stats.patients_par_centre} />
      </div>
    </div>
  );
}
