'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'administrateur' | 'medecin' | 'pharmacien';
  centre_id: string;
  centre?: { id: string; nom: string; code: string; ville: string };
  centres?: { id: string; nom: string; code: string; ville: string; est_principal: boolean }[];
  actif: boolean;
  telephone: string;
}

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isMedecin: boolean;
  isPharmacien: boolean;
  currentCentreId: string | null;
  setCurrentCentreId: (id: string) => void;
}

const UserContext = createContext<UserContextType>({
  profile: null,
  loading: true,
  isAdmin: false,
  isMedecin: false,
  isPharmacien: false,
  currentCentreId: null,
  setCurrentCentreId: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCentreId, setCurrentCentreId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch user profile
        const { data: profileData } = await supabase
          .from('utilisateurs')
          .select('*, centre:centres(*)')
          .eq('auth_id', user.id)
          .single();

        if (profileData) {
          let centresList: { id: string; nom: string; code: string; ville: string; est_principal: boolean }[] = [];

          // Admins can navigate all centres
          if (profileData.role === 'administrateur') {
            const { data: allCentres } = await supabase
              .from('centres')
              .select('*')
              .order('nom', { ascending: true });

            centresList = (allCentres || []).map(c => ({
              id: c.id,
              nom: c.nom,
              code: c.code,
              ville: c.ville,
              est_principal: c.id === profileData.centre_id,
            }));
          } else {
            // Fetch assigned centres for doctors/pharmacists
            const { data: userCentres } = await supabase
              .from('utilisateur_centres')
              .select('*, centre:centres(*)')
              .eq('utilisateur_id', profileData.id);

            centresList = userCentres?.map(uc => ({
              id: uc.centre?.id || uc.centre_id,
              nom: uc.centre?.nom || '',
              code: uc.centre?.code || '',
              ville: uc.centre?.ville || '',
              est_principal: uc.est_principal,
            })) || [];
          }

          const fullProfile: UserProfile = {
            ...profileData,
            centres: centresList.length > 0 ? centresList : profileData.centre ? [{
              id: profileData.centre.id,
              nom: profileData.centre.nom,
              code: profileData.centre.code,
              ville: profileData.centre.ville,
              est_principal: true,
            }] : [],
          };

          setProfile(fullProfile);
          setCurrentCentreId(profileData.centre_id);
        }
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const isAdmin = profile?.role === 'administrateur';
  const isMedecin = profile?.role === 'medecin';
  const isPharmacien = profile?.role === 'pharmacien';

  return (
    <UserContext.Provider value={{
      profile,
      loading,
      isAdmin,
      isMedecin,
      isPharmacien,
      currentCentreId,
      setCurrentCentreId,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
