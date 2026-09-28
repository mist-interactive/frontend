import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { clearAuth } from '../utils/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // get centralized match state directly from websocket context
  // no null checks needed because provider always exists
  const { activeMatchId } = useWebSocket();

  // check if user is logged in
  const isAuthenticated = localStorage.getItem("token") !== null;

  // close mobile menu whenever route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // handle the reconnect button click
  const handleReconnect = () => {
    if (activeMatchId !== null) {
      // route state is no longer needed because game.tsx reads from context
      navigate('/game');
    }
  };

  // define the logout action
  const handleLogout = () => {
    // 1. remove auth state from local storage
    clearAuth();
    
    // 2. navigate to the home page or login page
    window.location.href = "/";
  };

  return (
    <nav className="relative z-50 bg-zinc-900 border-b-4 border-black font-sans shrink-0">
      <div className="px-4 py-3 sm:px-6 flex justify-between items-center">
        {/* Left branding & desktop links */}
        <div className="flex gap-6 items-center">
          <Link
            to="/"
            className="text-lg sm:text-xl font-black text-zinc-100 uppercase tracking-widest hover:text-lime-500 transition-colors mr-2 sm:mr-4"
          >
            Memoir<span className="text-lime-500">3167</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/profile"
              className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                location.pathname.startsWith('/profile') ? 'text-lime-400' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Profile
            </Link>

            <Link
              to="/leaderboard"
              className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                location.pathname === '/leaderboard' ? 'text-lime-400' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Leaderboard
            </Link>
          </div>
        </div>

        {/* Desktop conditional reconnect button centered */}
        {isAuthenticated && activeMatchId && location.pathname !== '/game' && (
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-2">
            <button 
              onClick={handleReconnect}
              className="bg-amber-600 text-white font-black uppercase tracking-widest px-6 py-2.5 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-amber-500 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-xs animate-pulse"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Desktop auth buttons */}
        <div className="hidden md:flex gap-3 items-center">
          {isAuthenticated ? (
            <button
              onClick={handleLogout} 
              className="bg-zinc-700 text-white font-bold uppercase tracking-widest px-5 py-2 border-4 border-black shadow-[3px_3px_0_0_#000000] hover:bg-zinc-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-xs"
            >
              Logout
            </button>
          ) : (
            <>
              <Link 
                to="/login" 
                className="bg-zinc-700 text-white font-bold uppercase tracking-widest px-5 py-2 border-4 border-black shadow-[3px_3px_0_0_#000000] hover:bg-zinc-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-xs flex items-center justify-center"
              >
                Login
              </Link>
              
              <Link 
                to="/register" 
                className="bg-lime-700 text-white font-bold uppercase tracking-widest px-5 py-2 border-4 border-black shadow-[3px_3px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-xs flex items-center justify-center"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls: Reconnect badge (if active) + Hamburger toggle button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && activeMatchId && location.pathname !== '/game' && (
            <button 
              onClick={handleReconnect}
              className="bg-amber-600 text-white font-black uppercase tracking-wider px-2.5 py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000000] hover:bg-amber-500 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-[11px] animate-pulse"
            >
              Reconnect
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all flex items-center gap-1.5"
          >
            <span>{isMobileMenuOpen ? "✕" : "☰"}</span>
            <span>{isMobileMenuOpen ? "Close" : "Menu"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t-4 border-black bg-zinc-950 p-4 space-y-4 shadow-[0_8px_0_0_#000000]">
          <div className="flex flex-col gap-2">
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-3 border-2 border-black font-black uppercase tracking-wider text-xs transition-colors flex items-center justify-between ${
                location.pathname.startsWith('/profile')
                  ? 'bg-lime-500 text-black shadow-[2px_2px_0_0_#000000]'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              <span>Command Profile</span>
              <span>→</span>
            </Link>

            <Link
              to="/leaderboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-3 border-2 border-black font-black uppercase tracking-wider text-xs transition-colors flex items-center justify-between ${
                location.pathname === '/leaderboard'
                  ? 'bg-lime-500 text-black shadow-[2px_2px_0_0_#000000]'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              <span>Arena Leaderboard</span>
              <span>→</span>
            </Link>
          </div>

          {/* Mobile auth action row */}
          <div className="pt-2 border-t-2 border-zinc-800">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-black uppercase tracking-widest text-xs border-2 border-black shadow-[2px_2px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-center"
              >
                Logout
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-black uppercase tracking-widest text-xs border-2 border-black shadow-[2px_2px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-center"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 bg-lime-700 hover:bg-lime-600 text-white font-black uppercase tracking-widest text-xs border-2 border-black shadow-[2px_2px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all text-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}