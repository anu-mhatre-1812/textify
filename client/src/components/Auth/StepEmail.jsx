import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Mail } from 'lucide-react';
import styles from './StepEmail.module.css';

export default function StepEmail({ email, onSubmit, loading, error }) {
  const cardRef = useRef(null);
  const [value, setValue] = useState(email);

  useLayoutEffect(() => {
    if (!cardRef.current) {
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.from('.auth-card', {
        y: 24,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
      });
    }, cardRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(value);
  };

  return (
    <section ref={cardRef} className={`auth-card ${styles.card}`}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>T</div>
        <div>
          <strong className={styles.logoText}>Textify</strong>
          <p className={styles.tagline}>Simple. Secure. Textify.</p>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="email">
          Email address
        </label>
        <div className={styles.inputWrap}>
          <Mail size={18} />
          <input
            id="email"
            className={styles.input}
            type="email"
            placeholder="you@example.com"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <button className={styles.button} type="submit" disabled={loading}>
          <span>{loading ? 'Sending code...' : 'Continue'}</span>
          <ArrowRight size={18} />
        </button>
      </form>
    </section>
  );
}
