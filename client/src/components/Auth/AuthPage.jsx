import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepEmail from '@/components/Auth/StepEmail';
import StepOTP from '@/components/Auth/StepOTP';
import StepProfile from '@/components/Auth/StepProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import styles from './AuthPage.module.css';

async function lookupProfile(userId) {
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
      throw error;
    }

    if (data) {
      return data;
    }

    const { data: altData, error: altError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (altError) {
      return null;
    }

    return altData;
  } catch (err) {
    console.error('Error looking up profile:', err);
    return null;
  }
}

export default function AuthFlowPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && profile) {
      navigate('/chat', { replace: true });
      return;
    }

    if (user && !profile) {
      setStep('profile');
    }
  }, [navigate, profile, user]);

  const handleEmailSubmit = useCallback(async (nextEmail) => {
    setLoading(true);
    setError('');

    try {
      const normalizedEmail = nextEmail.trim().toLowerCase();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (authError) {
        throw authError;
      }

      setEmail(normalizedEmail);
      setStep('otp');
    } catch (submitError) {
      setError(submitError.message || 'Unable to send OTP right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerifyOtp = useCallback(async (token) => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      // Try 'email' first as it's the standard for signInWithOtp
      let response = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (response.error) {
        // Fallback to 'signup'
        const signupResponse = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'signup',
        });

        if (signupResponse.error) {
          throw response.error;
        }
        response = signupResponse;
      }

      const nextUser = response.data.user;
      const nextProfile = await lookupProfile(nextUser?.id);

      if (nextProfile) {
        await refreshProfile();
        navigate('/chat', { replace: true });
      } else {
        setStep('profile');
      }
    } catch (verifyError) {
      setError(verifyError.message || 'Incorrect code. Please try again.');
      throw verifyError;
    } finally {
      setLoading(false);
    }
  }, [email, loading, navigate, refreshProfile]);

  const handleResendOtp = useCallback(async () => {
    setError('');
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (resendError) {
      throw resendError;
    }
  }, [email]);

  const handleProfileComplete = useCallback(async () => {
    await refreshProfile();
    navigate('/chat', { replace: true });
  }, [navigate, refreshProfile]);

  return (
    <main className={styles.page}>
      <div className={styles.gridGlow} />
      <div className={styles.content}>
        {step === 'email' && (
          <StepEmail
            email={email}
            onSubmit={handleEmailSubmit}
            loading={loading}
            error={error}
          />
        )}
        {step === 'otp' && (
          <StepOTP
            email={email}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            loading={loading}
            error={error}
          />
        )}
        {step === 'profile' && (
          <StepProfile
            email={email}
            loading={loading}
            error={error}
            onComplete={handleProfileComplete}
            setError={setError}
            setLoading={setLoading}
          />
        )}
      </div>
    </main>
  );
}
