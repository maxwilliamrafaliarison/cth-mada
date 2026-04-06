import type {
  Centre, Utilisateur, Patient, Medicament, LotMedicament,
  Prescription, LignePrescription, Dispensation, TransfertStock,
  LigneTransfert, Alerte, StatistiquesDashboard
} from '@/types';

// ============================================================
// CENTRES
// ============================================================
export const centres: Centre[] = [
  { id: 'c1', code: 'CTH_ANTANANARIVO', nom: 'CTH Antananarivo (CHU-JRA)', ville: 'Antananarivo', province: 'Analamanga', adresse: 'CHU-JRA Ampefiloha', telephone: '+261 20 22 XXX XX', email: 'cth.tana@cth-madagascar.mg', responsable: 'Dr FETY André', est_central: true, created_at: '2024-01-01' },
  { id: 'c2', code: 'CTH_FIANARANTSOA', nom: 'CTH Fianarantsoa', ville: 'Fianarantsoa', province: 'Haute Matsiatra', adresse: 'CHU Fianarantsoa', telephone: '+261 20 75 XXX XX', email: 'cth.fianar@cth-madagascar.mg', responsable: 'Dr Responsable Fianar', est_central: false, created_at: '2024-01-01' },
  { id: 'c3', code: 'CTH_MAHAJANGA', nom: 'CTH Mahajanga', ville: 'Mahajanga', province: 'Boeny', adresse: 'CHU Mahajanga', telephone: '+261 20 62 XXX XX', email: 'cth.majunga@cth-madagascar.mg', responsable: 'Dr Responsable Majunga', est_central: false, created_at: '2024-01-01' },
  { id: 'c4', code: 'CTH_TOAMASINA', nom: 'CTH Toamasina', ville: 'Toamasina', province: 'Atsinanana', adresse: 'CHU Toamasina', telephone: '+261 20 53 XXX XX', email: 'cth.tamatave@cth-madagascar.mg', responsable: 'Dr Responsable Tamatave', est_central: false, created_at: '2024-01-01' },
  { id: 'c5', code: 'CTH_TOLIARA', nom: 'CTH Toliara', ville: 'Toliara', province: 'Atsimo-Andrefana', adresse: 'CHU Toliara', telephone: '+261 20 94 XXX XX', email: 'cth.tulear@cth-madagascar.mg', responsable: 'Dr Responsable Tulear', est_central: false, created_at: '2024-01-01' },
  { id: 'c6', code: 'CTH_ANTSIRANANA', nom: 'CTH Antsiranana', ville: 'Antsiranana', province: 'Diana', adresse: 'CHU Antsiranana', telephone: '+261 20 82 XXX XX', email: 'cth.diego@cth-madagascar.mg', responsable: 'Dr Responsable Diego', est_central: false, created_at: '2024-01-01' },
  { id: 'c7', code: 'CTH_ITASY', nom: 'CTH Itasy', ville: 'Miarinarivo', province: 'Itasy', adresse: 'CHD Itasy', telephone: '+261 20 44 XXX XX', email: 'cth.itasy@cth-madagascar.mg', responsable: 'Dr Responsable Itasy', est_central: false, created_at: '2024-01-01' },
  { id: 'c8', code: 'CTH_ANTSIRABE', nom: 'CTH Antsirabe', ville: 'Antsirabe', province: 'Vakinankaratra', adresse: 'CHU Antsirabe', telephone: '+261 20 44 XXX XX', email: 'cth.antsirabe@cth-madagascar.mg', responsable: 'Dr Responsable Antsirabe', est_central: false, created_at: '2024-01-01' },
];

// ============================================================
// UTILISATEURS
// ============================================================
export const utilisateurs: Utilisateur[] = [
  { id: 'u1', email: 'admin@cth-madagascar.mg', nom: 'RAFALIARISON', prenom: 'Max William', role: 'administrateur', centre_id: 'c1', actif: true, telephone: '+261 34 XX XXX XX', created_at: '2024-01-01' },
  { id: 'u2', email: 'fety@cth-madagascar.mg', nom: 'FETY', prenom: 'André', role: 'medecin', centre_id: 'c1', actif: true, telephone: '+261 34 XX XXX XX', created_at: '2024-01-01' },
  { id: 'u3', email: 'fitahiana@cth-madagascar.mg', nom: 'Dr Fitahiana', prenom: '', role: 'medecin', centre_id: 'c1', actif: true, telephone: '+261 34 XX XXX XX', created_at: '2024-01-01' },
  { id: 'u4', email: 'pharma@cth-madagascar.mg', nom: 'RAKOTO', prenom: 'Jean', role: 'pharmacien', centre_id: 'c1', actif: true, telephone: '+261 33 XX XXX XX', created_at: '2024-01-01' },
];

