-- ============================================================
-- CTH MADAGASCAR — Schéma complet de la base de données
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. CENTRES DE TRAITEMENT
CREATE TABLE IF NOT EXISTS centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  ville TEXT NOT NULL,
  province TEXT NOT NULL,
  adresse TEXT,
  telephone TEXT,
  email TEXT,
  responsable TEXT,
  est_central BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. UTILISATEURS (profils liés à auth.users)
CREATE TABLE IF NOT EXISTS utilisateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('administrateur', 'medecin', 'pharmacien')),
  centre_id UUID REFERENCES centres(id),
  actif BOOLEAN DEFAULT TRUE,
  telephone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_cth TEXT NOT NULL,
  numero_wbdr TEXT,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  sexe TEXT NOT NULL CHECK (sexe IN ('M', 'F')),
  poids NUMERIC,
  groupe_sanguin TEXT,
  type_hemophilie TEXT NOT NULL CHECK (type_hemophilie IN ('HA', 'HB')),
  severite TEXT NOT NULL CHECK (severite IN ('Sévère', 'Modérée', 'Mineure')),
  statut TEXT NOT NULL DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Inactif', 'Décédé')),
  date_diagnostic DATE,
  taux_facteur TEXT,
  resultat_bilan_sanguin TEXT,
  circonstances_decouverte TEXT,
  presence_inhibiteurs BOOLEAN DEFAULT FALSE,
  traitement_domicile BOOLEAN DEFAULT FALSE,
  adresse TEXT,
  telephone TEXT,
  email TEXT,
  province TEXT,
  region TEXT,
  district TEXT,
  ethnie TEXT,
  centre_id UUID REFERENCES centres(id),
  observations TEXT,
  date_deces DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. MÉDICAMENTS (catalogue)
CREATE TABLE IF NOT EXISTS medicaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  nom_complet TEXT NOT NULL,
  dosage NUMERIC NOT NULL,
  unite TEXT NOT NULL,
  type_facteur TEXT NOT NULL CHECK (type_facteur IN ('FVIII', 'FIX', 'Emicizumab', 'Bypassing', 'Autre')),
  indication TEXT NOT NULL,
  fabricant TEXT,
  conservation TEXT,
  duree_stabilite_temp_ambiante TEXT,
  image_url TEXT,
  code_atc TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. LOTS EN STOCK
CREATE TABLE IF NOT EXISTS lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicament_id UUID NOT NULL REFERENCES medicaments(id),
  centre_id UUID NOT NULL REFERENCES centres(id),
  numero_lot TEXT NOT NULL,
  numero_commande TEXT,
  pays_expedition TEXT DEFAULT 'Madagascar',
  quantite_recue INTEGER NOT NULL,
  quantite_restante INTEGER NOT NULL,
  date_livraison DATE NOT NULL,
  date_expiration DATE NOT NULL,
  code_barre TEXT,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id),
  medecin_id UUID REFERENCES utilisateurs(id),
  centre_id UUID REFERENCES centres(id),
  date_prescription DATE NOT NULL DEFAULT CURRENT_DATE,
  type_traitement TEXT NOT NULL CHECK (type_traitement IN ('Demande', 'Prophylaxie', 'Pré-opératoire', 'Post-opératoire')),
  type_saignement TEXT,
  description_chirurgie TEXT,
  autres_precisions TEXT,
  statut TEXT NOT NULL DEFAULT 'En attente' CHECK (statut IN ('En attente', 'Dispensée', 'Annulée', 'Partiellement dispensée')),
  urgence BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. LIGNES DE PRESCRIPTION
CREATE TABLE IF NOT EXISTS lignes_prescription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicament_id UUID NOT NULL REFERENCES medicaments(id),
  quantite_prescrite INTEGER NOT NULL,
  quantite_dispensee INTEGER DEFAULT 0,
  posologie TEXT
);

