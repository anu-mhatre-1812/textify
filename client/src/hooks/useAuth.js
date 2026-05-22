import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getProfileId } from '@/lib/chat';

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`id.eq.${userId},user_id.eq.${userId}`)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? { ...data, user_id: getProfileId(data) } : null;
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null);
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
