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
}

// initialize the Context. Default is null before the Provider mounts.
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// 3. Custom hook for child components to consume the context.
// Usage: const { sendMessage, lastMessage } = useWebSocket();
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

// 4. The Provider component that handles the actual I/O logic.
export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  // useState is used ONLY for incoming data that requires UI re-renders.
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  
  // useRef holds the active WebSocket connection.
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // retrieve the authentication token.
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("WS connection aborted: No token found in localStorage");
      return;
    }

    // cnstruct the connection URL.
    const url = `ws://localhost:8080/api/ws?token=${token}`;

    // open the connection.
    ws.current = new WebSocket(url);

    // define the message handler.
    ws.current.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        console.log("[WS Received]:", data);
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

    // the Cleanup Function.
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // The empty dependency array ensures this effect runs exactly once on mount.

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
    <WebSocketContext.Provider value={{ sendMessage, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};