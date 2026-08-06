import { useState, useRef } from "react";

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

  // handler that fires after iframe finishes loading
  const handleIframeLoad = () => {
    const token = localStorage.getItem("token");

    // verify ref, contentWindow, and token exist before injecting
    if (iframeRef.current && iframeRef.current.contentWindow && token) {
      // transfer token into global object inside the iframe window context
      iframeRef.current.contentWindow.gameJWT = token;
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