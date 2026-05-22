import { ArrowLeft, Menu, Phone, Search, Video } from 'lucide-react';
import Avatar from '@/components/Shared/Avatar';
import styles from './ChatHeader.module.css';

function formatPresence(conversation) {
  if (conversation.is_online) {
    return 'online';
  }

  if (!conversation.last_seen) {
    return 'offline';
  }

  return `last seen ${new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(conversation.last_seen))}`;
}

export default function ChatHeader({ conversation, onBack, onStartAudioCall, onStartVideoCall, onSearch }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {onBack ? (
          <button
            type="button"
            className={`${styles.iconButton} ${styles.backButton}`}
            onClick={onBack}
            aria-label="Back to chats"
          >
            <ArrowLeft size={20} />
          </button>
        ) : null}
        <Avatar
          src={conversation.avatar_url}
          name={conversation.display_name}
          size="md"
          showOnline
          isOnline={conversation.is_online}
        />
        <div className={styles.meta}>
          <strong>{conversation.display_name}</strong>
          <span>@{conversation.username}</span>
          <small>{formatPresence(conversation)}</small>
        </div>
      </div>

      <div className={styles.right}>
        <button type="button" className={styles.iconButton} onClick={onStartVideoCall} aria-label="Video call">
          <Video size={18} />
        </button>
        <button type="button" className={styles.iconButton} onClick={onStartAudioCall} aria-label="Voice call">
          <Phone size={18} />
        </button>
        <button type="button" className={styles.iconButton} onClick={onSearch} aria-label="Search conversation">
          <Search size={18} />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Chat menu">
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
}
