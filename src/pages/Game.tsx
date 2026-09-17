import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useWebSocket } from "../contexts/WebSocketContext";

// declare global interface for typescript
declare global {
  interface Window {
    gameJWT: string | null;
  }
}

export default function Game() {
  // access the router location to extract state
  const location = useLocation();
  
  // initialize state from router if navigated via button
  const [activeMatchId, setActiveMatchId] = useState<number | null>(location.state?.matchId || null);

  // get websocket context safely
  const wsContext = useWebSocket();
  const lastMessage = wsContext ? wsContext.lastMessage : null;

  // listen for websocket messages in case of direct url navigation
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'active_match':
        setActiveMatchId(lastMessage.payload.match_id);
        break;
      case 'match_finished':
        setActiveMatchId(null);
        break;
    }
  }, [lastMessage]);

  // useref hook to access the iframe dom element
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // useeffect hook to listen for godot engine readiness
  useEffect(() => {
    // handler for incoming messages from the window
    const handleMessage = (event: MessageEvent) => {
      // check if message is from godot declaring it is ready
      if (event.data && event.data.type === 'GODOT_READY') {
        
        // get it from local storage
        const token = localStorage.getItem("token");

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