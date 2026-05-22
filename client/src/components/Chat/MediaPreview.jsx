import { Download, Eye, FileText, X } from 'lucide-react';
import { formatFileSize } from '@/lib/chat';
import styles from './MediaPreview.module.css';

export default function MediaPreview({
  mode = 'compose',
  file,
  url,
  type = 'file',
  name,
  size,
  isViewOnce = false,
  onViewOnceToggle,
  onClose,
}) {
  const isImage = type === 'image' || file?.type?.startsWith('image/');
  const previewUrl = url || '';
  const fileName = name || file?.name || 'Attachment';
  const fileSize = size ?? file?.size ?? 0;

  if (mode === 'viewer') {
    return (
      <div className={styles.viewer} role="dialog" aria-modal="true">
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close preview">
          <X size={18} />
        </button>
        {isImage ? (
          <img className={styles.viewerImage} src={previewUrl} alt={fileName} />
        ) : (
          <div className={styles.viewerFile}>
            <FileText size={28} />
            <strong>{fileName}</strong>
            <span>{formatFileSize(fileSize)}</span>
            {!isViewOnce && (
              <a className={styles.download} href={previewUrl} download={fileName}>
                <Download size={16} />
                <span>Download</span>
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.compose}>
      {isImage ? (
        <img className={styles.composeImage} src={previewUrl} alt={fileName} />
      ) : (
        <div className={styles.composeFile}>
          <FileText size={22} />
          <div>
            <strong>{fileName}</strong>
            <span>{formatFileSize(fileSize)}</span>
          </div>
        </div>
      )}

      <div className={styles.composeControls}>
        <button
          type="button"
          className={`${styles.viewOnceToggle} ${isViewOnce ? styles.active : ''}`}
          onClick={onViewOnceToggle}
          title="View Once"
        >
          <Eye size={16} />
          <span>View Once</span>
        </button>
        
        <button type="button" className={styles.closeChip} onClick={onClose} aria-label="Remove attachment">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
