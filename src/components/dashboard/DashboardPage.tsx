'use client';

import {
  UsersThree, Heartbeat, Package, Warning, ClipboardText, Pill,
  ArrowsLeftRight, BellRinging, TrendUp, CalendarBlank, Skull
} from '@phosphor-icons/react';
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          titre="Patients enregistrés"
          valeur={stats.total_patients}
          sousTitre={`${stats.patients_actifs} actifs`}
          icon={UsersThree}
          couleur="primary"
          delayClass="delay-1"
          href="/dashboard/patients"
        />
        <StatCard
          titre="Hémophilie A"
          valeur={stats.patients_hemophilie_a}
          sousTitre="Déficit en facteur VIII"
          icon={Heartbeat}
          couleur="secondary"
          delayClass="delay-2"
          href="/dashboard/patients"
        />
        <StatCard
          titre="Hémophilie B"
          valeur={stats.patients_hemophilie_b}
          sousTitre="Déficit en facteur IX"
          icon={Heartbeat}
          couleur="accent"
          delayClass="delay-3"
          href="/dashboard/patients"
        />
        <StatCard
          titre="Patients décédés"
          valeur={stats.patients_decedes}
          icon={Skull}
          couleur="danger"
          delayClass="delay-4"
          href="/dashboard/patients"
        />
      </div>

      {/* KPI Cards - Deuxième rangée: Stock & Activité */}
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

      {/* KPI Cards - Troisième rangée */}
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
          titre="Sévères"
          valeur={stats.patients_severes}
          sousTitre={`${((stats.patients_severes / stats.total_patients) * 100).toFixed(0)}% des patients`}
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

      {/* Graphiques et détails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <StockChart data={stats.stock_par_type_facteur} />
        <PatientsBySeverity data={stats.repartition_severite} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <RecentPrescriptions />
        <StockParCentre data={stats.patients_par_centre} />
      </div>
    </div>
  );
}
