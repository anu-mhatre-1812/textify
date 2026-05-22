import { useState } from 'react';
import { LogOut, Menu, MessageSquarePlus, Video } from 'lucide-react';
import Avatar from '@/components/Shared/Avatar';
import styles from './SidebarHeader.module.css';

export default function SidebarHeader({ profile, onSignOut, onNewChat, onQuickCall }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <Avatar
          src={profile?.avatar_url}
          name={profile?.display_name || profile?.email}
          size="md"
          onClick={() => setShowProfile(true)}
        />

        <div className={styles.brand}>
          <span className={styles.brandMark}>T</span>
          <strong>Textify</strong>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.iconButton} onClick={onQuickCall} aria-label="Start call">
            <Video size={19} />
          </button>
          <button type="button" className={styles.iconButton} onClick={onNewChat} aria-label="New chat">
            <MessageSquarePlus size={19} />
          </button>
          <div className={styles.menuWrap}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setShowMenu((current) => !current)}
              aria-label="Menu"
            >
              <Menu size={19} />
            </button>
            {showMenu ? (
              <div className={styles.menu}>
                <button type="button" className={styles.menuItem} onClick={onSignOut}>
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {showProfile ? (
        <div className={styles.backdrop} onClick={() => setShowProfile(false)} role="presentation">
          <div className={styles.modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <Avatar src={profile?.avatar_url} name={profile?.display_name || profile?.email} size="lg" />
            <h2>{profile?.display_name || 'Your profile'}</h2>
            <p>@{profile?.username || 'username'}</p>
            <span>{profile?.about || 'Hey there! I am using Textify.'}</span>
            <button type="button" className={styles.modalButton} onClick={() => setShowProfile(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
