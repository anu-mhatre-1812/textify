import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CallOverlay from '@/components/Call/CallOverlay';
import ChatWindow from '@/components/Chat/ChatWindow';
import Sidebar from '@/components/Sidebar/Sidebar';
import Spinner from '@/components/Shared/Spinner';
import useCall from '@/hooks/useCall';
import useConversations from '@/hooks/useConversations';
import usePresence from '@/hooks/usePresence';
import { useAuth } from '@/hooks/useAuth';
import styles from './ChatPage.module.css';

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { conversations, loading } = useConversations();
  const { presenceMap } = usePresence();
  const [search, setSearch] = useState('');
  const call = useCall({
    currentUserId: user?.id,
    currentProfile: profile,
  });

  const hydratedConversations = useMemo(
    () =>
      conversations.map((conversation) => {
        const livePresence = presenceMap[conversation.otherUserId];
        return {
          ...conversation,
          is_online: livePresence?.is_online ?? conversation.is_online,
          last_seen: livePresence?.last_seen ?? conversation.last_seen,
        };
      }),
    [conversations, presenceMap],
  );

  const filteredConversations = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return hydratedConversations;
    }

    return hydratedConversations.filter((conversation) => {
      const name = conversation.display_name?.toLowerCase() || '';
      const username = conversation.username?.toLowerCase() || '';
      return name.includes(needle) || username.includes(needle);
    });
  }, [hydratedConversations, search]);

  const activeConversation =
    hydratedConversations.find((conversation) => conversation.id === conversationId) || null;

  const openConversation = (conversation) => {
    navigate(`/chat/${conversation.id}`);
  };

  const startCall = async (type, conversation = activeConversation) => {
    if (!conversation) {
      return;
    }

    await call.startCall(conversation, type);
  };

  if (authLoading || !user || !profile) {
    return <Spinner fullscreen label="Loading your chats..." />;
  }

  return (
    <>
      <main className={styles.page}>
        <div className={`${styles.sidebarPane} ${activeConversation ? styles.mobileHidden : ''}`}>
          <Sidebar
            profile={profile}
            searchValue={search}
            onSearchChange={setSearch}
            conversations={filteredConversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={openConversation}
            loading={loading}
            onSignOut={signOut}
            onQuickCall={() => startCall('video')}
          />
        </div>

        <div className={`${styles.chatPane} ${!activeConversation ? styles.mobileHiddenChat : ''}`}>
          {loading && !activeConversation ? (
            <Spinner label="Loading conversations..." />
          ) : (
            <ChatWindow
              conversation={activeConversation}
              currentUserId={user.id}
              showMobileBack={Boolean(activeConversation)}
              onBack={() => navigate('/chat')}
              onStartAudioCall={() => startCall('audio')}
              onStartVideoCall={() => startCall('video')}
            />
          )}
        </div>
      </main>

      <CallOverlay
        session={call.callSession}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        isMuted={call.isMuted}
        isCameraEnabled={call.isCameraEnabled}
        onAccept={call.acceptCall}
        onReject={call.rejectCall}
        onEnd={() => call.endCall()}
        onDismiss={call.dismissCall}
        onToggleMute={call.toggleMute}
        onToggleCamera={call.toggleCamera}
      />
    </>
  );
}
