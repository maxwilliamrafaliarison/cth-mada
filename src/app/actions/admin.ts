'use server';

import { createAdminClient, requireAuth } from '@/lib/supabase-server';
import type { Role } from '@/lib/rbac';

export async function getUtilisateurs() {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (role !== 'administrateur') {
    throw new Error('Accès refusé: seuls les administrateurs peuvent voir la liste des utilisateurs.');
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('utilisateurs')
    .select('*, centre:centres(nom, ville)')
    .order('nom', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}
