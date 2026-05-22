import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { RefreshCcw } from 'lucide-react';
import { maskEmail } from '@/lib/chat';
import styles from './StepOTP.module.css';

const OTP_LENGTH = 6;
const RESEND_DELAY = 50000;

function formatCountdown(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function StepOTP({ email, onVerify, onResend, loading, error }) {
  const containerRef = useRef(null);
  const rowRef = useRef(null);
  const inputRefs = useRef([]);
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(RESEND_DELAY);
  const [localError, setLocalError] = useState('');

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.from('.otp-box', {
        scale: 0.8,
        opacity: 0,
        stagger: 0.05,
        duration: 0.3,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }

    setLocalError(error);
    if (rowRef.current) {
      gsap.to(rowRef.current, {
        x: [-8, 8, -6, 6, -4, 4, 0],
        duration: 0.4,
      });
    }
  }, [error]);

  useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [countdown]);

  const code = useMemo(() => digits.join(''), [digits]);

  useEffect(() => {
    if (code.length !== OTP_LENGTH || digits.some((digit) => !digit)) {
      return;
    }

    const submitCode = async () => {
      try {
        setLocalError('');
        await onVerify(code);
      } catch {
        setDigits(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    };

    void submitCode();
  }, [code, digits, onVerify]);

  const updateDigit = (index, value) => {
    const nextValue = value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextValue;
    setDigits(nextDigits);

    if (nextValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) {
      return;
    }

    event.preventDefault();
    const nextDigits = pasted.split('');
    while (nextDigits.length < OTP_LENGTH) {
      nextDigits.push('');
    }
    setDigits(nextDigits);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const resendDisabled = countdown > 0 || loading;

  const handleResend = async () => {
    try {
      await onResend();
      setCountdown(RESEND_DELAY);
      setLocalError('');
    } catch (resendError) {
      setLocalError(resendError.message || 'Unable to resend OTP.');
    }
  };

  return (
    <section ref={containerRef} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.kicker}>Verify your login</span>
        <h1>Check your email</h1>
        <p>
          We sent a 6-digit code to <strong>{maskEmail(email)}</strong>
        </p>
      </div>

      <div ref={rowRef} className={`otp-row ${styles.row}`} onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            className={`otp-box ${styles.input}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>

      {(localError || error) && <p className={styles.error}>{localError || error}</p>}

      <button
        className={styles.resend}
        type="button"
        onClick={handleResend}
        disabled={resendDisabled}
      >
        <RefreshCcw size={16} />
        <span>{resendDisabled ? `Resend OTP in ${formatCountdown(countdown)}` : 'Resend OTP'}</span>
      </button>

      {loading ? <p className={styles.helper}>Verifying your code...</p> : null}
    </section>
  );
}
