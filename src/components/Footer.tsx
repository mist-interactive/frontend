import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    // tactical footer with legal links
    <footer className="w-full bg-zinc-900 border-t-4 border-black p-3 text-zinc-400 font-sans shrink-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        {/* project branding */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-200 uppercase tracking-widest">Memoir 3167</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-500 uppercase tracking-wider">ft_transcendence</span>
        </div>

        {/* legal links */}
        <div className="flex items-center gap-6 font-bold uppercase tracking-wider">
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
      </div>
    </footer>
  );
}
