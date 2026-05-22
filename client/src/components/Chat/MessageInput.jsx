import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Paperclip, Send, Smile } from 'lucide-react';
import MediaPreview from '@/components/Chat/MediaPreview';
import styles from './MessageInput.module.css';

const EMOJIS = ['😀', '😂', '❤️', '👍', '🔥', '🎉', '🙏', '😎'];

export default function MessageInput({ onSend, disabled = false }) {
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const canSend = useMemo(() => Boolean(text.trim() || selectedFile), [selectedFile, text]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    const maxHeight = 24 * 5 + 18;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [text]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setIsViewOnce(false);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const resetComposer = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setText('');
    setSelectedFile(null);
    setIsViewOnce(false);
    setPreviewUrl('');
    setShowEmojiPicker(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!canSend || sending || disabled) {
      return;
    }

    setSending(true);
    setError('');

    const response = await onSend({
      text,
      file: selectedFile,
      isViewOnce,
    });

    if (response?.error) {
      setError(response.error);
      setSending(false);
      return;
    }

    resetComposer();
    setSending(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className={styles.wrap}>
      {selectedFile ? (
        <MediaPreview
          file={selectedFile}
          url={previewUrl}
          type={selectedFile.type.startsWith('image/') ? 'image' : 'file'}
          isViewOnce={isViewOnce}
          onViewOnceToggle={() => setIsViewOnce((current) => !current)}
          onClose={() => {
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }
            setSelectedFile(null);
            setIsViewOnce(false);
            setPreviewUrl('');
          }}
        />
      ) : null}

      {showEmojiPicker ? (
        <div className={styles.emojiPicker}>
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={styles.emoji}
              onClick={() => {
                setText((current) => `${current}${emoji}`);
                textareaRef.current?.focus();
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.bar}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setShowEmojiPicker((current) => !current)}
          aria-label="Open emoji picker"
        >
          <Smile size={20} />
        </button>

        <button
          type="button"
          className={styles.iconButton}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach file"
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          className={styles.hiddenInput}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
          onChange={handleFileChange}
        />

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          rows={1}
          placeholder="Message"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        {canSend ? (
          <button
            type="button"
            className={styles.sendButton}
            onClick={handleSend}
            disabled={sending || disabled}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        ) : (
          <button type="button" className={styles.iconButton} aria-label="Voice message">
            <Mic size={20} />
          </button>
        )}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
