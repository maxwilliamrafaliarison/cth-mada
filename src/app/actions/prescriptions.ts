'use server';

import { createAdminClient, requireAuth } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { hasPermission } from '@/lib/rbac';
import type { Role } from '@/lib/rbac';

export async function getPrescriptions(filters?: {
  search?: string;
  statut?: string;
  centre_id?: string;
}) {
  await requireAuth();
  const supabase = createAdminClient();
  let query = supabase
    .from('prescriptions')
    .select('*, patient:patients(nom, prenom, numero_cth, type_hemophilie), medecin:utilisateurs(nom, prenom), centre:centres(nom), lignes:lignes_prescription(*, medicament:medicaments(nom_complet, type_facteur))')
    .order('created_at', { ascending: false });

  if (filters?.statut && filters.statut !== 'all') {
    query = query.eq('statut', filters.statut);
  }
  if (filters?.centre_id && filters.centre_id !== 'all') {
    query = query.eq('centre_id', filters.centre_id);
  }
  if (filters?.search) {
    query = query.ilike('numero', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createPrescription(prescriptionData: Record<string, unknown>, lignes: Record<string, unknown>[]) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  if (!hasPermission(role, 'prescriptions', 'create')) {
    throw new Error('Permission refusée: vous ne pouvez pas créer de prescriptions.');
  }

  const supabase = createAdminClient();

  // Generate prescription number
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('prescriptions')
    .select('*', { count: 'exact', head: true });
  const numero = `CTH-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

  const { data, error } = await supabase
    .from('prescriptions')
    .insert({ ...prescriptionData, numero, medecin_id: profile.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Insert prescription lines
  if (lignes.length > 0) {
    const lignesWithPrescription = lignes.map(l => ({
      ...l,
      prescription_id: data.id,
    }));
    const { error: lignesError } = await supabase
      .from('lignes_prescription')
      .insert(lignesWithPrescription);
    if (lignesError) throw new Error(lignesError.message);
  }

  revalidatePath('/dashboard/prescriptions');
  return data;
}

// Pharmacien confirms prescription, admin/medecin can update status
export async function updatePrescriptionStatut(id: string, statut: string) {
  const { profile } = await requireAuth();
  const role = profile.role as Role;

  // Pharmacien can only 'confirm' (Dispensée)
  if (role === 'pharmacien' && statut === 'Dispensée') {
    if (!hasPermission(role, 'prescriptions', 'confirm')) {
      throw new Error('Permission refusée.');
    }
  } else if (!hasPermission(role, 'prescriptions', 'update')) {
    throw new Error('Permission refusée: vous ne pouvez pas modifier cette prescription.');
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('prescriptions')
    .update({ statut })
    .eq('id', id);

  if (error) throw new Error(error.message);

  // Journal entry when pharmacist confirms
  if (role === 'pharmacien' && statut === 'Dispensée') {
    await supabase.from('journal_pharmacie').insert({
      utilisateur_id: profile.id,
      action: 'confirmation_prescription',
      details: { prescription_id: id, statut },
      centre_id: profile.centre_id,
    });
  }

  revalidatePath('/dashboard/prescriptions');
}
