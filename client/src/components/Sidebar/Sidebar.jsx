import { useRef } from 'react';
import SidebarHeader from '@/components/Sidebar/SidebarHeader';
import SearchBar from '@/components/Sidebar/SearchBar';
import ChatList from '@/components/Sidebar/ChatList';
import styles from './Sidebar.module.css';

export default function Sidebar({
  profile,
  searchValue,
  onSearchChange,
  conversations,
  activeConversationId,
  onSelectConversation,
  loading,
  onSignOut,
  onQuickCall,
}) {
  const searchRef = useRef(null);

  return (
    <aside className={styles.sidebar}>
      <SidebarHeader
        profile={profile}
        onSignOut={onSignOut}
        onNewChat={() => searchRef.current?.focus()}
        onQuickCall={onQuickCall}
      />
      <SearchBar value={searchValue} onChange={onSearchChange} inputRef={searchRef} />
      <ChatList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={onSelectConversation}
        loading={loading}
      />
    </aside>
  );
}
