'use server';

import { createAdminClient, requireAuth } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { hasPermission } from '@/lib/rbac';
import type { Role } from '@/lib/rbac';

export async function getLots(filters?: {
  search?: string;
  medicament_id?: string;
  centre_id?: string;
  statut?: string;
  include_deleted?: boolean;
}) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  const supabase = createAdminClient();
  let query = supabase
    .from('lots')
    .select('*, medicament:medicaments(*), centre:centres(nom, code)')
    .order('date_expiration', { ascending: true });

  // Only admins can see soft-deleted lots
  if (filters?.include_deleted && hasPermission(role, 'lots', 'read_deleted')) {
    // show all
  } else {
    query = query.is('deleted_at', null);
  }

  if (filters?.medicament_id && filters.medicament_id !== 'all') {
    query = query.eq('medicament_id', filters.medicament_id);
  }
  if (filters?.centre_id && filters.centre_id !== 'all') {
    query = query.eq('centre_id', filters.centre_id);
  }
  if (filters?.search) {
    query = query.ilike('numero_lot', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getMedicaments() {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('medicaments')
    .select('*')
    .order('nom_complet', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getCentres() {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('centres')
    .select('*')
    .order('nom', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createLot(lotData: Record<string, unknown>) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'lots', 'create')) {
    throw new Error('Permission refusée: vous ne pouvez pas créer de lots.');
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('lots')
    .insert(lotData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Auto-journal entry for pharmacie
  if (role === 'pharmacien' || role === 'administrateur') {
    await supabase.from('journal_pharmacie').insert({
      utilisateur_id: profile.id,
      action: 'ajout_lot',
      details: { lot_id: data.id, numero_lot: lotData.numero_lot, quantite: lotData.quantite_initiale },
      centre_id: lotData.centre_id || profile.centre_id,
    });
  }

  revalidatePath('/dashboard/stock');
  return data;
}

export async function updateLot(id: string, lotData: Record<string, unknown>) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'lots', 'update')) {
    throw new Error('Permission refusée: vous ne pouvez pas modifier de lots.');
  }

  const supabase = createAdminClient();

  // Get old lot data for journal
  const { data: oldLot } = await supabase.from('lots').select('*').eq('id', id).single();

  const { data, error } = await supabase
    .from('lots')
    .update(lotData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Auto-journal
  if (role === 'pharmacien' || role === 'administrateur') {
    await supabase.from('journal_pharmacie').insert({
      utilisateur_id: profile.id,
      action: 'modification_lot',
      details: {
        lot_id: id,
        ancien: oldLot ? { quantite_restante: oldLot.quantite_restante } : null,
        nouveau: { quantite_restante: lotData.quantite_restante },
      },
      centre_id: data.centre_id || profile.centre_id,
    });
  }

  revalidatePath('/dashboard/stock');
  return data;
}

// Soft delete
export async function deleteLot(id: string) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'lots', 'delete')) {
    throw new Error('Permission refusée: vous ne pouvez pas supprimer de lots.');
  }

  const supabase = createAdminClient();

  // Get lot info for journal
  const { data: lot } = await supabase.from('lots').select('numero_lot, centre_id').eq('id', id).single();

  const { error } = await supabase
    .from('lots')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);

  // Auto-journal
  await supabase.from('journal_pharmacie').insert({
    utilisateur_id: profile.id,
    action: 'suppression_lot',
    details: { lot_id: id, numero_lot: lot?.numero_lot },
    centre_id: lot?.centre_id || profile.centre_id,
  });

  revalidatePath('/dashboard/stock');
}

// Admin-only: restore soft-deleted lot
export async function restoreLot(id: string) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'lots', 'read_deleted')) {
    throw new Error('Permission refusée.');
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('lots')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/stock');
}