// ============================================================
// MÉDICAMENTS (catalogue de référence)
// ============================================================
export const medicaments: Medicament[] = [
  { id: 'm1', nom: 'Kovaltry', nom_complet: 'Kovaltry 500 UI', dosage: 500, unite: 'UI', type_facteur: 'FVIII', indication: 'Hémophilie A', fabricant: 'Bayer', conservation: '2-8°C', duree_stabilite_temp_ambiante: '12 mois max 25°C', image_url: '/images/kovaltry-500.png', code_atc: 'B02BD02', created_at: '2024-01-01' },
  { id: 'm2', nom: 'Kovaltry', nom_complet: 'Kovaltry 1000 UI', dosage: 1000, unite: 'UI', type_facteur: 'FVIII', indication: 'Hémophilie A', fabricant: 'Bayer', conservation: '2-8°C', duree_stabilite_temp_ambiante: '12 mois max 25°C', image_url: '/images/kovaltry-1000.png', code_atc: 'B02BD02', created_at: '2024-01-01' },
  { id: 'm3', nom: 'Afstyla', nom_complet: 'Afstyla 500 UI', dosage: 500, unite: 'UI', type_facteur: 'FVIII', indication: 'Hémophilie A', fabricant: 'CSL Behring', conservation: '2-8°C', duree_stabilite_temp_ambiante: '3 mois max 25°C', image_url: '/images/afstyla-500.jpg', code_atc: 'B02BD', created_at: '2024-01-01' },
  { id: 'm4', nom: 'Afstyla', nom_complet: 'Afstyla 1000 UI', dosage: 1000, unite: 'UI', type_facteur: 'FVIII', indication: 'Hémophilie A', fabricant: 'CSL Behring', conservation: '2-8°C', duree_stabilite_temp_ambiante: '3 mois max 25°C', image_url: '/images/afstyla-1000.jpg', code_atc: 'B02BD', created_at: '2024-01-01' },
  { id: 'm5', nom: 'Eloctate', nom_complet: 'Eloctate 500 UI', dosage: 500, unite: 'UI', type_facteur: 'FVIII', indication: 'Hémophilie A', fabricant: 'Sanofi', conservation: '2-8°C', duree_stabilite_temp_ambiante: '6 mois max 30°C', image_url: '/images/eloctate.jpg', code_atc: 'B02BD02', created_at: '2024-01-01' },
  { id: 'm6', nom: 'Eloctate', nom_complet: 'Eloctate 1000 UI', dosage: 1000, unite: 'UI', type_facteur: 'FVIII', indication: 'Hémophilie A', fabricant: 'Sanofi', conservation: '2-8°C', duree_stabilite_temp_ambiante: '6 mois max 30°C', image_url: '/images/eloctate.jpg', code_atc: 'B02BD02', created_at: '2024-01-01' },
  { id: 'm7', nom: 'Hemlibra', nom_complet: 'Hemlibra 30 mg', dosage: 30, unite: 'mg', type_facteur: 'Emicizumab', indication: 'Hémophilie A', fabricant: 'Roche', conservation: '2-8°C', duree_stabilite_temp_ambiante: '7 jours max 30°C', image_url: '/images/hemlibra-30.webp', code_atc: 'B02BX06', created_at: '2024-01-01' },
  { id: 'm8', nom: 'Alprolix', nom_complet: 'Alprolix 500 UI', dosage: 500, unite: 'UI', type_facteur: 'FIX', indication: 'Hémophilie B', fabricant: 'Sanofi', conservation: '2-8°C', duree_stabilite_temp_ambiante: '6 mois max 30°C', image_url: '/images/alprolix.jpeg', code_atc: 'B02BD04', created_at: '2024-01-01' },
  { id: 'm9', nom: 'Alprolix', nom_complet: 'Alprolix 1000 UI', dosage: 1000, unite: 'UI', type_facteur: 'FIX', indication: 'Hémophilie B', fabricant: 'Sanofi', conservation: '2-8°C', duree_stabilite_temp_ambiante: '6 mois max 30°C', image_url: '/images/alprolix.jpeg', code_atc: 'B02BD04', created_at: '2024-01-01' },
  { id: 'm10', nom: 'NovoSeven', nom_complet: 'NovoSeven 1 mg', dosage: 1, unite: 'mg', type_facteur: 'Bypassing', indication: 'Inhibiteurs', fabricant: 'Novo Nordisk', conservation: '2-8°C', duree_stabilite_temp_ambiante: '24h après reconstitution', image_url: '/images/novoseven.jpg', code_atc: 'B02BD08', created_at: '2024-01-01' },
  { id: 'm11', nom: 'Octaplex', nom_complet: 'Octaplex 500 UI', dosage: 500, unite: 'UI', type_facteur: 'Bypassing', indication: 'Inhibiteurs', fabricant: 'Octapharma', conservation: '2-25°C', duree_stabilite_temp_ambiante: 'Toute la durée de validité', image_url: '/images/octaplex.png', code_atc: 'B02BD01', created_at: '2024-01-01' },
];

