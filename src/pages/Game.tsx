import { useState, useRef, useEffect } from "react";

// declare global interface for typescript
declare global {
  interface Window {
    gameJWT: string | null;
  }
}

export default function Game() {
  // useState variable which controls iframe rendering
  const [isGameReady, setIsGameReady] = useState(false);

  // useRef hook to access the iframe DOM element
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // useEffect hook to listen for godot engine readiness
  useEffect(() => {
    // handler for incoming messages from the window
    const handleMessage = (event: MessageEvent) => {
      // check if message is from godot declaring it is ready
      if (event.data && event.data.type === 'GODOT_READY') {
        
        // get it from local storage
        const token = localStorage.getItem("token");
        // mock match ID for testing purposes
        const matchId = "test_match_123";

        // ensure iframe, its window object, and the token exist before sending
        if (iframeRef.current && iframeRef.current.contentWindow && token) {
          
          // construct the payload with a specific type identifier
          const payload = {
            type: "INIT_GAME",
            token: token,
            match_id: matchId
          };

          // send the payload to the iframe with postmessage
          // '*' allows any origin. !!!!!Change to specific domain in production!!!!
          iframeRef.current.contentWindow.postMessage(payload, "*");
        }
      }
    };

    // attach the event listener to the global window
    window.addEventListener("message", handleMessage);

    // cleanup function to remove listener when component unmounts
    return () => window.removeEventListener("message", handleMessage);
  }, []); // empty dependency array ensures this runs only once on mount

  // handler that checks token and changes state
  const handlePlay = () => {
    // get it from local storage
    const token = localStorage.getItem("token");

    // check if token exists
    if (token) {
      // update state to render iframe into DOM
      setIsGameReady(true);
    } else {
      console.error("Test token couldnt be found.");
    }
  };

  return (
    <div className="absolute inset-0 bg-black flex justify-center items-center flex-col">
      {isGameReady ? (
        /* phase 2 game is rendered */
        <iframe
          ref={iframeRef}
          src="/game/index.html"
          onLoad={handleIframeLoad}
          className="w-full h-full border-none block"
          style={{ overflow: 'hidden' }}
          scrolling="no"
          title="Godot Game"
        />
      ) : (
        /* phase 1 lobby */
        <>
          <h1 className="text-4xl font-bold mb-8 text-white">Game Lobby</h1>
          <button
            onClick={handlePlay}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded font-bold text-2xl transition-colors"
          >
            PLAY
          </button>
        </>
      )}
    </div>
  );
}