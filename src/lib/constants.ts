import type { CentreId, TypeFacteur, IndicationHemophilie } from '@/types';

export const CENTRES: { code: CentreId; nom: string; ville: string; province: string; est_central: boolean }[] = [
  { code: 'CTH_ANTANANARIVO', nom: 'CTH Antananarivo (CHU-JRA)', ville: 'Antananarivo', province: 'Analamanga', est_central: true },
  { code: 'CTH_FIANARANTSOA', nom: 'CTH Fianarantsoa', ville: 'Fianarantsoa', province: 'Haute Matsiatra', est_central: false },
  { code: 'CTH_MAHAJANGA', nom: 'CTH Mahajanga', ville: 'Mahajanga', province: 'Boeny', est_central: false },
  { code: 'CTH_TOAMASINA', nom: 'CTH Toamasina', ville: 'Toamasina', province: 'Atsinanana', est_central: false },
  { code: 'CTH_TOLIARA', nom: 'CTH Toliara', ville: 'Toliara', province: 'Atsimo-Andrefana', est_central: false },
  { code: 'CTH_ANTSIRANANA', nom: 'CTH Antsiranana', ville: 'Antsiranana', province: 'Diana', est_central: false },
  { code: 'CTH_ITASY', nom: 'CTH Itasy', ville: 'Miarinarivo', province: 'Itasy', est_central: false },
  { code: 'CTH_ANTSIRABE', nom: 'CTH Antsirabe', ville: 'Antsirabe', province: 'Vakinankaratra', est_central: false },
];

export const MEDICAMENTS_REFERENCE: {
  nom: string;
  dosages: number[];
  unite: string;
  type_facteur: TypeFacteur;
  indication: IndicationHemophilie;
  fabricant: string;
  image: string;
}[] = [
  // Facteur VIII - Hémophilie A
  { nom: 'Kovaltry', dosages: [500, 1000], unite: 'UI', type_facteur: 'FVIII', indication: 'Hémophilie A', fabricant: 'Bayer', image: '/images/kovaltry.png' },
  { nom: 'Afstyla', dosages: [500, 1000, 1500], unite: 'UI', type_facteur: 'FVIII', indication: 'Hémophilie A', fabricant: 'CSL Behring', image: '/images/afstyla.jpg' },
  { nom: 'Eloctate', dosages: [500, 750, 1000], unite: 'UI', type_facteur: 'FVIII', indication: 'Hémophilie A', fabricant: 'Sanofi', image: '/images/eloctate.jpg' },
  { nom: 'Koate DVI', dosages: [250, 500], unite: 'UI', type_facteur: 'FVIII', indication: 'Hémophilie A', fabricant: 'Grifols', image: '/images/koate-dvi.jpg' },
  { nom: 'Alphanate', dosages: [500], unite: 'UI', type_facteur: 'FVIII', indication: 'Hémophilie A', fabricant: 'Grifols', image: '/images/alphanate.jpg' },
  { nom: 'Advate', dosages: [250], unite: 'UI', type_facteur: 'FVIII', indication: 'Hémophilie A', fabricant: 'Takeda', image: '/images/advate.jpg' },
  // Facteur IX - Hémophilie B
  { nom: 'Alprolix', dosages: [250, 500, 1000], unite: 'UI', type_facteur: 'FIX', indication: 'Hémophilie B', fabricant: 'Sanofi', image: '/images/alprolix.jpeg' },
  { nom: 'BeneFIX', dosages: [250, 500, 1000], unite: 'UI', type_facteur: 'FIX', indication: 'Hémophilie B', fabricant: 'Pfizer', image: '/images/benefix.jpg' },
  { nom: 'Haemonine', dosages: [500, 1000], unite: 'UI', type_facteur: 'FIX', indication: 'Hémophilie B', fabricant: 'Biotest', image: '/images/haemonine.jpg' },
  { nom: 'OCTAFIX', dosages: [500, 1000], unite: 'UI', type_facteur: 'FIX', indication: 'Hémophilie B', fabricant: 'Octapharma', image: '/images/octafix.jpg' },
  // Emicizumab - Hémophilie A (avec ou sans inhibiteurs)
  { nom: 'Hemlibra', dosages: [30], unite: 'mg', type_facteur: 'Emicizumab', indication: 'Hémophilie A', fabricant: 'Roche', image: '/images/hemlibra.webp' },
  // Agents bypassing - Patients avec inhibiteurs
  { nom: 'NovoSeven', dosages: [1], unite: 'mg', type_facteur: 'Bypassing', indication: 'Inhibiteurs', fabricant: 'Novo Nordisk', image: '/images/novoseven.jpg' },
  { nom: 'Octaplex', dosages: [500], unite: 'UI', type_facteur: 'Bypassing', indication: 'Inhibiteurs', fabricant: 'Octapharma', image: '/images/octaplex.png' },
];

export const SEUIL_ALERTE_EXPIRATION_JOURS = 90;
export const SEUIL_STOCK_FAIBLE = 10;

export const COULEURS = {
  primary: '#001965',      // Navy blue (NNHF)
  secondary: '#C72127',    // Crimson red
  accent: '#3B97DE',       // Light blue
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Amber
  danger: '#EF4444',       // Red
  info: '#6366F1',         // Indigo
  background: '#F0F4F8',   // Light grey-blue
  glass: 'rgba(255, 255, 255, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
} as const;

export const NAVIGATION = [
  { nom: 'Tableau de bord', href: '/dashboard', icon: 'LayoutDashboard' },
  { nom: 'Patients', href: '/dashboard/patients', icon: 'Users' },
  { nom: 'Stock', href: '/dashboard/stock', icon: 'Package' },
  { nom: 'Prescriptions', href: '/dashboard/prescriptions', icon: 'ClipboardList' },
  { nom: 'Dispensation', href: '/dashboard/dispensation', icon: 'Pill' },
  { nom: 'Transferts', href: '/dashboard/transferts', icon: 'ArrowLeftRight' },
  { nom: 'Scanner', href: '/dashboard/scanner', icon: 'ScanBarcode' },
  { nom: 'Rapports', href: '/dashboard/rapports', icon: 'FileText' },
  { nom: 'Alertes', href: '/dashboard/alertes', icon: 'Bell' },
  { nom: 'Administration', href: '/dashboard/admin', icon: 'Settings' },
] as const;
