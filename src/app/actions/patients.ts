'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getPatients(filters?: {
  search?: string;
  type_hemophilie?: string;
  severite?: string;
  statut?: string;
  centre_id?: string;
}) {
  const supabase = createAdminClient();
  let query = supabase
    .from('patients')
    .select('*, centre:centres(nom, code)')
    .order('nom', { ascending: true });

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
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('patients')
    .insert(patientData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/patients');
  return data;
}

export async function updatePatient(id: string, patientData: Record<string, unknown>) {
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

export async function deletePatient(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/patients');
}
