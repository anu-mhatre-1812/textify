import { useEffect, useState } from 'react';
import { getInitials } from '@/lib/chat';
import styles from './Avatar.module.css';

export default function Avatar({
  src,
  name,
  size = 'md',
  showOnline = false,
  isOnline = false,
  alt,
  onClick,
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const label = alt || `${name || 'User'} avatar`;
  const className = `${styles.avatar} ${styles[size] || styles.md}`;

  return (
    <button
      type="button"
      className={`${className} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      disabled={!onClick}
      aria-label={onClick ? `${name || 'User'} profile` : label}
    >
      {src && !failed ? (
        <img src={src} alt={label} className={styles.image} onError={() => setFailed(true)} />
      ) : (
        <span className={styles.fallback}>{getInitials(name)}</span>
      )}
      {showOnline && (
        <span
          className={`${styles.dot} ${isOnline ? styles.online : styles.offline}`}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