// ============================================================
// LOTS EN STOCK (basé sur les vrais données Excel)
// ============================================================
export const lots: LotMedicament[] = [
  { id: 'l1', medicament_id: 'm2', centre_id: 'c1', numero_lot: '2714PR7', numero_commande: 'S00127', pays_expedition: 'Madagascar', quantite_recue: 800, quantite_restante: 320, date_livraison: '2023-02-24', date_expiration: '2026-09-07', code_barre: null, actif: true, created_at: '2023-02-24', updated_at: '2026-04-01' },
  { id: 'l2', medicament_id: 'm7', centre_id: 'c1', numero_lot: 'B0138B01', numero_commande: 'S00420', pays_expedition: 'Madagascar', quantite_recue: 1008, quantite_restante: 45, date_livraison: '2023-09-18', date_expiration: '2026-07-31', code_barre: null, actif: true, created_at: '2023-09-18', updated_at: '2026-04-01' },
  { id: 'l3', medicament_id: 'm7', centre_id: 'c1', numero_lot: 'B4193B01', numero_commande: 'S01113', pays_expedition: 'Madagascar', quantite_recue: 1134, quantite_restante: 890, date_livraison: '2024-05-23', date_expiration: '2027-02-28', code_barre: null, actif: true, created_at: '2024-05-23', updated_at: '2026-04-01' },
  { id: 'l4', medicament_id: 'm3', centre_id: 'c1', numero_lot: 'P100506556', numero_commande: 'S01151', pays_expedition: 'Madagascar', quantite_recue: 490, quantite_restante: 200, date_livraison: '2024-05-23', date_expiration: '2026-10-18', code_barre: null, actif: true, created_at: '2024-05-23', updated_at: '2026-04-01' },
  { id: 'l5', medicament_id: 'm3', centre_id: 'c1', numero_lot: 'P100640343', numero_commande: 'S01151', pays_expedition: 'Madagascar', quantite_recue: 120, quantite_restante: 95, date_livraison: '2024-05-23', date_expiration: '2027-03-16', code_barre: null, actif: true, created_at: '2024-05-23', updated_at: '2026-04-01' },
  { id: 'l6', medicament_id: 'm1', centre_id: 'c1', numero_lot: '2714W7J', numero_commande: 'S01167', pays_expedition: 'Madagascar', quantite_recue: 600, quantite_restante: 150, date_livraison: '2024-03-26', date_expiration: '2026-12-16', code_barre: null, actif: true, created_at: '2024-03-26', updated_at: '2026-04-01' },
  { id: 'l7', medicament_id: 'm9', centre_id: 'c1', numero_lot: 'PC2230', numero_commande: 'S01167', pays_expedition: 'Madagascar', quantite_recue: 100, quantite_restante: 42, date_livraison: '2024-03-26', date_expiration: '2027-10-31', code_barre: null, actif: true, created_at: '2024-03-26', updated_at: '2026-04-01' },
  { id: 'l8', medicament_id: 'm5', centre_id: 'c1', numero_lot: 'PC2245', numero_commande: 'S01167', pays_expedition: 'Madagascar', quantite_recue: 100, quantite_restante: 68, date_livraison: '2024-03-26', date_expiration: '2028-12-31', code_barre: null, actif: true, created_at: '2024-03-26', updated_at: '2026-04-01' },
  { id: 'l9', medicament_id: 'm8', centre_id: 'c1', numero_lot: 'P100537592', numero_commande: 'S01200', pays_expedition: 'Madagascar', quantite_recue: 200, quantite_restante: 85, date_livraison: '2024-09-15', date_expiration: '2027-06-30', code_barre: null, actif: true, created_at: '2024-09-15', updated_at: '2026-04-01' },
  { id: 'l10', medicament_id: 'm8', centre_id: 'c1', numero_lot: 'PC2336', numero_commande: 'S01200', pays_expedition: 'Madagascar', quantite_recue: 300, quantite_restante: 125, date_livraison: '2024-09-15', date_expiration: '2027-03-15', code_barre: null, actif: true, created_at: '2024-09-15', updated_at: '2026-04-01' },
  // Stock Fianarantsoa
  { id: 'l11', medicament_id: 'm3', centre_id: 'c2', numero_lot: 'P100700112', numero_commande: 'TRF-001', pays_expedition: 'Madagascar', quantite_recue: 50, quantite_restante: 30, date_livraison: '2025-01-15', date_expiration: '2027-01-15', code_barre: null, actif: true, created_at: '2025-01-15', updated_at: '2026-04-01' },
  { id: 'l12', medicament_id: 'm8', centre_id: 'c2', numero_lot: 'PC2400', numero_commande: 'TRF-002', pays_expedition: 'Madagascar', quantite_recue: 40, quantite_restante: 18, date_livraison: '2025-02-10', date_expiration: '2027-05-20', code_barre: null, actif: true, created_at: '2025-02-10', updated_at: '2026-04-01' },
  // Stock proche expiration (alerte)
  { id: 'l13', medicament_id: 'm10', centre_id: 'c1', numero_lot: 'NS2025X', numero_commande: 'S01300', pays_expedition: 'Madagascar', quantite_recue: 50, quantite_restante: 8, date_livraison: '2025-06-01', date_expiration: '2026-06-15', code_barre: null, actif: true, created_at: '2025-06-01', updated_at: '2026-04-01' },
];

