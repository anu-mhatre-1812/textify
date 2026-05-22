import { Lock } from 'lucide-react';
import styles from './EmptyState.module.css';

export default function EmptyState() {
  return (
    <section className={styles.empty}>
      <div className={styles.illustration} aria-hidden="true">
        <svg viewBox="0 0 240 180" className={styles.svg}>
          <rect x="36" y="58" width="104" height="72" rx="24" className={styles.bubbleBack} />
          <path d="M78 128 L67 150 L98 132" className={styles.tailBack} />
          <rect x="102" y="28" width="104" height="72" rx="24" className={styles.bubbleFront} />
          <path d="M172 99 L186 124 L154 103" className={styles.tailFront} />
          <circle cx="136" cy="64" r="5" className={styles.dot} />
          <circle cx="154" cy="64" r="5" className={styles.dot} />
          <circle cx="172" cy="64" r="5" className={styles.dot} />
        </svg>
      </div>
      <h1>Textify Web</h1>
      <p>Send and receive messages without keeping your phone online.</p>
      <div className={styles.encryption}>
        <Lock size={15} />
        <span>End-to-end encrypted</span>
      </div>
    </section>
  );
}
