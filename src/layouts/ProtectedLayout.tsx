import { Navigate, Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import FriendsList from './FriendsList';

export default function ProtectedLayout() {
  // check authentication status
  const isAuthenticated = localStorage.getItem("token") !== null;

  // write the guard condition here. 
  // If not authenticated, return a redirect to /login.
  // [Write your code here]

  // render the persistent layout for authenticated users
  return (
    // Main wrapper: full screen height, hidden overflow to prevent full-page scrolling
    <div className="flex h-screen w-full bg-zinc-900 overflow-hidden">
      
      {/* Left/Center Column: Contains Navbar and the changing page content */}
      {/* flex-1 forces this column to take all remaining space not used by the sidebar */}
      <div className="flex flex-col flex-1">
        
        {/* Navbar remains static at the top */}
        <Navbar />
        
        {/* The main content area. overflow-y-auto allows only this specific area to scroll */}
        {/* Outlet acts as a placeholder where React Router injects Profile, Game, etc. */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Right Column: The persistent friends list. */}
      {/* Because it sits outside the Outlet, it does not unmount during navigation */}
      <FriendsList />
      
    </div>
  );
}