import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { sanitizeFileName } from '@/lib/chat';
import { useAuth } from '@/hooks/useAuth';

function mergeById(currentMessages, incomingMessage) {
  if (currentMessages.some((message) => message.id === incomingMessage.id)) {
    return currentMessages;
  }

  return [...currentMessages, incomingMessage].sort(
    (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0),
  );
}

function mergeUpdateById(currentMessages, updatedMessage) {
  return currentMessages.map((message) =>
    message.id === updatedMessage.id ? { ...message, ...updatedMessage } : message,
  );
}

export default function useMessages(conversationId) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: queryError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (queryError) {
        throw queryError;
      }

      setMessages((data ?? []).reverse());
    } catch {
      setError('Unable to load messages right now.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!conversationId) {
      return undefined;
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((current) => mergeById(current, payload.new));
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((current) => mergeUpdateById(current, payload.new));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async ({ text = '', file = null, isViewOnce = false }) => {
      if (!conversationId || !user?.id || (!text.trim() && !file)) {
        return { error: 'Message is empty.' };
      }

      const localPreviewUrl = file ? URL.createObjectURL(file) : null;
      let mediaUrl = null;
      let fileName = null;
      let fileSize = null;
      let baseType = file ? (file.type.startsWith('image/') ? 'image' : 'file') : 'text';
      let messageType = isViewOnce && file ? `view-once:${baseType}` : baseType;

      const optimisticMessage = {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user.id,
        content: text.trim(),
        message_type: messageType,
        media_url: localPreviewUrl,
        file_name: file?.name ?? null,
        file_size: file?.size ?? null,
        status: 'sent',
        created_at: new Date().toISOString(),
        optimistic: true,
      };

      setMessages((current) => [...current, optimisticMessage]);

      if (file) {
        messageType = file.type.startsWith('image/') ? 'image' : 'file';
        fileName = file.name;
        fileSize = file.size;

        const filePath = `${user.id}/${conversationId}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from('chat-media').upload(filePath, file, {
          upsert: false,
        });

        if (uploadError) {
          if (localPreviewUrl) {
            URL.revokeObjectURL(localPreviewUrl);
          }
          setMessages((current) => current.filter((message) => message.id !== optimisticMessage.id));
          return { error: uploadError.message || 'Unable to upload file.' };
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('chat-media').getPublicUrl(filePath);

        mediaUrl = publicUrl;
      }

      try {
        const payload = {
          conversation_id: conversationId,
          sender_id: user.id,
          content: text.trim(),
          message_type: messageType,
          media_url: mediaUrl,
          file_name: fileName,
          file_size: fileSize,
          status: 'sent',
        };

        const { data, error: insertError } = await supabase
          .from('messages')
          .insert(payload)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        if (localPreviewUrl) {
          URL.revokeObjectURL(localPreviewUrl);
        }

        setMessages((current) =>
          current
            .filter((message) => message.id !== optimisticMessage.id)
            .concat(data)
            .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)),
        );

        try {
          await supabase
            .from('conversations')
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);
        } catch {
          return { data, error: null };
        }

        return { data, error: null };
      } catch (sendError) {
        if (localPreviewUrl) {
          URL.revokeObjectURL(localPreviewUrl);
        }
        setMessages((current) => current.filter((message) => message.id !== optimisticMessage.id));
        return { error: sendError.message || 'Unable to send message.' };
      }
    },
    [conversationId, user?.id],
  );

  return useMemo(
    () => ({
      messages,
      loading,
      error,
      sendMessage,
      refreshMessages: loadMessages,
    }),
    [error, loadMessages, loading, messages, sendMessage],
  );
}
