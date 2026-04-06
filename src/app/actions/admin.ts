'use server';

import { createAdminClient, requireAuth } from '@/lib/supabase-server';
import type { Role } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const { profile } = await requireAuth();
  if ((profile.role as Role) !== 'administrateur') {
    throw new Error('Accès refusé: seuls les administrateurs peuvent effectuer cette action.');
  }
  return profile;
}

// ---------------------------------------------------------------------------
// GET — Liste des utilisateurs (avec centres associés)
// ---------------------------------------------------------------------------

export async function getUtilisateurs() {
  await requireAdmin();

  const supabase = createAdminClient();

  // Fetch utilisateurs with their legacy centre FK
  const { data: users, error } = await supabase
    .from('utilisateurs')
    .select('*, centre:centres(id, nom, ville, code)')
    .order('nom', { ascending: true });

  if (error) throw new Error(error.message);

  // Fetch all utilisateur_centres rows in one go
  const { data: allUC } = await supabase
    .from('utilisateur_centres')
    .select('*, centre:centres(id, nom, ville, code)');

  const ucMap = new Map<string, typeof allUC>();
  for (const uc of allUC || []) {
    const list = ucMap.get(uc.utilisateur_id) || [];
    list.push(uc);
    ucMap.set(uc.utilisateur_id, list);
  }

  return (users || []).map(u => ({
    ...u,
    utilisateur_centres: ucMap.get(u.id) || [],
  }));
}

// ---------------------------------------------------------------------------
// CREATE — Créer un utilisateur (auth + profil + centre)
// ---------------------------------------------------------------------------

export async function createUtilisateur(data: {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: Role;
  centre_id: string;
  telephone?: string;
}) {
  await requireAdmin();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // 1. Create auth user via Admin API
  const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      email_confirm: true,
    }),
  });

  if (!authRes.ok) {
    const err = await authRes.json();
    throw new Error(err.msg || err.message || "Erreur lors de la création de l'utilisateur auth.");
  }

  const authUser = await authRes.json();
  const authId: string = authUser.id;

  // 2. Insert utilisateur profile
  const supabase = createAdminClient();
  const { data: profile, error: profileErr } = await supabase
    .from('utilisateurs')
    .insert({
      auth_id: authId,
      email: data.email,
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
      centre_id: data.centre_id,
      telephone: data.telephone || null,
      actif: true,
    })
    .select()
    .single();

  if (profileErr) throw new Error(profileErr.message);

  // 3. Link utilisateur to centre
  const { error: ucErr } = await supabase
    .from('utilisateur_centres')
    .insert({
      utilisateur_id: profile.id,
      centre_id: data.centre_id,
      est_principal: true,
    });

  if (ucErr) throw new Error(ucErr.message);

  revalidatePath('/dashboard/admin');
  return profile;
}

// ---------------------------------------------------------------------------
// UPDATE — Modifier le profil d'un utilisateur
// ---------------------------------------------------------------------------

export async function updateUtilisateur(
  id: string,
  data: {
    nom?: string;
    prenom?: string;
    role?: Role;
    telephone?: string;
    email?: string;
  }
) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('utilisateurs')
    .update(data)
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/admin');
}

// ---------------------------------------------------------------------------
// DELETE (soft) — Désactiver un utilisateur
// ---------------------------------------------------------------------------

export async function deleteUtilisateur(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('utilisateurs')
    .update({ actif: false })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/admin');
}

// ---------------------------------------------------------------------------
// ASSIGN — Ajouter un utilisateur à un centre (secondaire)
// ---------------------------------------------------------------------------

export async function assignUserToCentre(utilisateur_id: string, centre_id: string) {
  await requireAdmin();

  const supabase = createAdminClient();

  // Check if already exists
  const { data: existing } = await supabase
    .from('utilisateur_centres')
    .select('id')
    .eq('utilisateur_id', utilisateur_id)
    .eq('centre_id', centre_id)
    .maybeSingle();

  if (existing) {
    throw new Error('Cet utilisateur est déjà affecté à ce centre.');
  }

  const { error } = await supabase
    .from('utilisateur_centres')
    .insert({
      utilisateur_id,
      centre_id,
      est_principal: false,
    });

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/admin');
}

// ---------------------------------------------------------------------------
// REMOVE — Retirer un utilisateur d'un centre
// ---------------------------------------------------------------------------

export async function removeUserFromCentre(utilisateur_id: string, centre_id: string) {
  await requireAdmin();

  const supabase = createAdminClient();

  // Prevent removing from primary centre via this function
  const { data: uc } = await supabase
    .from('utilisateur_centres')
    .select('est_principal')
    .eq('utilisateur_id', utilisateur_id)
    .eq('centre_id', centre_id)
    .maybeSingle();

  if (uc?.est_principal) {
    throw new Error('Impossible de retirer le centre principal. Utilisez le transfert.');
  }

  const { error } = await supabase
    .from('utilisateur_centres')
    .delete()
    .eq('utilisateur_id', utilisateur_id)
    .eq('centre_id', centre_id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/admin');
}

// ---------------------------------------------------------------------------
// TRANSFER — Changer le centre principal d'un utilisateur
// ---------------------------------------------------------------------------

export async function transferUser(utilisateur_id: string, new_centre_id: string) {
  await requireAdmin();

  const supabase = createAdminClient();

  // 1. Unmark old principal
  const { error: unmarkErr } = await supabase
    .from('utilisateur_centres')
    .update({ est_principal: false })
    .eq('utilisateur_id', utilisateur_id)
    .eq('est_principal', true);

  if (unmarkErr) throw new Error(unmarkErr.message);

  // 2. Upsert new centre link as principal
  const { data: existing } = await supabase
    .from('utilisateur_centres')
    .select('id')
    .eq('utilisateur_id', utilisateur_id)
    .eq('centre_id', new_centre_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('utilisateur_centres')
      .update({ est_principal: true })
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('utilisateur_centres')
      .insert({
        utilisateur_id,
        centre_id: new_centre_id,
        est_principal: true,
      });
    if (error) throw new Error(error.message);
  }

  // 3. Update the legacy centre_id FK on utilisateurs
  const { error: updateErr } = await supabase
    .from('utilisateurs')
    .update({ centre_id: new_centre_id })
    .eq('id', utilisateur_id);

  if (updateErr) throw new Error(updateErr.message);

  revalidatePath('/dashboard/admin');
}
