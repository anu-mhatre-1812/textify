import { memo, useLayoutEffect, useRef } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { gsap } from 'gsap';
import Tick from '@/components/Shared/Tick';
import { formatFileSize, formatTime } from '@/lib/chat';
import { supabase } from '@/lib/supabase';
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

  const type = message.message_type || 'text';
  const isViewOnce = type.startsWith('view-once:');
  const baseType = isViewOnce ? type.split(':')[1] : type;
  const isViewed = message.status === 'viewed';
  const isImage = baseType === 'image';
  const isFile = baseType === 'file';

  const handleOpenMedia = async () => {
    if (isViewOnce && isViewed) {
      return;
    }

    onPreview(message);

    if (isViewOnce && !isOwn) {
      // Mark as viewed in background
      try {
        await supabase
          .from('messages')
          .update({ status: 'viewed' })
          .eq('id', message.id);
      } catch (err) {
        console.error('Failed to mark message as viewed:', err);
      }
    }
  };

  return (
    <div className={`${styles.row} ${isOwn ? styles.own : styles.other}`}>
      <article
        ref={bubbleRef}
        className={`${styles.bubble} ${isOwn ? styles.sent : styles.received} no-select`}
      >
        {!isOwn && showSenderName ? <span className={styles.sender}>@{message.sender_name || 'contact'}</span> : null}

        {isViewOnce ? (
          <button
            type="button"
            className={`${styles.viewOnceButton} ${isViewed ? styles.viewed : ''}`}
            onClick={handleOpenMedia}
            disabled={isViewed}
          >
            <div className={styles.viewOnceCircle}>
              <Eye size={20} />
            </div>
            <div className={styles.viewOnceInfo}>
              <strong>{isViewed ? 'Opened' : 'View Once'}</strong>
              <span>{isImage ? 'Photo' : 'File'}</span>
            </div>
          </button>
        ) : (
          <>
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
          </>
        )}

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
