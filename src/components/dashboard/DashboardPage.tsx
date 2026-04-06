'use client';

import {
  Users, HeartPulse, Package, AlertTriangle, ClipboardList, Pill,
  ArrowLeftRight, Bell, Activity, TrendingUp, Calendar
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StockChart from './StockChart';
import RecentPrescriptions from './RecentPrescriptions';
import AlertesBanner from './AlertesBanner';
import PatientsBySeverity from './PatientsBySeverity';
import StockParCentre from './StockParCentre';
import { statistiques } from '@/lib/demo-data';

export default function DashboardPage() {
  const stats = statistiques;

  return (
    <div className="space-y-6">
      {/* Alertes en bannière */}
      <AlertesBanner />

      {/* KPI Cards - Première rangée */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          titre="Patients enregistrés"
          valeur={stats.total_patients}
          sousTitre={`${stats.patients_actifs} actifs`}
          icon={Users}
          couleur="primary"
          delayClass="delay-1"
        />
        <StatCard
          titre="Hémophilie A"
          valeur={stats.patients_hemophilie_a}
          sousTitre="Déficit en facteur VIII"
          icon={HeartPulse}
          couleur="secondary"
          delayClass="delay-2"
        />
        <StatCard
          titre="Hémophilie B"
          valeur={stats.patients_hemophilie_b}
          sousTitre="Déficit en facteur IX"
          icon={HeartPulse}
          couleur="accent"
          delayClass="delay-3"
        />
        <StatCard
          titre="Patients décédés"
          valeur={stats.patients_decedes}
          icon={Activity}
          couleur="danger"
          delayClass="delay-4"
        />
      </div>

      {/* KPI Cards - Deuxième rangée: Stock & Activité */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          titre="Lots en stock"
          valeur={stats.total_lots_actifs}
          sousTitre={`${stats.lots_proches_expiration} proches expiration`}
          icon={Package}
          couleur="success"
          delayClass="delay-1"
        />
        <StatCard
          titre="Alertes stock"
          valeur={stats.stock_faible_count}
          sousTitre="Produits en stock faible"
          icon={AlertTriangle}
          couleur="warning"
          delayClass="delay-2"
        />
        <StatCard
          titre="Prescriptions ce mois"
          valeur={stats.prescriptions_mois}
          sousTitre={`${stats.prescriptions_en_attente} en attente`}
          icon={ClipboardList}
          couleur="info"
          delayClass="delay-3"
        />
        <StatCard
          titre="Dispensations ce mois"
          valeur={stats.dispensations_mois}
          icon={Pill}
          couleur="primary"
          delayClass="delay-4"
        />
      </div>

      {/* KPI Cards - Troisième rangée */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          titre="Transferts en cours"
          valeur={stats.transferts_en_cours}
          icon={ArrowLeftRight}
          couleur="accent"
          delayClass="delay-1"
        />
        <StatCard
          titre="Alertes non lues"
          valeur={stats.alertes_non_lues}
          icon={Bell}
          couleur="danger"
          delayClass="delay-2"
        />
        <StatCard
          titre="Sévères"
          valeur={stats.patients_severes}
          sousTitre={`${((stats.patients_severes / stats.total_patients) * 100).toFixed(0)}% des patients`}
          icon={TrendingUp}
          couleur="secondary"
          delayClass="delay-3"
        />
        <StatCard
          titre="Mois en cours"
          valeur={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          icon={Calendar}
          couleur="info"
          delayClass="delay-4"
        />
      </div>

      {/* Graphiques et détails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StockChart data={stats.stock_par_type_facteur} />
        <PatientsBySeverity data={stats.repartition_severite} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentPrescriptions />
        <StockParCentre data={stats.patients_par_centre} />
      </div>
    </div>
  );
}
