'use server';

import { createAdminClient, requireAuth } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { hasPermission } from '@/lib/rbac';
import type { Role } from '@/lib/rbac';

export async function getAlertes(filters?: {
  type?: string;
  lue?: boolean;
}) {
  await requireAuth();
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
  await requireAuth();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('alertes')
    .update({ lue: true })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/alertes');
}

export async function markAllAlertsAsRead() {
  await requireAuth();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('alertes')
    .update({ lue: true })
    .eq('lue', false);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/alertes');
}

export async function deleteAlerte(id: string) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'alertes', 'delete')) {
    throw new Error('Permission refusée.');
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('alertes')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/alertes');
}

export async function createAlerte(alerteData: Record<string, unknown>) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'alertes', 'create')) {
    throw new Error('Permission refusée.');
  }

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
