import { useEffect, useRef } from 'react';
import { Check, PhoneOff, X } from 'lucide-react';
import Avatar from '@/components/Shared/Avatar';
import CallControls from '@/components/Call/CallControls';
import styles from './CallOverlay.module.css';

function getStatusCopy(session) {
  if (!session) {
    return '';
  }

  if (session.status === 'incoming') {
    return `Incoming ${session.type} call...`;
  }

  if (session.status === 'calling') {
    return `Calling ${session.display_name}...`;
  }

  if (session.status === 'connecting') {
    return 'Connecting...';
  }

  if (session.status === 'connected') {
    return session.type === 'video' ? 'Video call connected' : 'Voice call connected';
  }

  return session.reason || 'Call ended.';
}

export default function CallOverlay({
  session,
  localStream,
  remoteStream,
  isMuted,
  isCameraEnabled,
  onAccept,
  onReject,
  onEnd,
  onDismiss,
  onToggleMute,
  onToggleCamera,
}) {
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = session?.type === 'video' ? remoteStream ?? null : null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = session?.type === 'video' ? null : remoteStream ?? null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream ?? null;
    }
  }, [localStream, remoteStream, session?.type]);

  if (!session) {
    return null;
  }

  const isConnected = session.status === 'connected';
  const isIncoming = session.status === 'incoming';
  const isTerminal = session.status === 'ended' || session.status === 'rejected' || session.status === 'error';
  const showVideoLayout = session.type === 'video' && (isConnected || session.status === 'connecting' || session.status === 'calling');

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={`${styles.card} ${showVideoLayout ? styles.videoCard : ''}`}>
        {showVideoLayout ? (
          <div className={styles.videoStage}>
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                className={styles.remoteVideo}
                autoPlay
                playsInline
              />
            ) : (
              <div className={styles.waitingVideo}>
                <Avatar src={session.avatar_url} name={session.display_name} size="lg" />
                <p>{getStatusCopy(session)}</p>
              </div>
            )}
            {localStream ? (
              <video
                ref={localVideoRef}
                className={styles.localVideo}
                autoPlay
                playsInline
                muted
              />
            ) : null}
          </div>
        ) : (
          <div className={styles.hero}>
            <div className={styles.pulse} aria-hidden="true" />
            <Avatar src={session.avatar_url} name={session.display_name} size="lg" />
          </div>
        )}

        <audio ref={remoteAudioRef} autoPlay />

        <div className={styles.meta}>
          <h2>{session.display_name}</h2>
          <p>{session.username ? `@${session.username}` : 'Textify contact'}</p>
          <span>{getStatusCopy(session)}</span>
        </div>

        {isIncoming ? (
          <div className={styles.actions}>
            <button type="button" className={`${styles.actionButton} ${styles.rejectButton}`} onClick={onReject}>
              <PhoneOff size={18} />
              <span>Decline</span>
            </button>
            <button type="button" className={`${styles.actionButton} ${styles.acceptButton}`} onClick={onAccept}>
              <Check size={18} />
              <span>Accept</span>
            </button>
          </div>
        ) : null}

        {!isIncoming && !isTerminal ? (
          <CallControls
            muted={isMuted}
            cameraEnabled={isCameraEnabled}
            showCamera={session.type === 'video'}
            onToggleMute={onToggleMute}
            onToggleCamera={onToggleCamera}
            onEnd={onEnd}
          />
        ) : null}

        {isTerminal ? (
          <button type="button" className={styles.closeButton} onClick={onDismiss}>
            <X size={18} />
            <span>Close</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
