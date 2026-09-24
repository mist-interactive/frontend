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
  
  // to track open active chats
  const [activeChats, setActiveChats] = useState<string[]>([]);

  // opens new chat if its not already open
  const handleOpenChat = (username: string) => {
    if (!activeChats.includes(username)) {
      setActiveChats([...activeChats, username]);
    }
  };

  // closes the chat (deletes username from the array)
  const handleCloseChat = (username: string) => {
    setActiveChats(activeChats.filter(u => u !== username));
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
            <div className={`fixed ${chatBottom} ${chatLeft} flex items-end gap-4 z-40 transition-all duration-300`}>
              {activeChats.map((username) => (
                <ChatWindow 
                  key={username}
                  friendUsername={username} 
                  onClose={() => handleCloseChat(username)} 
                />
              ))}
            </div>
          )}
          
          {/* main page content */}
          <main className="flex-1 overflow-y-auto w-full h-full">
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