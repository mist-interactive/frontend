import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FriendsList from '../components/FriendsList';
import ChatWindow from '../components/ChatWindow';

export default function GlobalLayout() {
 
  const isAuthenticated = localStorage.getItem("token") !== null;

  return (
    // Changed to flex-col so items stack vertically
    <div className="flex flex-col h-screen w-full bg-zinc-100 overflow-hidden">
      
      {/* navbar is now at the very top and spans 100% width */}
      <Navbar />
      
      {/* 2. Content wrapper for the remaining screen height. */}
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* The overlay sidebar */}
        {isAuthenticated && <FriendsList />}

        {/* Temp test  */}
        {isAuthenticated && (
          <ChatWindow 
            friendUsername="nraatika" 
            onClose={() => console.log("Sulje painettu")} 
          />
        )}
        
        {/* Main page content */}
        <main className="flex-1 overflow-y-auto w-full h-full">
          <Outlet />
        </main>

      </div>
      
    </div>
  );
}