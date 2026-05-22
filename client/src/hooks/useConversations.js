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
      ] = await Promise.all([
        supabase.from('conversations').select('id, created_at, updated_at').in('id', conversationIds),
        supabase.from('conversation_participants').select('conversation_id, user_id').in('conversation_id', conversationIds),
      ]);

      if (conversationsError) throw conversationsError;
      if (participantsError) throw participantsError;

      // Fetch only the latest message for each conversation
      const messagePromises = conversationIds.map((id) =>
        supabase
          .from('messages')
          .select('id, conversation_id, sender_id, content, message_type, status, created_at, file_name')
          .eq('conversation_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      );

      // Also fetch unread counts for each conversation
      const unreadPromises = conversationIds.map((id) =>
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', id)
          .neq('sender_id', user.id)
          .in('status', ['sent', 'delivered']),
      );

      const messageResults = await Promise.all(messagePromises);
      const unreadResults = await Promise.all(unreadPromises);

      const latestMessages = messageResults.map((res) => res.data).filter(Boolean);
      const unreadCounts = unreadResults.map((res, index) => ({
        id: conversationIds[index],
        count: res.count ?? 0,
      }));

      const otherParticipants = (participantRows ?? []).filter((participant) => participant.user_id !== user.id);
      const otherUserIds = [...new Set(otherParticipants.map((participant) => participant.user_id).filter(Boolean))];

      let profileRows = [];
      let profilesError = null;

      if (otherUserIds.length) {
        // Try id first, selecting only necessary fields
        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_id, display_name, username, avatar_url, is_online, last_seen')
          .in('id', otherUserIds);
        
        profileRows = data ?? [];
        profilesError = error;

        const foundIds = new Set(profileRows.map(p => getProfileId(p)));
        const missingIds = otherUserIds.filter(id => !foundIds.has(id));

        if (missingIds.length) {
          try {
            const { data: altData, error: altError } = await supabase
              .from('profiles')
              .select('id, user_id, display_name, username, avatar_url, is_online, last_seen')
              .in('user_id', missingIds);
            
            if (!altError && altData) {
              profileRows = [...profileRows, ...altData];
            }
          } catch {
            // Ignore missing user_id column
          }
        }
      }

      if (profilesError) throw profilesError;

      const profileMap = new Map((profileRows ?? []).map((profile) => [getProfileId(profile), profile]));
      const unreadMap = new Map(unreadCounts.map((item) => [item.id, item.count]));

      const items = (conversationRows ?? [])
        .map((conversation) => {
          const participant = otherParticipants.find((item) => item.conversation_id === conversation.id);
          const latestMessage = latestMessages.find((m) => m.conversation_id === conversation.id) ?? null;
          const unreadCount = unreadMap.get(conversation.id) ?? 0;

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
