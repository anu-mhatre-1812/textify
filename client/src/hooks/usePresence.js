import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getProfileId } from '@/lib/chat';

export default function usePresence() {
  const { user } = useAuth();
  const [presenceMap, setPresenceMap] = useState({});

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    let active = true;

    const setStatus = async (isOnline) => {
      try {
        await supabase
          .from('profiles')
          .update({
            is_online: isOnline,
            last_seen: new Date().toISOString(),
          })
          .or(`id.eq.${user.id},user_id.eq.${user.id}`);
      } catch {
        return null;
      }

      return null;
    };

    const handleVisibilityChange = () => {
      void setStatus(document.visibilityState === 'visible');
    };

    const handleBeforeUnload = () => {
      void setStatus(false);
    };

    void setStatus(true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    const channel = supabase
      .channel(`presence:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          const profile = payload.new ?? payload.old;
          const profileId = getProfileId(profile);

          if (!active || !profileId) {
            return;
          }

          setPresenceMap((current) => ({
            ...current,
            [profileId]: {
              is_online: Boolean(profile.is_online),
              last_seen: profile.last_seen,
            },
          }));
        },
      )
      .subscribe();

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      void setStatus(false);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    presenceMap,
  };
}
