import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getProfileId } from '@/lib/chat';

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  if (!userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // If 'id' lookup fails, or if we want to be super safe and try user_id too
      // but only if 'id' didn't return anything and we suspect user_id might exist
      throw error;
    }

    if (data) {
      return { ...data, user_id: getProfileId(data) };
    }

    // Try user_id if id didn't match and it might exist
    const { data: altData, error: altError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (altError) {
      // If this fails, it's probably because user_id column doesn't exist, 
      // which is fine since we already tried 'id'.
      return null;
    }

    return altData ? { ...altData, user_id: getProfileId(altData) } : null;
  } catch (err) {
    console.error('Error fetching profile:', err);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback(async (sessionUser) => {
    setUser(sessionUser ?? null);

    if (!sessionUser) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await fetchProfile(sessionUser.id);
      setProfile(nextProfile);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        await syncUser(session?.user ?? null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      await syncUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [syncUser]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return null;
    }

    const nextProfile = await fetchProfile(user.id);
    setProfile(nextProfile);
    return nextProfile;
  }, [user?.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signOut,
      refreshProfile,
      setProfile,
    }),
    [loading, profile, refreshProfile, signOut, user],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
