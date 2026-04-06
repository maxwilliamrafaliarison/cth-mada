'use server';

import { createAdminClient, requireAuth } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { hasPermission } from '@/lib/rbac';
import type { Role } from '@/lib/rbac';

export async function getTransferts(filters?: {
  statut?: string;
  centre_id?: string;
}) {
  await requireAuth();
  const supabase = createAdminClient();
  let query = supabase
    .from('transferts')
    .select('*, centre_source:centres!transferts_centre_source_id_fkey(nom, code), centre_destination:centres!transferts_centre_destination_id_fkey(nom, code), demandeur:utilisateurs!transferts_demandeur_id_fkey(nom, prenom), lignes:lignes_transfert(*, medicament:medicaments(nom_complet, type_facteur))')
    .order('created_at', { ascending: false });

  if (filters?.statut && filters.statut !== 'all') {
    query = query.eq('statut', filters.statut);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createTransfert(transfertData: Record<string, unknown>, lignes: Record<string, unknown>[]) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'transferts', 'create')) {
    throw new Error('Permission refusée: vous ne pouvez pas créer de transferts.');
  }

  const supabase = createAdminClient();

  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('transferts')
    .select('*', { count: 'exact', head: true });
  const numero = `TRF-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

  const { data, error } = await supabase
    .from('transferts')
    .insert({ ...transfertData, numero, demandeur_id: profile.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (lignes.length > 0) {
    const lignesWithTransfert = lignes.map(l => ({
      ...l,
      transfert_id: data.id,
    }));
    const { error: lignesError } = await supabase
      .from('lignes_transfert')
      .insert(lignesWithTransfert);
    if (lignesError) throw new Error(lignesError.message);
  }

  revalidatePath('/dashboard/transferts');
  return data;
}

export async function updateTransfertStatut(id: string, statut: string, extraData?: Record<string, unknown>) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'transferts', 'update')) {
    throw new Error('Permission refusée: vous ne pouvez pas modifier ce transfert.');
  }

  const supabase = createAdminClient();
  const updateData: Record<string, unknown> = { statut, ...extraData };

  const { error } = await supabase
    .from('transferts')
    .update(updateData)
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/transferts');
}
