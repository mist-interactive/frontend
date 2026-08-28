import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FriendsList from '../components/FriendsList';

export default function GlobalLayout() {
 
  const isAuthenticated = localStorage.getItem("token") !== null;

  return (
    
    <div className="flex h-screen w-full bg-sky-400 overflow-hidden">
      
      {/* Friendslist is shown only if logged in */}
      {isAuthenticated && <FriendsList />}
      
      {/* Navbar composition settings */}
      <div className="flex flex-col flex-1">
        

        <Navbar />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto relative">
          {/* React Router injects wanted page here */}
          <Outlet />
        </main>
      </div>
      
    </div>
  );
}