'use server';

import { createAdminClient, requireAuth } from '@/lib/supabase-server';
import type { Role } from '@/lib/rbac';

export async function getJournalPharmacie(filters?: {
  centre_id?: string;
  action?: string;
  limit?: number;
}) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  // Only admin can view journal
  if (role !== 'administrateur') {
    throw new Error('Accès refusé: seuls les administrateurs peuvent consulter le journal.');
  }

  const supabase = createAdminClient();
  let query = supabase
    .from('journal_pharmacie')
    .select('*, utilisateur:utilisateurs(nom, prenom, role), centre:centres(nom, code)')
    .order('created_at', { ascending: false })
    .limit(filters?.limit || 100);

  if (filters?.centre_id && filters.centre_id !== 'all') {
    query = query.eq('centre_id', filters.centre_id);
  }
  if (filters?.action && filters.action !== 'all') {
    query = query.eq('action', filters.action);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}
