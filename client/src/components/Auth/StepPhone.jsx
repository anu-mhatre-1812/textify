import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Smartphone } from 'lucide-react';
import styles from './StepPhone.module.css';

export default function StepPhone({ phone, onComplete, loading, error }) {
  const cardRef = useRef(null);
  const inputRef = useRef(null);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    gsap.from(cardRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (value) {
      onComplete(value);
    }
  };

  return (
    <section ref={cardRef} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.kicker}>One more thing</span>
        <h1>Verify your phone</h1>
        <p>Textify requires a unique phone number for every account.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputWrap}>
          <Smartphone size={18} />
          <input
            ref={inputRef}
            className={styles.input}
            type="tel"
            placeholder="+91 9876543210"
            defaultValue={phone}
            required
            disabled={loading}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Checking number...' : 'Continue'}
        </button>
      </form>
    </section>
  );
}
