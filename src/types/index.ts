// ============================================================
// CTH Madagascar - Types & Interfaces
// Basé sur les normes européennes EAHAD / WFH / MHEMO
// ============================================================

// --- Centres de traitement ---
export type CentreId =
  | 'CTH_ANTANANARIVO'
  | 'CTH_FIANARANTSOA'
  | 'CTH_MAHAJANGA'
  | 'CTH_TOAMASINA'
  | 'CTH_TOLIARA'
  | 'CTH_ANTSIRANANA'
  | 'CTH_ITASY'
  | 'CTH_ANTSIRABE';

export interface Centre {
  id: string;
  code: CentreId;
  nom: string;
  ville: string;
  province: string;
  adresse: string;
  telephone: string;
  email: string;
  responsable: string;
  est_central: boolean; // true pour Antananarivo
  created_at: string;
}

// --- Utilisateurs et rôles ---
export type Role = 'administrateur' | 'medecin' | 'pharmacien';

export interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  centre_id: string;
  centre?: Centre;
  actif: boolean;
  telephone: string;
  created_at: string;
}

// --- Patients ---
export type TypeHemophilie = 'HA' | 'HB';
export type SeveriteHemophilie = 'Sévère' | 'Modérée' | 'Mineure';
export type StatutPatient = 'Actif' | 'Inactif' | 'Décédé';
export type GroupeSanguin = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export const ETHNIES_MADAGASCAR = [
  'Merina',
  'Betsileo',
  'Betsimisaraka',
  'Tsimihety',
  'Sakalava',
  'Antaisaka',
  'Antandroy',
  'Antanosy',
  'Tanala',
  'Antaifasy',
  'Bara',
  'Sihanaka',
  'Mahafaly',
  'Antakarana',
  'Bezanozano',
  'Antemoro',
  'Antefasy',
  'Zafisoro',
  'Autre',
] as const;

export type Ethnie = (typeof ETHNIES_MADAGASCAR)[number];

export interface Patient {
  id: string;
  numero_cth: string;        // Ex: "1A", "15B" - identifiant local
  numero_wbdr: string;        // Identifiant WFH international
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: 'M' | 'F';
  poids: number | null;
  groupe_sanguin: GroupeSanguin | null;
  type_hemophilie: TypeHemophilie;
  severite: SeveriteHemophilie;
  statut: StatutPatient;
  date_diagnostic: string | null;
  taux_facteur: string | null;  // Ex: "<1%", "0.015", "0.05"
  resultat_bilan_sanguin: string | null;
  circonstances_decouverte: string | null;
  presence_inhibiteurs: boolean;
  traitement_domicile: boolean;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  province: string | null;
  region: string | null;
  district: string | null;
  ethnie: Ethnie | null;
  centre_id: string;           // Centre de rattachement
  centre?: Centre;
  observations: string | null;
  date_deces: string | null;
  created_at: string;
  updated_at: string;
  // Champs calculés
  age?: string;
  derniere_visite?: string;
  nombre_visites?: number;
}

// --- Médicaments (produits référencés) ---
export type TypeFacteur = 'FVIII' | 'FIX' | 'Emicizumab' | 'Bypassing' | 'Autre';
export type IndicationHemophilie = 'Hémophilie A' | 'Hémophilie B' | 'Inhibiteurs' | 'Universel';

export interface Medicament {
  id: string;
  nom: string;              // Ex: "Kovaltry", "Afstyla", "Alprolix"
  nom_complet: string;      // Ex: "Kovaltry 1000 UI"
  dosage: number;           // Ex: 1000
  unite: string;            // "UI" ou "mg"
  type_facteur: TypeFacteur;
  indication: IndicationHemophilie;
  fabricant: string | null;
  conservation: string | null;  // Ex: "2-8°C"
  duree_stabilite_temp_ambiante: string | null;
  image_url: string | null;
  code_atc: string | null;  // Code ATC européen
  created_at: string;
}

// --- Stock (lots en inventaire) ---
export interface LotMedicament {
  id: string;
  medicament_id: string;
  medicament?: Medicament;
  centre_id: string;
  centre?: Centre;
  numero_lot: string;        // Ex: "2714PR7", "P100506556"
  numero_commande: string | null;  // Ex: "S00127"
  pays_expedition: string;
  quantite_recue: number;
  quantite_restante: number;
  date_livraison: string;
  date_expiration: string;
  code_barre: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
  // Champs calculés
  jours_avant_expiration?: number;
  est_proche_expiration?: boolean;
  est_expire?: boolean;
  est_stock_faible?: boolean;
}

