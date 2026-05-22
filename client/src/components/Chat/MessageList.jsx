import { useEffect, useMemo, useRef } from 'react';
import MessageBubble from '@/components/Chat/MessageBubble';
import Spinner from '@/components/Shared/Spinner';
import { formatDateSeparator } from '@/lib/chat';
import styles from './MessageList.module.css';

export default function MessageList({ messages, loading, currentUserId, onPreview }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const items = useMemo(() => {
    let previousLabel = '';

    return messages.flatMap((message) => {
      const label = formatDateSeparator(message.created_at);
      const bubble = {
        type: 'message',
        value: message,
      };

      if (label !== previousLabel) {
        previousLabel = label;
        return [
          {
            type: 'separator',
            value: label,
            key: `separator-${label}-${message.id}`,
          },
          bubble,
        ];
      }

      return [bubble];
    });
  }, [messages]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner label="Loading messages..." />
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {items.map((item, index) =>
        item.type === 'separator' ? (
          <div key={item.key} className={styles.separator}>
            <span>{item.value}</span>
          </div>
        ) : (
          <MessageBubble
            key={item.value.id || `${item.value.created_at}-${index}`}
            message={item.value}
            isOwn={item.value.sender_id === currentUserId}
            showSenderName={item.value.sender_id !== currentUserId}
            onPreview={onPreview}
          />
        ),
      )}
      <div ref={endRef} />
    </div>
  );
}
