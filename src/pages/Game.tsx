import { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  // get centralized match state from websocket context, with fallback to router location state
  const { activeMatchId: wsMatchId } = useWebSocket();
  const activeMatchId = wsMatchId ?? location.state?.matchId ?? null;

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
    <div className="absolute inset-0 bg-black flex justify-center items-center flex-col text-center">
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
      ) : (
        /* fallback if user navigates here without an active match */
        <>
          <h1 className="text-4xl font-bold mb-8 text-white uppercase tracking-widest">
            no active match
          </h1>
          <p className="text-zinc-400 font-bold uppercase tracking-widest">
            challenge a friend to play.
          </p>
        </>
      )}
    </div>
  );
}