import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  // check authentication state for contextual action buttons
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // video element reference for fullscreen mode
  const videoRef = useRef<HTMLVideoElement>(null);

  // read token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(token !== null);
  }, []);

  // toggle fullscreen mode
  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      videoRef.current.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="w-full min-h-full bg-zinc-950 text-zinc-100 flex flex-col items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* hero container styled to match 1400px profile width */}
      <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center text-center mb-12">

        {/* main title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-white mb-4 drop-shadow-[2px_2px_0_#000000]">
          Memoir <span className="text-lime-500">3167</span>
        </h1>

        {/* tagline */}
        <p className="max-w-3xl text-zinc-400 text-sm sm:text-base md:text-lg font-medium tracking-wide mb-8">
          Engage in turn-based tactical hex warfare. Command your divisions across front lines, deploy vital orders, and outmaneuver rivals in real-time competitive combat.
        </p>

        {/* primary call to action buttons */}
        <div className="flex flex-wrap gap-4 justify-center items-center mb-10">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="bg-lime-700 text-white font-bold uppercase tracking-widest px-8 py-3.5 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex items-center gap-2 text-sm sm:text-base"
              >
                <span>Command Profile</span>
                <span className="text-lime-200">→</span>
              </Link>
              <Link
                to="/game"
                className="bg-zinc-800 text-zinc-100 font-bold uppercase tracking-widest px-8 py-3.5 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-zinc-700 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-sm sm:text-base"
              >
                Launch Battlefield
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="bg-lime-700 text-white font-bold uppercase tracking-widest px-8 py-3.5 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex items-center gap-2 text-sm sm:text-base"
              >
                <span>Enlist Now</span>
                <span className="text-lime-200">→</span>
              </Link>
              <Link
                to="/login"
                className="bg-zinc-800 text-zinc-100 font-bold uppercase tracking-widest px-8 py-3.5 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-zinc-700 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-sm sm:text-base"
              >
                Operative Login
              </Link>
            </>
          )}
        </div>

        {/* wide tactical gameplay video container */}
        <div className="w-full max-w-5xl xl:max-w-6xl bg-zinc-900 border-4 border-black shadow-[8px_8px_0_0_#000000] flex flex-col overflow-hidden text-left">
          {/* video viewport */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center group overflow-hidden">
            <video
              ref={videoRef}
              src="/memoir-dummy-game-play.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* scanline screen overlay effect */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />


            {/* fullscreen toggle button */}
            <div className="absolute bottom-3 right-3 z-10">
              <button
                onClick={handleFullscreen}
                className="px-2.5 py-1 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-2 border-black font-mono text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#000000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all flex items-center gap-1.5"
                title="Expand to Fullscreen"
              >
                <span>⛶</span>
                <span className="hidden sm:inline">Fullscreen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* operations briefing / feature directives matching 1400px profile width */}
      <div className="w-full max-w-[1400px] mx-auto my-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-2 bg-lime-500" />
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-zinc-100">
            Combat Directives
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* feature card 1 */}
          <div className="bg-zinc-900 border-4 border-black p-6 shadow-[6px_6px_0_0_#000000] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-zinc-800 border-2 border-black flex items-center justify-center text-xl mb-4 shadow-[2px_2px_0_0_#000000]">
                🎯
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-lime-400 mb-2">
                Card Command System
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Formulate strategy with specialized command cards. Order sector pushes on the flanks or spearhead straight through the center.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t-2 border-zinc-800 text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
              Sector Operations // Ready
            </div>
          </div>

          {/* feature card 2 */}
          <div className="bg-zinc-900 border-4 border-black p-6 shadow-[6px_6px_0_0_#000000] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-zinc-800 border-2 border-black flex items-center justify-center text-xl mb-4 shadow-[2px_2px_0_0_#000000]">
                ⚔️
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-lime-400 mb-2">
                1v1 Tactical Duels
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Compete against other operatives in synchronized real-time matches powered by WebSocket state management.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t-2 border-zinc-800 text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
              PvP Matchmaking // Active
            </div>
          </div>

          {/* feature card 3 */}
          <div className="bg-zinc-900 border-4 border-black p-6 shadow-[6px_6px_0_0_#000000] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-zinc-800 border-2 border-black flex items-center justify-center text-xl mb-4 shadow-[2px_2px_0_0_#000000]">
                🛡️
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-lime-400 mb-2">
                War Room & Profiles
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Track combat victories, unlock service badges, inspect battle history, and coordinate operations through the tactical friends dock.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t-2 border-zinc-800 text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
              Service Records // Integrated
            </div>
          </div>
        </div>
      </div>

      {/* deployment steps banner */}
      <div className="w-full max-w-[1400px] mx-auto mt-8 mb-12 bg-zinc-900 border-4 border-black p-6 sm:p-8 shadow-[6px_6px_0_0_#000000]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime-400 mb-1">
              Field Readiness Protocol
            </div>
            <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-zinc-100">
              Ready to take command of the battlefield?
            </h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              Equip your profile, invite an operative from your friends console, and test your tactical prowess.
            </p>
          </div>

          <div className="shrink-0">
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="bg-lime-700 text-white font-bold uppercase tracking-widest px-8 py-3.5 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all inline-block text-sm sm:text-base"
              >
                Access War Room
              </Link>
            ) : (
              <Link
                to="/register"
                className="bg-lime-700 text-white font-bold uppercase tracking-widest px-8 py-3.5 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all inline-block text-sm sm:text-base"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}