// ============================================================
// PATIENTS (extrait des données réelles Excel)
// ============================================================
export const patients: Patient[] = [
  { id: 'p1', numero_cth: '1A', numero_wbdr: '19710', nom: 'RALAITSIROFO', prenom: 'Andriniaina Antonio', date_naissance: '2009-12-23', sexe: 'M', poids: 26, groupe_sanguin: 'O+', type_hemophilie: 'HA', severite: 'Sévère', statut: 'Actif', date_diagnostic: '2012-12-13', taux_facteur: '0.015', resultat_bilan_sanguin: null, circonstances_decouverte: 'Hémorragie labiale post-morsure', presence_inhibiteurs: false, traitement_domicile: false, adresse: 'BM 353 Ambohidravaka Ampitatafika', telephone: '033 03 056 12', email: null, province: 'Analamanga', region: null, district: null, ethnie: null, centre_id: 'c1', observations: null, date_deces: null, created_at: '2024-01-01', updated_at: '2026-04-01' },
  { id: 'p2', numero_cth: '2A', numero_wbdr: '8362', nom: 'RANDRIANARISOA', prenom: 'Nasolo Fitiavana Gabrielle', date_naissance: '2011-06-04', sexe: 'M', poids: 28, groupe_sanguin: 'B+', type_hemophilie: 'HA', severite: 'Sévère', statut: 'Actif', date_diagnostic: '2015-10-09', taux_facteur: '<1%', resultat_bilan_sanguin: null, circonstances_decouverte: null, presence_inhibiteurs: false, traitement_domicile: false, adresse: 'IVY 348 AB Bis Anosipatrana Ouest', telephone: '033 12 175 67', email: null, province: 'Analamanga', region: null, district: null, ethnie: null, centre_id: 'c1', observations: null, date_deces: null, created_at: '2024-01-01', updated_at: '2026-04-01' },
  { id: 'p3', numero_cth: '3A', numero_wbdr: '19711', nom: 'TOVONDRAHA', prenom: 'Alpha Hassan', date_naissance: '1998-02-28', sexe: 'M', poids: 60, groupe_sanguin: 'B+', type_hemophilie: 'HA', severite: 'Modérée', statut: 'Actif', date_diagnostic: '2010-08-16', taux_facteur: '0.01', resultat_bilan_sanguin: null, circonstances_decouverte: null, presence_inhibiteurs: false, traitement_domicile: false, adresse: 'Tsimenatse I Tuléar', telephone: '034 93 479 50', email: null, province: 'Atsimo-Andrefana', region: null, district: null, ethnie: null, centre_id: 'c5', observations: null, date_deces: null, created_at: '2024-01-01', updated_at: '2026-04-01' },
  { id: 'p4', numero_cth: '1B', numero_wbdr: '19670', nom: 'ANDRIANJATOVO', prenom: 'Nasanda (Tovo kely)', date_naissance: '2011-07-25', sexe: 'M', poids: 28, groupe_sanguin: null, type_hemophilie: 'HB', severite: 'Modérée', statut: 'Actif', date_diagnostic: '2016-07-29', taux_facteur: '0.012', resultat_bilan_sanguin: null, circonstances_decouverte: null, presence_inhibiteurs: false, traitement_domicile: false, adresse: 'Mahasolo Zone III', telephone: '033 90 820 07', email: null, province: null, region: null, district: null, ethnie: null, centre_id: 'c1', observations: null, date_deces: null, created_at: '2024-01-01', updated_at: '2026-04-01' },
  { id: 'p5', numero_cth: '14B', numero_wbdr: '8366', nom: 'THONY', prenom: 'Razafy', date_naissance: '2005-09-05', sexe: 'M', poids: 60, groupe_sanguin: null, type_hemophilie: 'HB', severite: 'Sévère', statut: 'Actif', date_diagnostic: '2006-07-06', taux_facteur: '<1%', resultat_bilan_sanguin: null, circonstances_decouverte: null, presence_inhibiteurs: false, traitement_domicile: true, adresse: 'Vontovorona', telephone: '034 18 771 53', email: null, province: 'Analamanga', region: null, district: null, ethnie: null, centre_id: 'c1', observations: null, date_deces: null, created_at: '2024-01-01', updated_at: '2026-04-01' },
  { id: 'p6', numero_cth: '17B', numero_wbdr: '18642', nom: 'RANDRIAMAMPIANINA', prenom: 'Tsiafoy', date_naissance: '2005-07-29', sexe: 'M', poids: 49, groupe_sanguin: null, type_hemophilie: 'HB', severite: 'Modérée', statut: 'Actif', date_diagnostic: null, taux_facteur: '0.045', resultat_bilan_sanguin: null, circonstances_decouverte: null, presence_inhibiteurs: false, traitement_domicile: true, adresse: 'Lot IIL 68bis Andranomahery', telephone: '033 49 075 63', email: null, province: 'Analamanga', region: null, district: null, ethnie: null, centre_id: 'c1', observations: null, date_deces: null, created_at: '2024-01-01', updated_at: '2026-04-01' },
  { id: 'p7', numero_cth: '61A', numero_wbdr: '19731', nom: 'ABENDRAZA', prenom: 'Mihaja Harilanto', date_naissance: '1996-01-09', sexe: 'M', poids: null, groupe_sanguin: 'O+', type_hemophilie: 'HA', severite: 'Sévère', statut: 'Décédé', date_diagnostic: '2012-12-12', taux_facteur: '0.014', resultat_bilan_sanguin: null, circonstances_decouverte: null, presence_inhibiteurs: false, traitement_domicile: false, adresse: 'lot 2B90Bis Manjakaray', telephone: '032 92 363 82', email: null, province: 'Analamanga', region: null, district: null, ethnie: null, centre_id: 'c1', observations: 'Décédé le 03 janvier 2021', date_deces: '2021-01-03', created_at: '2024-01-01', updated_at: '2026-04-01' },
  { id: 'p8', numero_cth: '16A', numero_wbdr: '18522', nom: 'ANDRIANIRINA', prenom: 'Toky Nantenaina Mirado', date_naissance: '2010-05-23', sexe: 'M', poids: 28, groupe_sanguin: 'B+', type_hemophilie: 'HA', severite: 'Sévère', statut: 'Actif', date_diagnostic: '2013-05-22', taux_facteur: '<1%', resultat_bilan_sanguin: null, circonstances_decouverte: null, presence_inhibiteurs: false, traitement_domicile: false, adresse: '07.08.E30 Ambohimena Antsirabe', telephone: '033 45 256 47', email: null, province: 'Vakinankaratra', region: null, district: null, ethnie: null, centre_id: 'c8', observations: null, date_deces: null, created_at: '2024-01-01', updated_at: '2026-04-01' },
];

