'use server';

import { createAdminClient } from '@/lib/supabase-server';

export async function getDashboardStats() {
  const supabase = createAdminClient();

  // Execute all queries in parallel
  const [
    patientsResult,
    lotsResult,
    prescriptionsResult,
    transfertsResult,
    alertesResult,
    medicamentsResult,
    centresResult,
  ] = await Promise.all([
    supabase.from('patients').select('id, type_hemophilie, severite, statut, centre_id'),
    supabase.from('lots').select('id, medicament_id, centre_id, quantite_restante, date_expiration, actif, medicament:medicaments(nom_complet, type_facteur)'),
    supabase.from('prescriptions').select('id, statut, created_at'),
    supabase.from('transferts').select('id, statut'),
    supabase.from('alertes').select('id, lue'),
    supabase.from('medicaments').select('id, nom_complet, type_facteur'),
    supabase.from('centres').select('id, nom, code'),
  ]);

  const patients = patientsResult.data || [];
  const lots = lotsResult.data || [];
  const prescriptions = prescriptionsResult.data || [];
  const transferts = transfertsResult.data || [];
  const alertes = alertesResult.data || [];
  const centres = centresResult.data || [];

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Patients stats
  const patientsActifs = patients.filter(p => p.statut === 'Actif');
  const patientsHA = patients.filter(p => p.type_hemophilie === 'HA');
  const patientsHB = patients.filter(p => p.type_hemophilie === 'HB');
  const patientsSeveres = patients.filter(p => p.severite === 'Sévère');
  const patientsModeres = patients.filter(p => p.severite === 'Modérée');
  const patientsMineurs = patients.filter(p => p.severite === 'Mineure');
  const patientsDecedes = patients.filter(p => p.statut === 'Décédé');

  // Lots stats
  const lotsActifs = lots.filter(l => l.actif);
  const lotsProchesExpiration = lotsActifs.filter(l => {
    const expDate = new Date(l.date_expiration);
    return expDate <= thirtyDaysFromNow && expDate > now;
  });
  const lotsExpires = lotsActifs.filter(l => new Date(l.date_expiration) <= now);
  const stockFaible = lotsActifs.filter(l => l.quantite_restante <= 20);

  // Prescriptions stats
  const prescriptionsEnAttente = prescriptions.filter(p => p.statut === 'En attente');
  const prescriptionsMois = prescriptions.filter(p => {
    const d = new Date(p.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Transferts stats
  const transfertsEnCours = transferts.filter(t =>
    ['Demandé', 'Approuvé', 'En transit'].includes(t.statut)
  );

  // Alertes stats
  const alertesNonLues = alertes.filter(a => !a.lue);

  // Stock par type de facteur
  const stockParType: Record<string, number> = {};
  lotsActifs.forEach(l => {
    const med = l.medicament as { type_facteur?: string } | null;
    const type = med?.type_facteur || 'Autre';
    stockParType[type] = (stockParType[type] || 0) + l.quantite_restante;
  });

  // Patients par centre
  const patientParCentre = centres.map(c => ({
    centre: c.nom.replace('CTH ', ''),
    count: patients.filter(p => p.centre_id === c.id).length,
  }));

  // Répartition sévérité
  const repartitionSeverite = [
    { severite: 'Sévère', count: patientsSeveres.length },
    { severite: 'Modérée', count: patientsModeres.length },
    { severite: 'Mineure', count: patientsMineurs.length },
  ];

  return {
    total_patients: patients.length,
    patients_actifs: patientsActifs.length,
    patients_hemophilie_a: patientsHA.length,
    patients_hemophilie_b: patientsHB.length,
    patients_severes: patientsSeveres.length,
    patients_moderes: patientsModeres.length,
    patients_mineurs: patientsMineurs.length,
    patients_decedes: patientsDecedes.length,
    total_lots_actifs: lotsActifs.length,
    lots_proches_expiration: lotsProchesExpiration.length,
    lots_expires: lotsExpires.length,
    stock_faible_count: stockFaible.length,
    prescriptions_en_attente: prescriptionsEnAttente.length,
    prescriptions_mois: prescriptionsMois.length,
    dispensations_mois: 0,
    transferts_en_cours: transfertsEnCours.length,
    alertes_non_lues: alertesNonLues.length,
    stock_par_type_facteur: Object.entries(stockParType).map(([type, quantite]) => ({ type, quantite })),
    consommation_mensuelle: [] as { mois: string; quantite: number }[],
    top_medicaments: (() => {
      const medStock: Record<string, { nom: string; quantite: number }> = {};
      lotsActifs.forEach(l => {
        const med = l.medicament as { nom_complet?: string } | null;
        const nom = med?.nom_complet || 'Inconnu';
        if (!medStock[nom]) medStock[nom] = { nom, quantite: 0 };
        medStock[nom].quantite += l.quantite_restante;
      });
      return Object.values(medStock).sort((a, b) => b.quantite - a.quantite).slice(0, 5);
    })(),
    patients_par_centre: patientParCentre,
    repartition_severite: repartitionSeverite,
  };
}
