import { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useWebSocket } from "../contexts/WebSocketContext";
import { getValidToken } from "../utils/auth";

// declare global interface for typescript
declare global {
  interface Window {
    gameJWT: string | null;
  }
}

export default function Game() {
  const location = useLocation();
  const navigate = useNavigate();

  // get centralized match state from websocket context
  const { activeMatchId: wsMatchId, lastMessage } = useWebSocket();
  const [activeMatchId, setActiveMatchId] = useState<number | null>(
    wsMatchId ?? location.state?.matchId ?? null
  );
  const [isMatchConcluded, setIsMatchConcluded] = useState(false);

  // sync activeMatchId with wsMatchId from WebSocketContext
  useEffect(() => {
    if (wsMatchId !== undefined) {
      if (wsMatchId !== null) {
        setActiveMatchId(wsMatchId);
        setIsMatchConcluded(false);
      } else if (activeMatchId !== null) {
        // ws confirmed active match has ended
        setActiveMatchId(null);
        setIsMatchConcluded(true);
        if (location.state?.matchId) {
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    }
  }, [wsMatchId, activeMatchId, location.state, location.pathname, navigate]);

  // catch match_finished event specifically to reset all states and purge router history
  useEffect(() => {
    if (lastMessage?.type === 'match_finished') {
      setActiveMatchId(null);
      setIsMatchConcluded(true);
      if (location.state?.matchId) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [lastMessage, location.state, location.pathname, navigate]);

  // useref hook to access the iframe dom element
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // useeffect hook to listen for godot engine readiness
  useEffect(() => {
    // handler for incoming messages from the window
    const handleMessage = async (event: MessageEvent) => {
      // check if message is from godot declaring it is ready
      if (event.data && event.data.type === 'GODOT_READY') {
        
        // retrieve a guaranteed valid (auto-renewed if expired) JWT token
        const token = await getValidToken();

        // ensure iframe, its window object, the token, and activematchid exist before sending
        if (iframeRef.current && iframeRef.current.contentWindow && token && activeMatchId) {
          
          // construct the payload with a specific type identifier
          const payload = {
            type: "INIT_GAME",
            token: token,
            match_id: activeMatchId
          };

          // send the payload to the iframe with postmessage
          // '*' allows any origin. !!!!change to specific domain in production!!!!
          iframeRef.current.contentWindow.postMessage(payload, "*");
          // Force the browser to recalculate the iframe's internal canvas matrix
          // after Godot initializes by nudging the iframe element dimensions.
          const iframe = iframeRef.current;
          iframe.style.width = "calc(100% - 1px)";
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              iframe.style.width = "100%";
            });
          });
          
        } else if (!token) {
          console.error("Game auth initialization aborted: could not obtain a valid token");
        }
        
      }
    };
    
    // attach the event listener to the global window
    window.addEventListener("message", handleMessage);

    // cleanup function to remove listener when component unmounts
    return () => window.removeEventListener("message", handleMessage);
  }, [activeMatchId]);

  return (
    <div className="absolute inset-0 bg-black flex justify-center items-center flex-col text-center p-4 font-sans">
      {activeMatchId ? (
        /* game is rendered directly when activematchid exists */
        <iframe
          ref={iframeRef}
          src="/game/index.html"
          className="w-full h-full border-none block"
          style={{ overflow: 'hidden' }}
          scrolling="no"
          title="Godot Game"
        />
      ) : isMatchConcluded ? (
        /* match concluded card */
        <div className="bg-zinc-900 border-4 border-black p-8 max-w-md w-full shadow-[8px_8px_0_0_#000000] flex flex-col items-center gap-4">
          <div className="w-3 h-3 bg-amber-400 border border-black shadow-[1px_1px_0_0_#000]" />
          <h1 className="text-3xl font-black text-white uppercase tracking-widest">
            Match Concluded
          </h1>
          <p className="text-zinc-400 font-bold uppercase tracking-wider text-xs">
            The match has finished and final results have been recorded to the arena database.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
            <Link
              to="/profile"
              className="flex-1 px-4 py-2.5 bg-lime-600 hover:bg-lime-500 text-black font-black uppercase tracking-widest text-xs border-4 border-black shadow-[4px_4px_0_0_#000000] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-center"
            >
              View Match History
            </Link>
            <Link
              to="/"
              className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-xs border-4 border-black shadow-[4px_4px_0_0_#000000] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      ) : (
        /* fallback if user navigates here without an active match */
        <div className="bg-zinc-900 border-4 border-black p-8 max-w-md w-full shadow-[8px_8px_0_0_#000000] flex flex-col items-center gap-4">
          <h1 className="text-3xl font-black text-white uppercase tracking-widest">
            No Active Match
          </h1>
          <p className="text-zinc-400 font-bold uppercase tracking-wider text-xs">
            Challenge a friend from the friends panel to start a duel.
          </p>
          <Link
            to="/"
            className="mt-4 px-6 py-2.5 bg-lime-600 hover:bg-lime-500 text-black font-black uppercase tracking-widest text-xs border-4 border-black shadow-[4px_4px_0_0_#000000] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-center"
          >
            Go to Arena Home
          </Link>
        </div>
      )}
    </div>
  );
}