// ============================================================
// PRESCRIPTIONS (basé sur Fact IX réel)
// ============================================================
export const prescriptions: Prescription[] = [
  {
    id: 'rx1', numero: 'CTH-2024-0001', patient_id: 'p6', medecin_id: 'u2', centre_id: 'c1',
    date_prescription: '2024-10-31', type_traitement: 'Demande', type_saignement: 'Hémarthrose du genou droit',
    description_chirurgie: null, autres_precisions: null, statut: 'Dispensée', urgence: false,
    lignes: [{ id: 'rl1', prescription_id: 'rx1', medicament_id: 'm8', quantite_prescrite: 1000, quantite_dispensee: 1000, posologie: '500 UI x 2 injections' }],
    created_at: '2024-10-31'
  },
  {
    id: 'rx2', numero: 'CTH-2024-0002', patient_id: 'p5', medecin_id: 'u2', centre_id: 'c1',
    date_prescription: '2024-12-05', type_traitement: 'Demande', type_saignement: 'Hématome intramusculaire',
    description_chirurgie: null, autres_precisions: 'Hématome du cuisse droit', statut: 'Dispensée', urgence: false,
    lignes: [{ id: 'rl2', prescription_id: 'rx2', medicament_id: 'm8', quantite_prescrite: 1000, quantite_dispensee: 1000, posologie: '500 UI x 2 injections' }],
    created_at: '2024-12-05'
  },
  {
    id: 'rx3', numero: 'CTH-2025-0001', patient_id: 'p5', medecin_id: 'u2', centre_id: 'c1',
    date_prescription: '2025-01-10', type_traitement: 'Pré-opératoire', type_saignement: 'Hématome intramusculaire',
    description_chirurgie: 'Traitement pré-opératoire', autres_precisions: 'Hématome intra musculaire du cuisse gauche', statut: 'Dispensée', urgence: true,
    lignes: [{ id: 'rl3', prescription_id: 'rx3', medicament_id: 'm8', quantite_prescrite: 2500, quantite_dispensee: 2500, posologie: '250 UI x 10 injections sur 4 jours' }],
    created_at: '2025-01-10'
  },
  {
    id: 'rx4', numero: 'CTH-2026-0001', patient_id: 'p1', medecin_id: 'u2', centre_id: 'c1',
    date_prescription: '2026-04-05', type_traitement: 'Demande', type_saignement: 'Hémarthrose du genou gauche',
    description_chirurgie: null, autres_precisions: null, statut: 'En attente', urgence: false,
    lignes: [{ id: 'rl4', prescription_id: 'rx4', medicament_id: 'm1', quantite_prescrite: 500, quantite_dispensee: 0, posologie: '500 UI en injection unique' }],
    created_at: '2026-04-05'
  },
];

