'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getLots(filters?: {
  search?: string;
  medicament_id?: string;
  centre_id?: string;
  statut?: string;
}) {
  const supabase = createAdminClient();
  let query = supabase
    .from('lots')
    .select('*, medicament:medicaments(*), centre:centres(nom, code)')
    .order('date_expiration', { ascending: true });

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
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('medicaments')
    .select('*')
    .order('nom_complet', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getCentres() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('centres')
    .select('*')
    .order('nom', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createLot(lotData: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('lots')
    .insert(lotData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/stock');
  return data;
}

export async function updateLot(id: string, lotData: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('lots')
    .update(lotData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/stock');
  return data;
}

export async function deleteLot(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('lots')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/stock');
}
