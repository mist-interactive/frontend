import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // get centralized match state directly from websocket context
  // no null checks needed because provider always exists
  const { activeMatchId } = useWebSocket();

  // check if user is logged in
  const isAuthenticated = localStorage.getItem("token") !== null;

  // handle the reconnect button click
  const handleReconnect = () => {
    if (activeMatchId !== null) {
      // route state is no longer needed because game.tsx reads from context
      navigate('/game');
    }
  };

  // define the logout action
  const handleLogout = () => {
    // 1. remove the token from local storage
    localStorage.removeItem("token");
    
    // 2. navigate to the home page or login page
    window.location.href = "/";
  };

  return (
    <nav className="relative z-50 bg-zinc-900 border-b-4 border-black p-4 flex justify-between items-center shrink-0 font-sans">

      <div className="flex gap-6 items-center">
        {/* insert logo here */}
        <Link to="/" className="text-xl font-bold text-zinc-100 uppercase tracking-widest hover:text-lime-500 transition-colors mr-4">
          Memoir3167
        </Link>

        <Link to="/game" className="text-sm font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-100 transition-colors">Game</Link>
        <Link to="/profile" className="text-sm font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-100 transition-colors">Profile</Link>
      </div>

      {/* conditional reconnect button centered and overlapping */}
      {isAuthenticated && activeMatchId && location.pathname !== '/game' && (
        <div className="absolute left-1/2 -translate-x-1/2 top-4">
          <button 
            onClick={handleReconnect}
            className="bg-amber-600 text-white font-bold uppercase tracking-widest px-8 py-4 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-amber-500 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
          >
            Reconnect
          </button>
        </div>
      )}

      <div className="flex gap-4 items-center">
        {/* use a ternary operator here to conditionally render the buttons */}
        {isAuthenticated ? (
          
          /* what to show if logged in */
          <button onClick={handleLogout} 
          className="bg-zinc-700 text-white font-bold uppercase tracking-widest px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-zinc-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
          >
            Logout
          </button>

        ) : (

          /* what to show if NOT logged in (fragment used to wrap multiple elements) */
          <>
            <Link 
              to="/login" 
              className="bg-zinc-700 text-white font-bold uppercase tracking-widest px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-zinc-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center"
            >
              Login
            </Link>
            
            <Link 
              to="/register" 
              className="bg-lime-700 text-white font-bold uppercase tracking-widest px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center"
            >
              Sign Up
            </Link>
          </>

        )}
      </div>
      
    </nav>
  );
}