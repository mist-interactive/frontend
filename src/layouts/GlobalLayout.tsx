import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FriendsList from '../components/FriendsList';
import ChatWindow from '../components/ChatWindow';
import { useState, useEffect, useRef } from 'react';
import { WebSocketProvider, useWebSocket } from '../contexts/WebSocketContext';
import MatchmakingOverlay from './MatchmakingOverlay';
import Footer from '../components/Footer';
import { getAuthUser } from '../utils/auth';

function GlobalLayoutContent() {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("token") !== null;
  const isGamePage = location.pathname === '/game';
  
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  
  // to track open active chats (max 4 FIFO)
  const [activeChats, setActiveChats] = useState<string[]>([]);
  // to track which open chats are minimized
  const [minimizedChats, setMinimizedChats] = useState<Record<string, boolean>>({});
  // to track unread message counts per friend username
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const { lastMessage } = useWebSocket();
  const activeChatsRef = useRef(activeChats);
  activeChatsRef.current = activeChats;
  const minimizedChatsRef = useRef(minimizedChats);
  minimizedChatsRef.current = minimizedChats;
  const lastProcessedMsgRef = useRef<any>(null);

  // listen to incoming direct messages via WebSocket to update unread counts
  useEffect(() => {
    if (!lastMessage || lastProcessedMsgRef.current === lastMessage) return;
    lastProcessedMsgRef.current = lastMessage;

    if (lastMessage.type === 'direct_message_recv' && lastMessage.payload?.username) {
      const sender = lastMessage.payload.username;
      const myUsername = getAuthUser()?.username;
      if (sender === myUsername) return; // never count own messages as unread

      const isOpen = activeChatsRef.current.includes(sender);
      const isMinimized = Boolean(minimizedChatsRef.current[sender]);

      // if the chat window is not open, or is open but minimized, increment unread count
      if (!isOpen || isMinimized) {
        setUnreadCounts((prev) => ({
          ...prev,
          [sender]: (prev[sender] || 0) + 1,
        }));
      }
    }
  }, [lastMessage]);

  // total unread count across all friends for the footer dock button
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // opens new chat if its not already open; enforces max 4 active chats FIFO
  const handleOpenChat = (username: string) => {
    // clear unread count for this friend
    setUnreadCounts((prev) => {
      if (!prev[username]) return prev;
      const next = { ...prev };
      delete next[username];
      return next;
    });

    // un-minimize if already open
    setMinimizedChats((prev) => ({ ...prev, [username]: false }));

    setActiveChats((prev) => {
      if (prev.includes(username)) {
        return prev;
      }
      // FIFO: if already 4 open windows, drop the oldest (first element) and append new
      if (prev.length >= 4) {
        return [...prev.slice(1), username];
      }
      return [...prev, username];
    });
  };

  // closes the chat (deletes username from active array and minimized state)
  const handleCloseChat = (username: string) => {
    setUnreadCounts((prev) => {
      if (!prev[username]) return prev;
      const next = { ...prev };
      delete next[username];
      return next;
    });

    setActiveChats((prev) => prev.filter((u) => u !== username));
    setMinimizedChats((prev) => {
      const next = { ...prev };
      delete next[username];
      return next;
    });
  };

  // toggle minimize state for a specific chat window
  const handleToggleMinimize = (username: string) => {
    setMinimizedChats((prev) => {
      const willBeMinimized = !prev[username];
      // if expanding the chat window, clear its unread badge
      if (!willBeMinimized) {
        setUnreadCounts((uPrev) => {
          if (!uPrev[username]) return uPrev;
          const next = { ...uPrev };
          delete next[username];
          return next;
        });
      }
      return { ...prev, [username]: willBeMinimized };
    });
  };

  // clear unread badge when ChatWindow marks messages as read
  const handleMarkAsRead = (friendUsername: string) => {
    setUnreadCounts((prev) => {
      if (!prev[friendUsername]) return prev;
      const next = { ...prev };
      delete next[friendUsername];
      return next;
    });
  };

  // precomputed positioning for chat popups
  const chatBottom = isGamePage ? 'bottom-3' : 'bottom-14';
  const chatLeft = isFriendsOpen ? 'left-[21rem]' : isGamePage ? 'left-36' : 'left-4';

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 overflow-hidden">
      {/* navbar is now at the very top and spans 100% width */}
      <Navbar />
      
      {/* content wrapper for the remaining screen height. */}
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* the overlay sidebar docked between navbar and footer */}
        {isAuthenticated && (
          <FriendsList 
            isOpen={isFriendsOpen}
            onClose={() => setIsFriendsOpen(false)}
            onOpenChat={handleOpenChat}
            unreadCounts={unreadCounts}
            onInitialUnreadCounts={(counts) => setUnreadCounts(counts)}
          />
        )}

        {/* chat popups docked above footer or game canvas */}
        {isAuthenticated && (
          <div className={`fixed ${chatBottom} ${chatLeft} flex items-end gap-3 z-40 transition-all duration-300 pointer-events-auto`}>
            {activeChats.map((username) => (
              <ChatWindow 
                key={username}
                friendUsername={username} 
                onClose={() => handleCloseChat(username)}
                isMinimized={Boolean(minimizedChats[username])}
                onToggleMinimize={() => handleToggleMinimize(username)}
                unreadCount={unreadCounts[username] || 0}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
        
        {/* main page content */}
        <main className={`flex-1 min-w-0 overflow-y-auto h-full transition-[margin] duration-300 ${(!isGamePage && isFriendsOpen) ? 'lg:ml-80' : 'ml-0'}`}>
          {/* only render matchmaking overlay if authenticated */}
          {isAuthenticated && <MatchmakingOverlay />}

          <Outlet />
        </main>

      </div>

      {/* unified tactical dock at screen bottom */}
      <Footer 
        isAuthenticated={isAuthenticated}
        isFriendsOpen={isFriendsOpen}
        onToggleFriends={() => setIsFriendsOpen(!isFriendsOpen)}
        isGame={isGamePage}
        totalUnreadCount={totalUnreadCount}
      />
    </div>
  );
}

export default function GlobalLayout() {
  return (
    <WebSocketProvider>
      <GlobalLayoutContent />
    </WebSocketProvider>
  );
}