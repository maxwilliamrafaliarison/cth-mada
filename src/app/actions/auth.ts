'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Veuillez remplir tous les champs.' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Log failed attempt
    const admin = createAdminClient();
    await admin.from('auth_logs').insert({
      user_email: email,
      action: 'login_failed',
      details: { error: error.message },
    });
    return { error: 'Adresse e-mail ou mot de passe incorrect.' };
  }

  // Log successful login
  const admin = createAdminClient();
  await admin.from('auth_logs').insert({
    user_email: email,
    action: 'login',
  });

  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const admin = createAdminClient();
    await admin.from('auth_logs').insert({
      user_email: user.email || '',
      action: 'logout',
    });
  }

  await supabase.auth.signOut();
  redirect('/login');
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Veuillez entrer votre adresse e-mail.' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/reset-password`,
  });

  if (error) {
    return { error: 'Erreur lors de l\'envoi. Veuillez réessayer.' };
  }

  return { success: true };
}

export async function getSession() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user profile from utilisateurs table
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('utilisateurs')
    .select('*, centre:centres(*)')
    .eq('auth_id', user.id)
    .single();

  return {
    user,
    profile,
  };
}
