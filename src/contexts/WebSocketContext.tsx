import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

// define data struct that mirrors backend JSON
export interface WSMessage {
  type: string;
  payload: any;
}

// define the properties this context will expose to consumer components.
interface WebSocketContextType {
  sendMessage: (msg: WSMessage) => void;
  lastMessage: WSMessage | null;
  activeMatchId: number | null; // added central state for active match
}

// initialize safe default values so consumer components don't need null checks
const defaultContext: WebSocketContextType = {
  sendMessage: () => {},
  lastMessage: null,
  activeMatchId: null,
};

// initialize the context with safe defaults
const WebSocketContext = createContext<WebSocketContextType>(defaultContext);

// custom hook for child components to consume the context.
// usage: const { sendMessage, lastMessage, activeMatchId } = useWebSocket();
export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

// provider component actual I/O logic.
export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  // useState is used ONLY for incoming data that requires UI re-renders.
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null); // global match state
  
  // useRef holds the active WebSocket connection.
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // retrieve the authentication token.
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("WS connection aborted: no token found. supplying safe defaults.");
      return;
    }

    // construct the connection URL.
    const url = `wss://localhost:8443/api/ws?token=${token}`;

    // open the connection.
    ws.current = new WebSocket(url);

    // define the message handler.
    ws.current.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        console.log("[WS Received]:", data);

        // intercept and handle match state globally
        switch (data.type) {
          case 'active_match':
          case 'match_started':
            setActiveMatchId(data.payload.match_id);
            break;
          case 'match_finished':
            setActiveMatchId(null);
            break;
        }

        setLastMessage(data); // expose new data to the rest of the application
      } catch (err) {
        console.error("Failed to parse incoming WS message:", err);
      }
    };

    // error and closure logging.
    ws.current.onerror = (error) => {
      console.error("[WS Error]:", error);
    };

    ws.current.onclose = () => {
      console.log("[WS Closed]");
    };

    // the cleanup function.
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // the empty dependency array ensures this effect runs exactly once on mount.

  // function exposed to child components to send data to the backend.
  const sendMessage = (msg: WSMessage) => {
    // verify the connection exists and is in the OPEN state (readyState === 1)
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    } else {
      console.error("Cannot send message, WebSocket is not open");
    }
  };

  // wrap the children in the Provider, passing down the exposed functions and state.
  return (
    <WebSocketContext.Provider value={{ sendMessage, lastMessage, activeMatchId }}>
      {children}
    </WebSocketContext.Provider>
  );
};