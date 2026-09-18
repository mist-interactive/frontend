import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FriendsList from '../components/FriendsList';
import ChatWindow from '../components/ChatWindow';
import { useState } from 'react';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import MatchmakingOverlay from './MatchmakingOverlay';

export default function GlobalLayout() {
  // uselocation forces to rerender the component always after url changes
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("token") !== null;
  
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

  // unconditionally wrap the entire app in websocketprovider.
  // the provider handles the authentication check internally.
  return (
    <WebSocketProvider>
      <div className="flex flex-col h-screen w-full bg-zinc-100 overflow-hidden">

        {/* navbar is now at the very top and spans 100% width */}
        <Navbar />
        
        {/* content wrapper for the remaining screen height. */}
        <div className="flex-1 relative flex overflow-hidden">
          
          {/* the overlay sidebar */}
          {isAuthenticated && <FriendsList onOpenChat={handleOpenChat} />}

          {/* temp test  */}
          {isAuthenticated && (
            <div className="fixed bottom-0 left-[21rem] flex items-end gap-4 z-40">
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
      </div>
    </WebSocketProvider>
  );
}