// ============================================================
// ALERTES
// ============================================================
export const alertes: Alerte[] = [
  { id: 'a1', type: 'expiration', niveau: 'urgent', titre: 'NovoSeven proche expiration', message: 'Le lot NS2025X de NovoSeven 1 mg expire le 15/06/2026 (70 jours restants). 8 unités restantes.', centre_id: 'c1', reference_id: 'l13', reference_type: 'lot', lue: false, created_at: '2026-04-05' },
  { id: 'a2', type: 'stock_faible', niveau: 'attention', titre: 'Stock faible - NovoSeven', message: 'Seulement 8 unités de NovoSeven 1 mg restantes au CTH Antananarivo.', centre_id: 'c1', reference_id: 'l13', reference_type: 'lot', lue: false, created_at: '2026-04-05' },
  { id: 'a3', type: 'stock_faible', niveau: 'attention', titre: 'Stock faible - Hemlibra', message: 'Seulement 45 unités de Hemlibra 30 mg (lot B0138B01) restantes au CTH Antananarivo.', centre_id: 'c1', reference_id: 'l2', reference_type: 'lot', lue: false, created_at: '2026-04-01' },
  { id: 'a4', type: 'suivi_patient', niveau: 'info', titre: 'Rappel suivi patient', message: 'Le patient THONY Razafy (14B) n\'a pas eu de visite de suivi depuis plus de 60 jours.', centre_id: 'c1', reference_id: 'p5', reference_type: 'patient', lue: true, created_at: '2026-03-15' },
  { id: 'a5', type: 'transfert', niveau: 'info', titre: 'Demande de transfert reçue', message: 'Le CTH Fianarantsoa demande un approvisionnement en Alprolix 500 UI (20 unités).', centre_id: 'c1', reference_id: 'trf1', reference_type: 'transfert', lue: false, created_at: '2026-04-04' },
];