// --- Prescriptions (ordonnances médicales) ---
export type StatutPrescription = 'En attente' | 'Dispensée' | 'Annulée' | 'Partiellement dispensée';
export type TypeTraitement = 'Demande' | 'Prophylaxie' | 'Pré-opératoire' | 'Post-opératoire';

export type TypeSaignement =
  | 'Hémarthrose du genou droit'
  | 'Hémarthrose du genou gauche'
  | 'Hémarthrose de la cheville'
  | 'Hémarthrose du coude'
  | 'Hémarthrose de l\'épaule'
  | 'Hémarthrose de la hanche'
  | 'Hématome intramusculaire'
  | 'Hématome sous-dural'
  | 'Hématome du psoas'
  | 'Épistaxis'
  | 'Gingivorragie'
  | 'Hématurie'
  | 'Hémorragie digestive'
  | 'Hémorragie post-circoncision'
  | 'Hémorragie post-traumatique'
  | 'Hémorragie post-opératoire'
  | 'Ecchymose'
  | 'Autre';

export interface Prescription {
  id: string;
  numero: string;           // Auto-généré: CTH-AAAA-XXXX
  patient_id: string;
  patient?: Patient;
  medecin_id: string;
  medecin?: Utilisateur;
  centre_id: string;
  centre?: Centre;
  date_prescription: string;
  type_traitement: TypeTraitement;
  type_saignement: TypeSaignement | null;
  description_chirurgie: string | null;
  autres_precisions: string | null;
  statut: StatutPrescription;
  urgence: boolean;
  lignes: LignePrescription[];
  created_at: string;
}

export interface LignePrescription {
  id: string;
  prescription_id: string;
  medicament_id: string;
  medicament?: Medicament;
  quantite_prescrite: number;  // En UI ou mg
  quantite_dispensee: number;
  posologie: string | null;    // Ex: "500 UI x 2/jour pendant 3 jours"
}

// --- Dispensations (sorties de stock) ---
export interface Dispensation {
  id: string;
  prescription_id: string;
  prescription?: Prescription;
  pharmacien_id: string;
  pharmacien?: Utilisateur;
  lot_id: string;
  lot?: LotMedicament;
  patient_id: string;
  patient?: Patient;
  centre_id: string;
  quantite: number;
  date_dispensation: string;
  observations: string | null;
  created_at: string;
}

// --- Transferts inter-centres ---
export type StatutTransfert = 'Demandé' | 'Approuvé' | 'En transit' | 'Réceptionné' | 'Refusé';

export interface TransfertStock {
  id: string;
  numero: string;          // Auto-généré: TRF-AAAA-XXXX
  centre_source_id: string;
  centre_source?: Centre;
  centre_destination_id: string;
  centre_destination?: Centre;
  demandeur_id: string;
  demandeur?: Utilisateur;
  approbateur_id: string | null;
  approbateur?: Utilisateur;
  statut: StatutTransfert;
  date_demande: string;
  date_approbation: string | null;
  date_expedition: string | null;
  date_reception: string | null;
  motif: string;
  lignes: LigneTransfert[];
  created_at: string;
}

export interface LigneTransfert {
  id: string;
  transfert_id: string;
  lot_id: string;
  lot?: LotMedicament;
  medicament_id: string;
  medicament?: Medicament;
  quantite_demandee: number;
  quantite_envoyee: number | null;
  quantite_recue: number | null;
}

// --- Alertes ---
export type TypeAlerte = 'expiration' | 'stock_faible' | 'suivi_patient' | 'transfert' | 'systeme';
export type NiveauAlerte = 'info' | 'attention' | 'urgent' | 'critique';

export interface Alerte {
  id: string;
  type: TypeAlerte;
  niveau: NiveauAlerte;
  titre: string;
  message: string;
  centre_id: string;
  reference_id: string | null;
  reference_type: string | null;
  lue: boolean;
  created_at: string;
}

// --- Statistiques Dashboard ---
export interface StatistiquesDashboard {
  total_patients: number;
  patients_actifs: number;
  patients_hemophilie_a: number;
  patients_hemophilie_b: number;
  patients_severes: number;
  patients_moderes: number;
  patients_mineurs: number;
  patients_decedes: number;
  total_lots_actifs: number;
  lots_proches_expiration: number;
  lots_expires: number;
  stock_faible_count: number;
  prescriptions_en_attente: number;
  prescriptions_mois: number;
  dispensations_mois: number;
  transferts_en_cours: number;
  alertes_non_lues: number;
  stock_par_type_facteur: { type: string; quantite: number }[];
  consommation_mensuelle: { mois: string; quantite: number }[];
  top_medicaments: { nom: string; quantite: number }[];
  patients_par_centre: { centre: string; count: number }[];
  repartition_severite: { severite: string; count: number }[];
}
