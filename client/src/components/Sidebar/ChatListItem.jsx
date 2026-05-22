import { memo } from 'react';
import Avatar from '@/components/Shared/Avatar';
import Tick from '@/components/Shared/Tick';
import { formatConversationTime } from '@/lib/chat';
import styles from './ChatListItem.module.css';

function ChatListItem({
  conversation,
  active,
  onSelect,
}) {
  return (
    <button
      type="button"
      className={`chat-item ${styles.item} ${active ? styles.active : ''}`}
      onClick={() => onSelect(conversation)}
    >
      <Avatar
        src={conversation.avatar_url}
        name={conversation.display_name}
        size="md"
        showOnline
        isOnline={conversation.is_online}
      />
      <div className={styles.body}>
        <div className={styles.topRow}>
          <strong className={styles.name}>{conversation.display_name}</strong>
          <span className={styles.time}>{formatConversationTime(conversation.last_message_at)}</span>
        </div>
        <div className={styles.bottomRow}>
          <div className={styles.preview}>
            {conversation.last_message?.sender_id ? (
              <Tick status={conversation.status} size={14} />
            ) : null}
            <span>{conversation.last_message_preview}</span>
          </div>
          {conversation.unread_count > 0 ? <span className={styles.unread}>{conversation.unread_count}</span> : null}
        </div>
      </div>
    </button>
  );
}

export default memo(ChatListItem);
