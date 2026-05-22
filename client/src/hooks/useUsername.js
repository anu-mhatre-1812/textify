import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export function isValidUsername(username = '') {
  return USERNAME_REGEX.test(username);
}

export default function useUsername(username, currentUserId) {
  const [available, setAvailable] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const nextUsername = username.trim();

    if (!nextUsername) {
      setAvailable(null);
      setChecking(false);
      setError('');
      return undefined;
    }

    if (!isValidUsername(nextUsername)) {
      setAvailable(false);
      setChecking(false);
      setError('Use 3-20 lowercase letters, numbers, or underscores.');
      return undefined;
    }

    let active = true;
    setChecking(true);
    setError('');

    const timeoutId = window.setTimeout(async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', nextUsername)
          .limit(1);

        if (queryError) {
          throw queryError;
        }

        if (!active) {
          return;
        }

        const takenByAnotherUser = data?.some((item) => {
          return item.id !== currentUserId;
        });

        setAvailable(!takenByAnotherUser);
      } catch (err) {
        if (active) {
          console.error('Username verification failed:', err);
          setAvailable(null);
          setError('Unable to verify username right now.');
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }, 500);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [currentUserId, username]);

  return {
    available,
    checking,
    error,
    valid: isValidUsername(username.trim()),
  };
}
