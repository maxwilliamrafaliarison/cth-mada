'use server';

import { createAdminClient } from '@/lib/supabase-server';

export async function getUtilisateurs() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('utilisateurs')
    .select('*, centre:centres(nom, ville)')
    .order('nom', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}
