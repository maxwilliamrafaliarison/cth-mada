'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getAlertes(filters?: {
  type?: string;
  lue?: boolean;
}) {
  const supabase = createAdminClient();
  let query = supabase
    .from('alertes')
    .select('*, centre:centres(nom)')
    .order('created_at', { ascending: false });

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }
  if (filters?.lue !== undefined) {
    query = query.eq('lue', filters.lue);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function markAlertAsRead(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('alertes')
    .update({ lue: true })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/alertes');
}

export async function markAllAlertsAsRead() {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('alertes')
    .update({ lue: true })
    .eq('lue', false);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/alertes');
}

export async function deleteAlerte(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('alertes')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/alertes');
}

export async function createAlerte(alerteData: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('alertes')
    .insert(alerteData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/alertes');
  return data;
}
