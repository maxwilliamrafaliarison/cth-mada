// ============================================================
// CTH Madagascar — Role-Based Access Control (RBAC)
// ============================================================

export type Role = 'administrateur' | 'medecin' | 'pharmacien';

export type Resource =
  | 'patients'
  | 'lots'
  | 'prescriptions'
  | 'dispensations'
  | 'transferts'
  | 'journal_pharmacie'
  | 'admin'
  | 'alertes'
  | 'rapports';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'read_deleted' | 'confirm' | 'manage_users';

const PERMISSIONS: Record<Role, Partial<Record<Resource, Action[]>>> = {
  administrateur: {
    patients: ['read', 'create', 'update', 'delete', 'read_deleted'],
    lots: ['read', 'create', 'update', 'delete', 'read_deleted'],
    prescriptions: ['read', 'create', 'update'],
    dispensations: ['read', 'create'],
    transferts: ['read', 'create', 'update'],
    journal_pharmacie: ['read'],
    admin: ['read', 'manage_users'],
    alertes: ['read', 'create', 'update', 'delete'],
    rapports: ['read'],
  },
  medecin: {
    patients: ['read', 'create', 'update', 'delete'],
    lots: ['read'],
    prescriptions: ['read', 'create', 'update'],
    dispensations: ['read'],
    transferts: ['read', 'create'],
    journal_pharmacie: [],
    admin: [],
    alertes: ['read'],
    rapports: ['read'],
  },
  pharmacien: {
    patients: ['read'],
    lots: ['read', 'create', 'update', 'delete'],
    prescriptions: ['read', 'confirm'],
    dispensations: ['read', 'create'],
    transferts: ['read', 'create', 'update'],
    journal_pharmacie: [],
    admin: [],
    alertes: ['read', 'create'],
    rapports: ['read'],
  },
};

export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;
  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;
  return resourcePermissions.includes(action);
}

// Navigation items visibility per role
const HIDDEN_ROUTES: Record<Role, string[]> = {
  administrateur: [],
  medecin: ['/dashboard/admin', '/dashboard/journal', '/dashboard/dispensation'],
  pharmacien: ['/dashboard/admin', '/dashboard/journal'],
};

export function canAccessRoute(role: Role, path: string): boolean {
  const hidden = HIDDEN_ROUTES[role] || [];
  return !hidden.some(h => path.startsWith(h));
}

// Labels for roles
export const ROLE_LABELS: Record<Role, string> = {
  administrateur: 'Administrateur',
  medecin: 'Médecin',
  pharmacien: 'Pharmacien',
};

export const ROLE_LABELS_SHORT: Record<Role, string> = {
  administrateur: 'Admin',
  medecin: 'Dr',
  pharmacien: 'Pharm.',
};
