import { Search, X } from 'lucide-react';
import styles from './SearchBar.module.css';

export default function SearchBar({ value, onChange, inputRef }) {
  return (
    <div className={styles.wrap}>
      <Search size={18} className={styles.icon} />
      <input
        ref={inputRef}
        className={styles.input}
        type="text"
        placeholder="Search or start new chat"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button type="button" className={styles.clear} onClick={() => onChange('')} aria-label="Clear search">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
