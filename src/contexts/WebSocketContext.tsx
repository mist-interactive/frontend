import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { getValidToken } from '../utils/auth';

// define data struct that mirrors backend json
export interface WSMessage {
  type: string;
  payload: any;
}

// define the properties this context will expose to consumer components
interface WebSocketContextType {
  sendMessage: (msg: WSMessage) => void;
  lastMessage: WSMessage | null;
  activeMatchId: number | null; // central state for active match
  subscribe: (callback: (msg: WSMessage) => void) => () => void;
}

// initialize safe default values so consumer components don't need null checks
const defaultContext: WebSocketContextType = {
  sendMessage: () => {},
  lastMessage: null,
  activeMatchId: null,
  subscribe: () => () => {},
};

// initialize the context with safe defaults
const WebSocketContext = createContext<WebSocketContextType>(defaultContext);

// custom hook for child components to consume the context
// usage: const { sendMessage, lastMessage, activeMatchId, subscribe } = useWebSocket();
export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

// provider component actual i/o logic
export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  // state for incoming data that requires ui re-renders
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  
  // ref holds the active websocket connection
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // set of subscribers listening synchronously for websocket messages
  const listenersRef = useRef<Set<(msg: WSMessage) => void>>(new Set());
  // flag to guard against concurrent connection calls
  const isConnectingRef = useRef(false);

  // allow components to subscribe directly to incoming websocket messages
  const subscribe = useCallback((callback: (msg: WSMessage) => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let reconnectDelay = 2000;

    const connect = async () => {
      // prevent multiple connection attempts running at the same time
      if (isConnectingRef.current) return;
      isConnectingRef.current = true;

      try {
        // retrieve valid auto-renewed token
        const token = await getValidToken();
        if (!token) {
          isConnectingRef.current = false;
          return;
        }

        if (!isMounted) {
          isConnectingRef.current = false;
          return;
        }

        // prevent redundant connections if socket is already open or connecting
        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
          isConnectingRef.current = false;
          return;
        }

        // construct the connection url dynamically based on current window location
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:8443';
        const url = `${protocol}//${host}/api/ws?token=${token}`;

        // open the connection
        const socket = new WebSocket(url);
        ws.current = socket;

        socket.onopen = () => {
          console.log("[WS Connected]");
          reconnectDelay = 2000; // reset delay on successful connection
          isConnectingRef.current = false;
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

            // deliver message immediately to all registered subscribers
            listenersRef.current.forEach((listener) => {
              try {
                listener(data);
              } catch (listenerError) {
                console.error("error in ws listener:", listenerError);
              }
            });

            setLastMessage(data); // expose new data for backwards compatibility
          } catch (err) {
            console.error("Failed to parse incoming WS message:", err);
          }
        };

        // error and closure logging
        socket.onerror = (error) => {
          isConnectingRef.current = false;
          // suppress error log if component was unmounted
          if (!isMounted) return;
          console.error("[WS Error]:", error);
        };

        socket.onclose = () => {
          isConnectingRef.current = false;
          if (!isMounted) return;
          console.log("[WS Closed]");
          // auto-reconnect with fresh token if component is still mounted
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[WS Reconnecting...]");
            connect();
          }, reconnectDelay);
          // exponential backoff capped at 10s
          reconnectDelay = Math.min(reconnectDelay * 1.5, 10000);
        };
      } catch (err) {
        isConnectingRef.current = false;
        console.error("failed to connect websocket:", err);
      }
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
    <WebSocketContext.Provider value={{ sendMessage, lastMessage, activeMatchId, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};