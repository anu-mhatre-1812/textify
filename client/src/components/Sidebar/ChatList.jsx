import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import ChatListItem from '@/components/Sidebar/ChatListItem';
import Spinner from '@/components/Shared/Spinner';
import styles from './ChatList.module.css';

export default function ChatList({ conversations, activeConversationId, onSelect, loading }) {
  const listRef = useRef(null);

  useLayoutEffect(() => {
    if (!listRef.current || !conversations.length) {
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.from('.chat-item', {
        x: -16,
        opacity: 0,
        stagger: 0.04,
        duration: 0.3,
      });
    }, listRef);

    return () => ctx.revert();
  }, [conversations]);

  if (loading) {
    return <Spinner label="Loading chats..." />;
  }

  if (!conversations.length) {
    return <div className={styles.empty}>No conversations match your search.</div>;
  }

  return (
    <div ref={listRef} className={styles.list}>
      {conversations.map((conversation) => (
        <ChatListItem
          key={conversation.id}
          conversation={conversation}
          active={conversation.id === activeConversationId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
