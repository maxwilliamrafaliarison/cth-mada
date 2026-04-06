'use server';

import { createAdminClient, requireAuth } from '@/lib/supabase-server';

export async function getReportData() {
  await requireAuth();
  const supabase = createAdminClient();

  const [
    patientsResult,
    lotsResult,
    prescriptionsResult,
    transfertsResult,
    alertesResult,
    centresResult,
    dispensationsResult,
  ] = await Promise.all([
    supabase.from('patients').select('id, nom, prenom, numero_cth, type_hemophilie, severite, statut, centre_id'),
    supabase.from('lots').select('id, medicament_id, centre_id, quantite_restante, date_expiration, actif, medicament:medicaments(nom_complet, type_facteur)'),
    supabase.from('prescriptions').select('id, statut, created_at, updated_at, centre_id'),
    supabase.from('transferts').select('id, statut'),
    supabase.from('alertes').select('id, type, niveau, titre, message, lue, created_at').order('created_at', { ascending: false }).limit(50),
    supabase.from('centres').select('id, nom, code'),
    supabase.from('prescriptions')
      .select('id, numero, statut, created_at, updated_at, patient:patients(nom, prenom, numero_cth, type_hemophilie), medecin:utilisateurs!prescriptions_medecin_id_fkey(nom, prenom), lignes:lignes_prescription(quantite, medicament:medicaments(nom_complet))')
      .in('statut', ['Dispensée', 'Partiellement dispensée'])
      .order('updated_at', { ascending: false })
      .limit(50),
  ]);

  const patients = patientsResult.data || [];
  const lots = lotsResult.data || [];
  const prescriptions = prescriptionsResult.data || [];
  const transferts = transfertsResult.data || [];
  const alertes = alertesResult.data || [];
  const centres = centresResult.data || [];
  const dispensationsRaw = dispensationsResult.data || [];

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // --- Patients stats ---
  const patientsActifs = patients.filter(p => p.statut === 'Actif');
  const patientsHA = patients.filter(p => p.type_hemophilie === 'HA');
  const patientsHB = patients.filter(p => p.type_hemophilie === 'HB');
  const patientsSeveres = patients.filter(p => p.severite === 'Sévère');
  const patientsModeres = patients.filter(p => p.severite === 'Modérée');
  const patientsMineurs = patients.filter(p => p.severite === 'Mineure');
  const patientsDecedes = patients.filter(p => p.statut === 'Décédé');

  // --- Lots stats ---
  const lotsActifs = lots.filter(l => l.actif);
  const lotsProchesExpiration = lotsActifs.filter(l => {
    const expDate = new Date(l.date_expiration);
    return expDate <= ninetyDaysFromNow && expDate > now;
  });
  const lotsExpires = lotsActifs.filter(l => new Date(l.date_expiration) <= now);
  const stockFaible = lotsActifs.filter(l => l.quantite_restante <= 20);

  // --- Stock par type de facteur ---
  const stockParType: Record<string, number> = {};
  lotsActifs.forEach(l => {
    const med = l.medicament as { type_facteur?: string } | null;
    const type = med?.type_facteur || 'Autre';
    stockParType[type] = (stockParType[type] || 0) + l.quantite_restante;
  });

  // --- Top 10 medicaments ---
  const medStock: Record<string, { nom: string; quantite: number }> = {};
  lotsActifs.forEach(l => {
    const med = l.medicament as { nom_complet?: string } | null;
    const nom = med?.nom_complet || 'Inconnu';
    if (!medStock[nom]) medStock[nom] = { nom, quantite: 0 };
    medStock[nom].quantite += l.quantite_restante;
  });
  const topMedicaments = Object.values(medStock).sort((a, b) => b.quantite - a.quantite).slice(0, 10);

  // --- Prescriptions this month ---
  const prescriptionsMois = prescriptions.filter(p => {
    const d = new Date(p.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // --- Dispensations this month (statut='Dispensée' and updated this month) ---
  const dispensationsMois = prescriptions.filter(p => {
    if (p.statut !== 'Dispensée') return false;
    const d = new Date(p.updated_at || p.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // --- Transferts en cours ---
  const transfertsEnCours = transferts.filter(t =>
    ['Demandé', 'Approuvé', 'En transit'].includes(t.statut)
  );

  // --- Alertes non lues (recent 10) ---
  const alertesNonLues = alertes.filter(a => !a.lue).slice(0, 10);

  // --- Répartition par centre ---
  const repartitionParCentre = centres.map(c => {
    const patientCount = patients.filter(p => p.centre_id === c.id).length;
    const lotCount = lotsActifs.filter(l => l.centre_id === c.id).length;
    const prescriptionCount = prescriptions.filter(p => p.centre_id === c.id).length;
    return {
      id: c.id,
      nom: c.nom,
      code: c.code,
      patients: patientCount,
      lots: lotCount,
      prescriptions: prescriptionCount,
    };
  });

  // --- Last 6 months prescription counts ---
  const consommation6Mois: { mois: string; label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const count = prescriptions.filter(p => {
      const pd = new Date(p.created_at);
      return pd.getMonth() === m && pd.getFullYear() === y;
    }).length;
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    consommation6Mois.push({
      mois: `${y}-${String(m + 1).padStart(2, '0')}`,
      label,
      count,
    });
  }

  // --- Repartition severite ---
  const repartitionSeverite = [
    { severite: 'Sévère', count: patientsSeveres.length },
    { severite: 'Modérée', count: patientsModeres.length },
    { severite: 'Mineure', count: patientsMineurs.length },
  ];

  return {
    // Patients
    total_patients: patients.length,
    patients_actifs: patientsActifs.length,
    patients_hemophilie_a: patientsHA.length,
    patients_hemophilie_b: patientsHB.length,
    patients_severes: patientsSeveres.length,
    patients_moderes: patientsModeres.length,
    patients_mineurs: patientsMineurs.length,
    patients_decedes: patientsDecedes.length,
    repartition_severite: repartitionSeverite,

    // Stock
    total_lots_actifs: lotsActifs.length,
    lots_proches_expiration: lotsProchesExpiration.length,
    lots_expires: lotsExpires.length,
    stock_faible_count: stockFaible.length,
    stock_par_type_facteur: Object.entries(stockParType).map(([type, quantite]) => ({ type, quantite })),
    top_medicaments: topMedicaments,

    // Activity
    prescriptions_mois: prescriptionsMois.length,
    dispensations_mois: dispensationsMois.length,
    transferts_en_cours: transfertsEnCours.length,
    alertes_non_lues_count: alertesNonLues.length,

    // Detailed data
    alertes_recentes: alertesNonLues.map(a => ({
      id: a.id,
      type: a.type as string,
      niveau: a.niveau as string,
      titre: a.titre,
      message: a.message,
      created_at: a.created_at,
    })),
    repartition_par_centre: repartitionParCentre,
    consommation_6_mois: consommation6Mois,

    // Historique dispensations détaillé
    dispensations_detail: dispensationsRaw.map((d: Record<string, unknown>) => {
      const patient = d.patient as Record<string, string> | null;
      const medecin = d.medecin as Record<string, string> | null;
      const lignes = (d.lignes as Array<Record<string, unknown>>) || [];
      return {
        numero: d.numero as string,
        date: (d.updated_at || d.created_at) as string,
        statut: d.statut as string,
        patient_nom: patient ? `${patient.prenom} ${patient.nom}` : 'Inconnu',
        patient_cth: patient?.numero_cth || '-',
        patient_type: patient?.type_hemophilie || '-',
        medecin_nom: medecin ? `Dr ${medecin.prenom} ${medecin.nom}` : '-',
        medicaments: lignes.map((l) => {
          const med = l.medicament as Record<string, string> | null;
          return {
            nom: med?.nom_complet || 'Inconnu',
            quantite: l.quantite as number,
          };
        }),
      };
    }),
  };
}