// ============================================================
// TRANSFERTS
// ============================================================
export const transferts: TransfertStock[] = [
  {
    id: 'trf1', numero: 'TRF-2026-0001', centre_source_id: 'c1', centre_destination_id: 'c2',
    demandeur_id: 'u4', approbateur_id: null, statut: 'Demandé',
    date_demande: '2026-04-04', date_approbation: null, date_expedition: null, date_reception: null,
    motif: 'Réapprovisionnement trimestriel - stock épuisé en Alprolix',
    lignes: [{ id: 'tl1', transfert_id: 'trf1', lot_id: 'l9', medicament_id: 'm8', quantite_demandee: 20, quantite_envoyee: null, quantite_recue: null }],
    created_at: '2026-04-04'
  },
];

// ============================================================
// STATISTIQUES DASHBOARD
// ============================================================
export const statistiques: StatistiquesDashboard = {
  total_patients: 181,
  patients_actifs: 168,
  patients_hemophilie_a: 101,
  patients_hemophilie_b: 80,
  patients_severes: 52,
  patients_moderes: 98,
  patients_mineurs: 18,
  patients_decedes: 13,
  total_lots_actifs: 13,
  lots_proches_expiration: 2,
  lots_expires: 0,
  stock_faible_count: 3,
  prescriptions_en_attente: 1,
  prescriptions_mois: 12,
  dispensations_mois: 11,
  transferts_en_cours: 1,
  alertes_non_lues: 4,
  stock_par_type_facteur: [
    { type: 'Facteur VIII (FVIII)', quantite: 833 },
    { type: 'Facteur IX (FIX)', quantite: 270 },
    { type: 'Emicizumab', quantite: 935 },
    { type: 'Agents bypassing', quantite: 8 },
  ],
  consommation_mensuelle: [
    { mois: 'Nov 2025', quantite: 3500 },
    { mois: 'Déc 2025', quantite: 4200 },
    { mois: 'Jan 2026', quantite: 5100 },
    { mois: 'Fév 2026', quantite: 3800 },
    { mois: 'Mar 2026', quantite: 4600 },
    { mois: 'Avr 2026', quantite: 1200 },
  ],
  top_medicaments: [
    { nom: 'Hemlibra 30 mg', quantite: 935 },
    { nom: 'Kovaltry 1000 UI', quantite: 320 },
    { nom: 'Afstyla 500 UI', quantite: 295 },
    { nom: 'Alprolix 500 UI', quantite: 210 },
    { nom: 'Kovaltry 500 UI', quantite: 150 },
  ],
  patients_par_centre: [
    { centre: 'CTH Antananarivo', count: 120 },
    { centre: 'CTH Fianarantsoa', count: 18 },
    { centre: 'CTH Antsirabe', count: 12 },
    { centre: 'CTH Mahajanga', count: 10 },
    { centre: 'CTH Toamasina', count: 8 },
    { centre: 'CTH Toliara', count: 7 },
    { centre: 'CTH Antsiranana', count: 4 },
    { centre: 'CTH Itasy', count: 2 },
  ],
  repartition_severite: [
    { severite: 'Sévère', count: 52 },
    { severite: 'Modérée', count: 98 },
    { severite: 'Mineure', count: 18 },
    { severite: 'Décédé', count: 13 },
  ],
};
