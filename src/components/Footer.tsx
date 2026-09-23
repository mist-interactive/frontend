import { Link } from 'react-router-dom';

interface FooterProps {
  isAuthenticated?: boolean;
  isFriendsOpen?: boolean;
  onToggleFriends?: () => void;
  isGame?: boolean;
}

export default function Footer({ isAuthenticated, isFriendsOpen, onToggleFriends, isGame }: FooterProps) {
  // in game view, only render standalone friends button if authenticated
  if (isGame) {
    if (!isAuthenticated || !onToggleFriends) {
      return null;
    }
    return (
      <button 
        onClick={onToggleFriends}
        className={`fixed bottom-3 left-3 z-50 h-10 px-4 flex items-center gap-2 border-4 border-black shadow-[4px_4px_0_0_#000000] font-bold uppercase tracking-wider text-xs transition-colors ${
          isFriendsOpen 
            ? 'bg-lime-700 text-white' 
            : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
        }`}
      >
        <span>👥</span>
        <span>Friends</span>
      </button>
    );
  }

  return (
    // tactical footer dock with integrated friends toggle and legal links
    <footer className="w-full bg-zinc-900 border-t-4 border-black h-12 flex items-center justify-between text-zinc-400 font-sans shrink-0 z-30">
      
      {/* left: friends toggle (when logged in) + branding */}
      <div className="flex items-center h-full">
        {isAuthenticated && onToggleFriends && (
          <button 
            onClick={onToggleFriends}
            className={`h-full px-4 flex items-center gap-2 border-r-4 border-black font-bold uppercase tracking-wider text-xs transition-colors ${
              isFriendsOpen 
                ? 'bg-lime-700 text-white' 
                : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            <span>👥</span>
            <span>Friends</span>
          </button>
        )}

        <div className="flex items-center gap-2 px-4 text-xs">
          <span className="font-bold text-zinc-200 uppercase tracking-widest">Memoir 3167</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-500 uppercase tracking-wider hidden sm:inline">ft_transcendence</span>
        </div>
      </div>

      {/* right: legal links */}
      <div className="flex items-center gap-4 sm:gap-6 font-bold uppercase tracking-wider text-xs px-4">
        <Link 
          to="/terms" 
          className="hover:text-lime-400 transition-colors"
        >
          Terms of Service
        </Link>
        <span className="text-zinc-700">•</span>
        <Link 
          to="/privacy" 
          className="hover:text-lime-400 transition-colors"
        >
          Privacy Policy
        </Link>
      </div>

    </footer>
  );
}
