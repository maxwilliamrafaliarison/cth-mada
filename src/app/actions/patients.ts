'use server';

import { createAdminClient, requireAuth } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { hasPermission } from '@/lib/rbac';
import type { Role } from '@/lib/rbac';

export async function getPatients(filters?: {
  search?: string;
  type_hemophilie?: string;
  severite?: string;
  statut?: string;
  centre_id?: string;
  include_deleted?: boolean;
}) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  const supabase = createAdminClient();
  let query = supabase
    .from('patients')
    .select('*, centre:centres(nom, code)')
    .order('nom', { ascending: true });

  // Only admins can see soft-deleted patients
  if (filters?.include_deleted && hasPermission(role, 'patients', 'read_deleted')) {
    // No filter on deleted_at — show all including deleted
  } else {
    query = query.is('deleted_at', null);
  }

  if (filters?.type_hemophilie && filters.type_hemophilie !== 'all') {
    query = query.eq('type_hemophilie', filters.type_hemophilie);
  }
  if (filters?.severite && filters.severite !== 'all') {
    query = query.eq('severite', filters.severite);
  }
  if (filters?.statut && filters.statut !== 'all') {
    query = query.eq('statut', filters.statut);
  }
  if (filters?.centre_id && filters.centre_id !== 'all') {
    query = query.eq('centre_id', filters.centre_id);
  }
  if (filters?.search) {
    query = query.or(`nom.ilike.%${filters.search}%,prenom.ilike.%${filters.search}%,numero_cth.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getPatient(id: string) {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('patients')
    .select('*, centre:centres(*)')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createPatient(patientData: Record<string, unknown>) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'patients', 'create')) {
    throw new Error('Permission refusée: vous ne pouvez pas créer de patients.');
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('patients')
    .insert({ ...patientData, created_by: profile.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/patients');
  return data;
}

export async function updatePatient(id: string, patientData: Record<string, unknown>) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'patients', 'update')) {
    throw new Error('Permission refusée: vous ne pouvez pas modifier de patients.');
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('patients')
    .update(patientData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/patients');
  return data;
}

// Soft delete — sets deleted_at instead of removing the row
export async function deletePatient(id: string) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'patients', 'delete')) {
    throw new Error('Permission refusée: vous ne pouvez pas supprimer de patients.');
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('patients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/patients');
}

// Admin-only: permanently delete or restore a soft-deleted patient
export async function restorePatient(id: string) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'patients', 'read_deleted')) {
    throw new Error('Permission refusée.');
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('patients')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/patients');
}
