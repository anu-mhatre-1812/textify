export function getProfileId(record) {
  return record?.user_id ?? record?.id ?? null;
}

export function getInitials(name = '') {
  return name.trim().charAt(0).toUpperCase() || 'T';
}

export function maskEmail(email = '') {
  const [name = '', domain = ''] = email.split('@');
  if (!name || !domain) {
    return email;
  }

  const maskedName = name.length <= 1 ? '*' : `${name.charAt(0)}${'*'.repeat(Math.max(name.length - 1, 1))}`;
  return `${maskedName}@${domain}`;
}

export function sanitizeFileName(fileName = 'file') {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

export function formatFileSize(bytes = 0) {
  if (!bytes) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatTime(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatConversationTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return formatTime(value);
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateSeparator(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  }).format(date);
}

export function buildMessagePreview(message) {
  if (!message) {
    return 'Start chatting on Textify';
  }

  const type = message.message_type || 'text';
  const isImage = type.includes('image');
  const isFile = type.includes('file');

  if (isImage) {
    return message.content?.trim() ? `Photo: ${message.content}` : 'Photo';
  }

  if (isFile) {
    return message.file_name ? `File: ${message.file_name}` : 'File attachment';
  }

  return message.content?.trim() || 'Start chatting on Textify';
}
