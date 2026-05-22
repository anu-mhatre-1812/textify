import { useMemo, useState } from 'react';
import ChatHeader from '@/components/Chat/ChatHeader';
import MediaPreview from '@/components/Chat/MediaPreview';
import MessageInput from '@/components/Chat/MessageInput';
import MessageList from '@/components/Chat/MessageList';
import EmptyState from '@/components/Shared/EmptyState';
import useMessages from '@/hooks/useMessages';
import styles from './ChatWindow.module.css';

export default function ChatWindow({
  conversation,
  currentUserId,
  showMobileBack,
  onBack,
  onStartAudioCall,
  onStartVideoCall,
}) {
  const { messages, loading, sendMessage } = useMessages(conversation?.id);
  const [previewMessage, setPreviewMessage] = useState(null);

  const decoratedMessages = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        sender_name: conversation?.display_name,
      })),
    [conversation?.display_name, messages],
  );

  if (!conversation) {
    return (
      <div className={styles.emptyWrap}>
        <EmptyState />
      </div>
    );
  }

  return (
    <section className={styles.window}>
      <ChatHeader
        conversation={conversation}
        onBack={showMobileBack ? onBack : null}
        onStartAudioCall={onStartAudioCall}
        onStartVideoCall={onStartVideoCall}
        onSearch={() => null}
      />
      <div className={styles.patternLayer} />
      <MessageList
        messages={decoratedMessages}
        loading={loading}
        currentUserId={currentUserId}
        onPreview={setPreviewMessage}
      />
      <MessageInput onSend={sendMessage} disabled={!conversation} />
      {previewMessage ? (
        <MediaPreview
          mode="viewer"
          url={previewMessage.media_url}
          type={previewMessage.message_type}
          name={previewMessage.file_name}
          size={previewMessage.file_size}
          onClose={() => setPreviewMessage(null)}
        />
      ) : null}
    </section>
  );
}
