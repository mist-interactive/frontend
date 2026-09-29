import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { getValidToken } from '../utils/auth';

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

// provider component actual i/o logic
export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  // state for incoming data that requires ui re-renders
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null); // global match state
  
  // ref holds the active websocket connection
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;
    let reconnectDelay = 2000;

    const connect = async () => {
      // retrieve valid auto-renewed token
      const token = await getValidToken();
      if (!token) {
        console.log("WS connection aborted: no valid token found. supplying safe defaults.");
        return;
      }

      if (!isMounted) return;

      // prevent redundant connections if socket is already open or connecting
      if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      // construct the connection url
      const url = `wss://localhost:8443/api/ws?token=${token}`;

      // open the connection
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => {
        console.log("[WS Connected]");
        reconnectDelay = 2000; // reset delay on successful connection
      };

      // define the message handler
      socket.onmessage = (event) => {
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

      // error and closure logging
      socket.onerror = (error) => {
        console.error("[WS Error]:", error);
      };

      socket.onclose = () => {
        console.log("[WS Closed]");
        // auto-reconnect with fresh token if component is still mounted
        if (isMounted) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[WS Reconnecting...]");
            connect();
          }, reconnectDelay);
          // exponential backoff capped at 10s
          reconnectDelay = Math.min(reconnectDelay * 1.5, 10000);
        }
      };
    };

    connect();

    // cleanup function
    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // run effect once on mount

  // function exposed to send data to the backend
  const sendMessage = (msg: WSMessage) => {
    // verify connection is open before sending
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    } else {
      console.error("Cannot send message, WebSocket is not open");
    }
  };

  // wrap children in provider passing down state
  return (
    <WebSocketContext.Provider value={{ sendMessage, lastMessage, activeMatchId }}>
      {children}
    </WebSocketContext.Provider>
  );
};