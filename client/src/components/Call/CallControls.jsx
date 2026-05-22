import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import styles from './CallControls.module.css';

export default function CallControls({ muted, cameraEnabled, showCamera, onToggleMute, onToggleCamera, onEnd }) {
  return (
    <div className={styles.controls}>
      <button type="button" className={styles.control} onClick={onToggleMute} aria-label="Toggle mute">
        {muted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>
      {showCamera ? (
        <button type="button" className={styles.control} onClick={onToggleCamera} aria-label="Toggle camera">
          {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
      ) : null}
      <button type="button" className={`${styles.control} ${styles.end}`} onClick={onEnd} aria-label="End call">
        <PhoneOff size={20} />
      </button>
    </div>
  );
}
