import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FriendsList from '../components/FriendsList';
import ChatWindow from '../components/ChatWindow';
import { useState } from 'react';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import MatchmakingOverlay from './MatchmakingOverlay';
import Footer from '../components/Footer';

export default function GlobalLayout() {
  // uselocation forces to rerender the component always after url changes
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("token") !== null;
  const isGamePage = location.pathname === '/game';
  
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  
  // to track open active chats (max 4 FIFO)
  const [activeChats, setActiveChats] = useState<string[]>([]);
  // to track which open chats are minimized
  const [minimizedChats, setMinimizedChats] = useState<Record<string, boolean>>({});

  // opens new chat if its not already open; enforces max 4 active chats FIFO
  const handleOpenChat = (username: string) => {
    // un-minimize if already open
    setMinimizedChats(prev => ({ ...prev, [username]: false }));

    setActiveChats(prev => {
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
    setActiveChats(prev => prev.filter(u => u !== username));
    setMinimizedChats(prev => {
      const next = { ...prev };
      delete next[username];
      return next;
    });
  };

  // toggle minimize state for a specific chat window
  const handleToggleMinimize = (username: string) => {
    setMinimizedChats(prev => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  // precomputed positioning for chat popups
  const chatBottom = isGamePage ? 'bottom-3' : 'bottom-14';
  const chatLeft = isFriendsOpen ? 'left-[21rem]' : isGamePage ? 'left-36' : 'left-4';

  // unconditionally wrap the entire app in websocketprovider.
  // the provider handles the authentication check internally.
  return (
    <WebSocketProvider>
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
        />
      </div>
    </WebSocketProvider>
  );
}