-- 8. DISPENSATIONS
CREATE TABLE IF NOT EXISTS dispensations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id),
  pharmacien_id UUID REFERENCES utilisateurs(id),
  lot_id UUID REFERENCES lots(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  centre_id UUID REFERENCES centres(id),
  quantite INTEGER NOT NULL,
  date_dispensation TIMESTAMPTZ DEFAULT now(),
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. TRANSFERTS INTER-CENTRES
CREATE TABLE IF NOT EXISTS transferts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  centre_source_id UUID NOT NULL REFERENCES centres(id),
  centre_destination_id UUID NOT NULL REFERENCES centres(id),
  demandeur_id UUID REFERENCES utilisateurs(id),
  approbateur_id UUID REFERENCES utilisateurs(id),
  statut TEXT NOT NULL DEFAULT 'Demandé' CHECK (statut IN ('Demandé', 'Approuvé', 'En transit', 'Réceptionné', 'Refusé')),
  date_demande DATE NOT NULL DEFAULT CURRENT_DATE,
  date_approbation DATE,
  date_expedition DATE,
  date_reception DATE,
  motif TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. LIGNES DE TRANSFERT
CREATE TABLE IF NOT EXISTS lignes_transfert (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfert_id UUID NOT NULL REFERENCES transferts(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES lots(id),
  medicament_id UUID NOT NULL REFERENCES medicaments(id),
  quantite_demandee INTEGER NOT NULL,
  quantite_envoyee INTEGER,
  quantite_recue INTEGER
);

-- 11. ALERTES
CREATE TABLE IF NOT EXISTS alertes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('expiration', 'stock_faible', 'suivi_patient', 'transfert', 'systeme')),
  niveau TEXT NOT NULL CHECK (niveau IN ('info', 'attention', 'urgent', 'critique')),
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  centre_id UUID REFERENCES centres(id),
  reference_id UUID,
  reference_type TEXT,
  lue BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. LOGS D'AUTHENTIFICATION
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEX pour les performances
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_patients_centre ON patients(centre_id);
CREATE INDEX IF NOT EXISTS idx_patients_type ON patients(type_hemophilie);
CREATE INDEX IF NOT EXISTS idx_patients_statut ON patients(statut);
CREATE INDEX IF NOT EXISTS idx_lots_medicament ON lots(medicament_id);
CREATE INDEX IF NOT EXISTS idx_lots_centre ON lots(centre_id);
CREATE INDEX IF NOT EXISTS idx_lots_expiration ON lots(date_expiration);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_statut ON prescriptions(statut);
CREATE INDEX IF NOT EXISTS idx_alertes_lue ON alertes(lue);
CREATE INDEX IF NOT EXISTS idx_alertes_type ON alertes(type);

-- ============================================================
-- Fonction auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER lots_updated_at BEFORE UPDATE ON lots FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_prescription ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispensations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_transfert ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Politiques : les utilisateurs authentifiés peuvent lire toutes les données
CREATE POLICY "Authenticated users can read centres" ON centres FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read utilisateurs" ON utilisateurs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read patients" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read medicaments" ON medicaments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read lots" ON lots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read prescriptions" ON prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read lignes_prescription" ON lignes_prescription FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read dispensations" ON dispensations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read transferts" ON transferts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read lignes_transfert" ON lignes_transfert FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read alertes" ON alertes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read auth_logs" ON auth_logs FOR SELECT TO authenticated USING (true);

-- Politiques INSERT/UPDATE/DELETE pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert patients" ON patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update patients" ON patients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete patients" ON patients FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert lots" ON lots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update lots" ON lots FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete lots" ON lots FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert prescriptions" ON prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update prescriptions" ON prescriptions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert lignes_prescription" ON lignes_prescription FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update lignes_prescription" ON lignes_prescription FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert dispensations" ON dispensations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert transferts" ON transferts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update transferts" ON transferts FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert lignes_transfert" ON lignes_transfert FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert alertes" ON alertes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update alertes" ON alertes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete alertes" ON alertes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert auth_logs" ON auth_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Service role bypass pour les opérations serveur
CREATE POLICY "Service role full access centres" ON centres FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access utilisateurs" ON utilisateurs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access patients" ON patients FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access medicaments" ON medicaments FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access lots" ON lots FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access prescriptions" ON prescriptions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access lignes_prescription" ON lignes_prescription FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access dispensations" ON dispensations FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access transferts" ON transferts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access lignes_transfert" ON lignes_transfert FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access alertes" ON alertes FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access auth_logs" ON auth_logs FOR ALL TO service_role USING (true);

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

-- Centres
INSERT INTO centres (id, code, nom, ville, province, adresse, telephone, email, responsable, est_central) VALUES
  ('00000000-0000-0000-0000-000000000001', 'CTH_ANTANANARIVO', 'CTH Antananarivo (CHU-JRA)', 'Antananarivo', 'Analamanga', 'CHU-JRA Ampefiloha', '+261 20 22 XXX XX', 'cth.tana@cth-madagascar.mg', 'Dr FETY André', true),
  ('00000000-0000-0000-0000-000000000002', 'CTH_FIANARANTSOA', 'CTH Fianarantsoa', 'Fianarantsoa', 'Haute Matsiatra', 'CHU Fianarantsoa', '+261 20 75 XXX XX', 'cth.fianar@cth-madagascar.mg', 'Dr Responsable Fianar', false),
  ('00000000-0000-0000-0000-000000000003', 'CTH_MAHAJANGA', 'CTH Mahajanga', 'Mahajanga', 'Boeny', 'CHU Mahajanga', '+261 20 62 XXX XX', 'cth.majunga@cth-madagascar.mg', 'Dr Responsable Majunga', false),
  ('00000000-0000-0000-0000-000000000004', 'CTH_TOAMASINA', 'CTH Toamasina', 'Toamasina', 'Atsinanana', 'CHU Toamasina', '+261 20 53 XXX XX', 'cth.tamatave@cth-madagascar.mg', 'Dr Responsable Tamatave', false),
  ('00000000-0000-0000-0000-000000000005', 'CTH_TOLIARA', 'CTH Toliara', 'Toliara', 'Atsimo-Andrefana', 'CHU Toliara', '+261 20 94 XXX XX', 'cth.tulear@cth-madagascar.mg', 'Dr Responsable Tulear', false),
  ('00000000-0000-0000-0000-000000000006', 'CTH_ANTSIRANANA', 'CTH Antsiranana', 'Antsiranana', 'Diana', 'CHU Antsiranana', '+261 20 82 XXX XX', 'cth.diego@cth-madagascar.mg', 'Dr Responsable Diego', false),
  ('00000000-0000-0000-0000-000000000007', 'CTH_ITASY', 'CTH Itasy', 'Miarinarivo', 'Itasy', 'CHD Itasy', '+261 20 44 XXX XX', 'cth.itasy@cth-madagascar.mg', 'Dr Responsable Itasy', false),
  ('00000000-0000-0000-0000-000000000008', 'CTH_ANTSIRABE', 'CTH Antsirabe', 'Antsirabe', 'Vakinankaratra', 'CHU Antsirabe', '+261 20 44 XXX XX', 'cth.antsirabe@cth-madagascar.mg', 'Dr Responsable Antsirabe', false);

-- Médicaments
INSERT INTO medicaments (id, nom, nom_complet, dosage, unite, type_facteur, indication, fabricant, conservation, duree_stabilite_temp_ambiante, code_atc) VALUES
  ('00000000-0000-0000-0001-000000000001', 'Kovaltry', 'Kovaltry 500 UI', 500, 'UI', 'FVIII', 'Hémophilie A', 'Bayer', '2-8°C', '12 mois max 25°C', 'B02BD02'),
  ('00000000-0000-0000-0001-000000000002', 'Kovaltry', 'Kovaltry 1000 UI', 1000, 'UI', 'FVIII', 'Hémophilie A', 'Bayer', '2-8°C', '12 mois max 25°C', 'B02BD02'),
  ('00000000-0000-0000-0001-000000000003', 'Afstyla', 'Afstyla 500 UI', 500, 'UI', 'FVIII', 'Hémophilie A', 'CSL Behring', '2-8°C', '3 mois max 25°C', 'B02BD'),
  ('00000000-0000-0000-0001-000000000004', 'Afstyla', 'Afstyla 1000 UI', 1000, 'UI', 'FVIII', 'Hémophilie A', 'CSL Behring', '2-8°C', '3 mois max 25°C', 'B02BD'),
  ('00000000-0000-0000-0001-000000000005', 'Eloctate', 'Eloctate 500 UI', 500, 'UI', 'FVIII', 'Hémophilie A', 'Sanofi', '2-8°C', '6 mois max 30°C', 'B02BD02'),
  ('00000000-0000-0000-0001-000000000006', 'Eloctate', 'Eloctate 1000 UI', 1000, 'UI', 'FVIII', 'Hémophilie A', 'Sanofi', '2-8°C', '6 mois max 30°C', 'B02BD02'),
  ('00000000-0000-0000-0001-000000000007', 'Hemlibra', 'Hemlibra 30 mg', 30, 'mg', 'Emicizumab', 'Hémophilie A', 'Roche', '2-8°C', '7 jours max 30°C', 'B02BX06'),
  ('00000000-0000-0000-0001-000000000008', 'Alprolix', 'Alprolix 500 UI', 500, 'UI', 'FIX', 'Hémophilie B', 'Sanofi', '2-8°C', '6 mois max 30°C', 'B02BD04'),
  ('00000000-0000-0000-0001-000000000009', 'Alprolix', 'Alprolix 1000 UI', 1000, 'UI', 'FIX', 'Hémophilie B', 'Sanofi', '2-8°C', '6 mois max 30°C', 'B02BD04'),
  ('00000000-0000-0000-0001-000000000010', 'NovoSeven', 'NovoSeven 1 mg', 1, 'mg', 'Bypassing', 'Inhibiteurs', 'Novo Nordisk', '2-8°C', '24h après reconstitution', 'B02BD08'),
  ('00000000-0000-0000-0001-000000000011', 'Octaplex', 'Octaplex 500 UI', 500, 'UI', 'Bypassing', 'Inhibiteurs', 'Octapharma', '2-25°C', 'Toute la durée de validité', 'B02BD01');

-- Patients (données réelles extraites du fichier Excel)
INSERT INTO patients (id, numero_cth, numero_wbdr, nom, prenom, date_naissance, sexe, poids, groupe_sanguin, type_hemophilie, severite, statut, date_diagnostic, taux_facteur, circonstances_decouverte, presence_inhibiteurs, traitement_domicile, adresse, telephone, province, centre_id, observations, date_deces) VALUES
  ('00000000-0000-0000-0002-000000000001', '1A', '19710', 'RALAITSIROFO', 'Andriniaina Antonio', '2009-12-23', 'M', 26, 'O+', 'HA', 'Sévère', 'Actif', '2012-12-13', '0.015', 'Hémorragie labiale post-morsure', false, false, 'BM 353 Ambohidravaka Ampitatafika', '033 03 056 12', 'Analamanga', '00000000-0000-0000-0000-000000000001', NULL, NULL),
  ('00000000-0000-0000-0002-000000000002', '2A', '8362', 'RANDRIANARISOA', 'Nasolo Fitiavana Gabrielle', '2011-06-04', 'M', 28, 'B+', 'HA', 'Sévère', 'Actif', '2015-10-09', '<1%', NULL, false, false, 'IVY 348 AB Bis Anosipatrana Ouest', '033 12 175 67', 'Analamanga', '00000000-0000-0000-0000-000000000001', NULL, NULL),
  ('00000000-0000-0000-0002-000000000003', '3A', '19711', 'TOVONDRAHA', 'Alpha Hassan', '1998-02-28', 'M', 60, 'B+', 'HA', 'Modérée', 'Actif', '2010-08-16', '0.01', NULL, false, false, 'Tsimenatse I Tuléar', '034 93 479 50', 'Atsimo-Andrefana', '00000000-0000-0000-0000-000000000005', NULL, NULL),
  ('00000000-0000-0000-0002-000000000004', '1B', '19670', 'ANDRIANJATOVO', 'Nasanda (Tovo kely)', '2011-07-25', 'M', 28, NULL, 'HB', 'Modérée', 'Actif', '2016-07-29', '0.012', NULL, false, false, 'Mahasolo Zone III', '033 90 820 07', NULL, '00000000-0000-0000-0000-000000000001', NULL, NULL),
  ('00000000-0000-0000-0002-000000000005', '14B', '8366', 'THONY', 'Razafy', '2005-09-05', 'M', 60, NULL, 'HB', 'Sévère', 'Actif', '2006-07-06', '<1%', NULL, false, true, 'Vontovorona', '034 18 771 53', 'Analamanga', '00000000-0000-0000-0000-000000000001', NULL, NULL),
  ('00000000-0000-0000-0002-000000000006', '17B', '18642', 'RANDRIAMAMPIANINA', 'Tsiafoy', '2005-07-29', 'M', 49, NULL, 'HB', 'Modérée', 'Actif', NULL, '0.045', NULL, false, true, 'Lot IIL 68bis Andranomahery', '033 49 075 63', 'Analamanga', '00000000-0000-0000-0000-000000000001', NULL, NULL),
  ('00000000-0000-0000-0002-000000000007', '61A', '19731', 'ABENDRAZA', 'Mihaja Harilanto', '1996-01-09', 'M', NULL, 'O+', 'HA', 'Sévère', 'Décédé', '2012-12-12', '0.014', NULL, false, false, 'lot 2B90Bis Manjakaray', '032 92 363 82', 'Analamanga', '00000000-0000-0000-0000-000000000001', 'Décédé le 03 janvier 2021', '2021-01-03'),
  ('00000000-0000-0000-0002-000000000008', '16A', '18522', 'ANDRIANIRINA', 'Toky Nantenaina Mirado', '2010-05-23', 'M', 28, 'B+', 'HA', 'Sévère', 'Actif', '2013-05-22', '<1%', NULL, false, false, '07.08.E30 Ambohimena Antsirabe', '033 45 256 47', 'Vakinankaratra', '00000000-0000-0000-0000-000000000008', NULL, NULL);

-- Lots en stock
INSERT INTO lots (id, medicament_id, centre_id, numero_lot, numero_commande, quantite_recue, quantite_restante, date_livraison, date_expiration) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', '2714PR7', 'S00127', 800, 320, '2023-02-24', '2026-09-07'),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'B0138B01', 'S00420', 1008, 45, '2023-09-18', '2026-07-31'),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'B4193B01', 'S01113', 1134, 890, '2024-05-23', '2027-02-28'),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'P100506556', 'S01151', 490, 200, '2024-05-23', '2026-10-18'),
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'P100640343', 'S01151', 120, 95, '2024-05-23', '2027-03-16'),
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', '2714W7J', 'S01167', 600, 150, '2024-03-26', '2026-12-16'),
  ('00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0001-000000000009', '00000000-0000-0000-0000-000000000001', 'PC2230', 'S01167', 100, 42, '2024-03-26', '2027-10-31'),
  ('00000000-0000-0000-0003-000000000008', '00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'PC2245', 'S01167', 100, 68, '2024-03-26', '2028-12-31'),
  ('00000000-0000-0000-0003-000000000009', '00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000001', 'P100537592', 'S01200', 200, 85, '2024-09-15', '2027-06-30'),
  ('00000000-0000-0000-0003-000000000010', '00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000001', 'PC2336', 'S01200', 300, 125, '2024-09-15', '2027-03-15'),
  ('00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000002', 'P100700112', 'TRF-001', 50, 30, '2025-01-15', '2027-01-15'),
  ('00000000-0000-0000-0003-000000000012', '00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000002', 'PC2400', 'TRF-002', 40, 18, '2025-02-10', '2027-05-20'),
  ('00000000-0000-0000-0003-000000000013', '00000000-0000-0000-0001-000000000010', '00000000-0000-0000-0000-000000000001', 'NS2025X', 'S01300', 50, 8, '2025-06-01', '2026-06-15');

-- Alertes
INSERT INTO alertes (type, niveau, titre, message, centre_id, reference_id, reference_type, lue) VALUES
  ('expiration', 'urgent', 'NovoSeven proche expiration', 'Le lot NS2025X de NovoSeven 1 mg expire le 15/06/2026 (70 jours restants). 8 unités restantes.', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000013', 'lot', false),
  ('stock_faible', 'attention', 'Stock faible - NovoSeven', 'Seulement 8 unités de NovoSeven 1 mg restantes au CTH Antananarivo.', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000013', 'lot', false),
  ('stock_faible', 'attention', 'Stock faible - Hemlibra', 'Seulement 45 unités de Hemlibra 30 mg (lot B0138B01) restantes au CTH Antananarivo.', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000002', 'lot', false),
  ('suivi_patient', 'info', 'Rappel suivi patient', 'Le patient THONY Razafy (14B) n''a pas eu de visite de suivi depuis plus de 60 jours.', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000005', 'patient', true),
  ('transfert', 'info', 'Demande de transfert reçue', 'Le CTH Fianarantsoa demande un approvisionnement en Alprolix 500 UI (20 unités).', '00000000-0000-0000-0000-000000000001', NULL, 'transfert', false);

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
