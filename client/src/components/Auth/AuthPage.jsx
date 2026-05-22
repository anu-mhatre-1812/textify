import { useEffect, useState } from 'react';
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

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`id.eq.${userId},user_id.eq.${userId}`)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
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

  const handleEmailSubmit = async (nextEmail) => {
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
  };

  const handleVerifyOtp = async (token) => {
    setLoading(true);
    setError('');

    try {
      let response = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (response.error) {
        response = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        });
      }

      if (response.error) {
        throw response.error;
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
  };

  const handleResendOtp = async () => {
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
  };

  const handleProfileComplete = async () => {
    await refreshProfile();
    navigate('/chat', { replace: true });
  };

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
