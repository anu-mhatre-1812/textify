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
      .select('id, user_id, email, display_name, username, about, avatar_url, is_online, last_seen')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return { ...data, user_id: getProfileId(data) };
    }

    const { data: altData, error: altError } = await supabase
      .from('profiles')
      .select('id, user_id, email, display_name, username, about, avatar_url, is_online, last_seen')
      .eq('user_id', userId)
      .maybeSingle();

    if (altError) {
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
    if (!sessionUser) {
      setUser(null);
      setProfile(null);
      return;
    }

    // Only set user if it changed to avoid unnecessary re-renders
    setUser((current) => (current?.id === sessionUser.id ? current : sessionUser));

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

        if (active) {
          await syncUser(session?.user ?? null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Avoid redundant work if session hasn't changed in a meaningful way
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (active) {
          setLoading(true);
          await syncUser(session?.user ?? null);
          setLoading(false);
        }
      }
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
