import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FriendsList from '../components/FriendsList';
import ChatWindow from '../components/ChatWindow';
import { useState } from 'react';

export default function GlobalLayout() {
 
  const isAuthenticated = localStorage.getItem("token") !== null;
  
  // to track open active chats
  const [activeChats, setActiveChats] = useState<string[]>([]);

  // Opens new chat if its not already open
  const handleOpenChat = (username: string) => {
    if (!activeChats.includes(username)) {
      setActiveChats([...activeChats, username]);
    }
  };

  // closes the chat (deletes username from the array)
  const handleCloseChat = (username: string) => {
    setActiveChats(activeChats.filter(u => u !== username));
  };

  return (
    // Changed to flex-col so items stack vertically
    <div className="flex flex-col h-screen w-full bg-zinc-100 overflow-hidden">

      {/* navbar is now at the very top and spans 100% width */}
      <Navbar />
      
      {/* 2. Content wrapper for the remaining screen height. */}
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* The overlay sidebar */}
        {isAuthenticated && <FriendsList onOpenChat={handleOpenChat} />}

        {/* Temp test  */}
        {isAuthenticated && (
          <div className="fixed bottom-0 left-[17rem] flex items-end gap-4 z-40">
            {activeChats.map((username) => (
              <ChatWindow 
                key={username}
                friendUsername={username} 
                onClose={() => handleCloseChat(username)} 
              />
            ))}
          </div>
        )}
        
        {/* Main page content */}
        <main className="flex-1 overflow-y-auto w-full h-full">
          <Outlet />
        </main>

      </div>
      
    </div>
  );
}