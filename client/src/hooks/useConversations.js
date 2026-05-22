import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { buildMessagePreview, getProfileId } from '@/lib/chat';
import { useAuth } from '@/hooks/useAuth';

function normalizeConversation({
  conversation,
  participant,
  otherProfile,
  latestMessage,
  unreadCount,
}) {
  return {
    ...conversation,
    id: conversation.id,
    otherUserId: participant?.user_id ?? participant?.id ?? otherProfile?.user_id ?? otherProfile?.id,
    display_name:
      otherProfile?.display_name || otherProfile?.username || otherProfile?.email || 'Unknown contact',
    username: otherProfile?.username || 'unknown',
    avatar_url: otherProfile?.avatar_url || '',
    is_online: Boolean(otherProfile?.is_online),
    last_seen: otherProfile?.last_seen || null,
    last_message: latestMessage,
    last_message_preview: buildMessagePreview(latestMessage),
    last_message_at: latestMessage?.created_at || conversation.updated_at || conversation.created_at,
    unread_count: unreadCount,
    status: latestMessage?.status || 'sent',
  };
}

export default function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConversations = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: membershipRows, error: membershipError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .eq('user_id', user.id);

      if (membershipError) {
        throw membershipError;
      }

      const conversationIds = [...new Set((membershipRows ?? []).map((item) => item.conversation_id))];

      if (!conversationIds.length) {
        setConversations([]);
        return;
      }

      const [
        { data: conversationRows, error: conversationsError },
        { data: participantRows, error: participantsError },
        { data: messageRows, error: messagesError },
      ] = await Promise.all([
        supabase.from('conversations').select('*').in('id', conversationIds),
        supabase.from('conversation_participants').select('conversation_id, user_id').in('conversation_id', conversationIds),
        supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false }),
      ]);

      if (conversationsError) {
        throw conversationsError;
      }

      if (participantsError) {
        throw participantsError;
      }

      if (messagesError) {
        throw messagesError;
      }

      const otherParticipants = (participantRows ?? []).filter((participant) => participant.user_id !== user.id);
      const otherUserIds = [...new Set(otherParticipants.map((participant) => participant.user_id).filter(Boolean))];

      const { data: profileRows, error: profilesError } = otherUserIds.length
        ? await supabase
            .from('profiles')
            .select('*')
            .or(otherUserIds.map((id) => `id.eq.${id},user_id.eq.${id}`).join(','))
        : { data: [], error: null };

      if (profilesError) {
        throw profilesError;
      }

      const profileMap = new Map((profileRows ?? []).map((profile) => [getProfileId(profile), profile]));

      const messagesByConversation = (messageRows ?? []).reduce((accumulator, message) => {
        const bucket = accumulator[message.conversation_id] ?? [];
        bucket.push(message);
        accumulator[message.conversation_id] = bucket;
        return accumulator;
      }, {});

      const items = (conversationRows ?? [])
        .map((conversation) => {
          const participant = otherParticipants.find((item) => item.conversation_id === conversation.id);
          const messages = messagesByConversation[conversation.id] ?? [];
          const latestMessage = messages[0] ?? null;
          const unreadCount = messages.filter(
            (message) => message.sender_id !== user.id && (message.status === 'sent' || message.status === 'delivered'),
          ).length;

          return normalizeConversation({
            conversation,
            participant,
            otherProfile: profileMap.get(participant?.user_id),
            latestMessage,
            unreadCount,
          });
        })
        .sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));

      setConversations(items);
    } catch {
      setError('Unable to load conversations right now.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    const channel = supabase
      .channel(`conversations:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        void loadConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        void loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations, user?.id]);

  return useMemo(
    () => ({
      conversations,
      loading,
      error,
      refreshConversations: loadConversations,
    }),
    [conversations, error, loadConversations, loading],
  );
}
