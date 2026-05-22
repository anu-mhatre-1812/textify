import { memo, useLayoutEffect, useRef } from 'react';
import { Download, FileText } from 'lucide-react';
import { gsap } from 'gsap';
import Tick from '@/components/Shared/Tick';
import { formatFileSize, formatTime } from '@/lib/chat';
import styles from './MessageBubble.module.css';

function MessageBubble({ message, isOwn, showSenderName, onPreview }) {
  const bubbleRef = useRef(null);

  useLayoutEffect(() => {
    if (!bubbleRef.current) {
      return undefined;
    }

    gsap.from(bubbleRef.current, {
      scale: 0.85,
      opacity: 0,
      duration: 0.2,
      ease: 'back.out(1.2)',
    });

    return undefined;
  }, []);

  const isImage = message.message_type === 'image';
  const isFile = message.message_type === 'file';

  return (
    <div className={`${styles.row} ${isOwn ? styles.own : styles.other}`}>
      <article
        ref={bubbleRef}
        className={`${styles.bubble} ${isOwn ? styles.sent : styles.received}`}
      >
        {!isOwn && showSenderName ? <span className={styles.sender}>@{message.sender_name || 'contact'}</span> : null}

        {isImage ? (
          <button type="button" className={styles.mediaButton} onClick={() => onPreview(message)}>
            <img src={message.media_url} alt={message.file_name || 'Shared image'} className={styles.image} />
          </button>
        ) : null}

        {isFile ? (
          <div className={styles.file}>
            <div className={styles.fileInfo}>
              <FileText size={20} />
              <div>
                <strong>{message.file_name || 'Attachment'}</strong>
                <span>{formatFileSize(message.file_size)}</span>
              </div>
            </div>
            <a href={message.media_url} download={message.file_name || 'file'} className={styles.download}>
              <Download size={16} />
            </a>
          </div>
        ) : null}

        {message.content ? <p className={styles.content}>{message.content}</p> : null}

        <footer className={styles.meta}>
          <span>{formatTime(message.created_at)}</span>
          {isOwn ? <Tick status={message.status} /> : null}
        </footer>
      </article>
    </div>
  );
}

export default memo(MessageBubble);
