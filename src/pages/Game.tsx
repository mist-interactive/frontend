import { useState } from "react";

// declare global interface for typescript
declare global {
  interface Window {
    gameJWT: string | null;
  }
}

export default function Game() {
  // useState variable which controls iframe renderin
  const [isGameReady, setIsGameReady] = useState(false);

  // handler that transfers token and changes state
  const handlePlay = () => {
    // get it from local storage
    const token = localStorage.getItem("token");

    // Varmistetaan, että token on olemassa
    if (token) {
      // transfer token into global object
      window.gameJWT = token;
      
      // update state
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
            src="/game/index.html"
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