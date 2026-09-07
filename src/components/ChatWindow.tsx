import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { useWebSocket } from '../contexts/WebSocketContext';

/*
  INTERFACE: Matches the Go backend JSON output for Message exactly.
*/
export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_username?: string;
}

/*
  PROPS: The parent component (ChatWindowManager) will pass these to ChatWindow.
  friendUsername tells the window WHO to fetch messages for.
  onClose is the function to run when the user clicks the X button.
*/
interface ChatWindowProps {
  friendUsername: string;
  onClose: () => void;
}
// helper to decode the JWT to get our own user_id
const getMyUserId = (): number => {
  const token = localStorage.getItem("token");
  if (!token) return -1;
  try {
    // JWT has 3 parts separated by dots. The payload is in the middle (index 1).
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id;
  } catch (e) {
    return -1;
  }
};

export default function ChatWindow({ friendUsername, onClose }: ChatWindowProps) {
  // UI states
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { sendMessage, lastMessage } = useWebSocket();
  const myUserId = getMyUserId();

  /*
    EFFECT: Fetches message history when the window mounts.
    Dependency array [friendUsername] ensures that if the prop changes,
    the component re-fetches the correct history.
  */
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiFetch(`/api/protected/messages/${friendUsername}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        setMessages(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [friendUsername]);

  // listen for incoming websocket messages.
  useEffect(() => {
    if (!lastMessage) return;

    // check if it's a DM and if it belongs to this specific chat window
    if (lastMessage.type === 'direct_message_recv' && lastMessage.payload.username === friendUsername) {
      const incomingMsg: Message = {
        id: lastMessage.payload.id,
        sender_id: -1, // We don't have the numeric ID in the WS payload, but that's ok
        recipient_id: -1, 
        content: lastMessage.payload.content,
        is_read: false,
        created_at: lastMessage.payload.created_at,
        sender_username: lastMessage.payload.username
      };

      // Append incoming message to the local list
      setMessages((prevMessages) => [...prevMessages, incomingMsg]);
    }
  }, [lastMessage, friendUsername]);

  /*
    HANDLER: Sends a new message.
    Currently a stub. Because of our architecture, this will NOT be an HTTP POST.
    It will be a WebSocket transmission to avoid overhead and enable instant two-way delivery.
  */
 const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    // Send the JSON payload exactly as the backend expects
    sendMessage({
      type: "direct_message_send",
      payload: {
        username: friendUsername,
        content: currentMessage
      }
    });

    // Optimistic UI update: draw our own message immediately
    const optimisticMsg: Message = {
      id: Date.now(), // Temporary fake ID for React keys
      sender_id: 0, // 0 represents "ME" right now
      recipient_id: 0,
      content: currentMessage,
      is_read: true,
      created_at: new Date().toISOString(),
      sender_username: "ME"
    };

    setMessages((prevMessages) => [...prevMessages, optimisticMsg]);
    setCurrentMessage(""); // Clear input field
  };

  return (
    /* 
      Main container
    */
   <div className="w-80 h-96 border-black border-b-0 flex flex-col shadow-[8px_8px_0_0_#000000] font-sans">
      {/* HEADER: Shows who we are talking to and the close button */}
      <div className="flex justify-between items-center p-3 bg-zinc-800 border-b-4 border-black shrink-0">
        <span className="font-bold text-zinc-100 uppercase tracking-widest text-sm">{friendUsername}</span>
        <button 
          onClick={onClose} 
          className="text-red-500 hover:text-red-400 font-bold text-lg leading-none transition-colors"
        >
          ✖
        </button>
      </div>

      {/* MESSAGE LOG: flex-1 takes remaining space, overflow-y-auto makes it scrollable */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4 bg-zinc-900">
        
        {isLoading && <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest text-center border-2 border-zinc-800 p-2">Loading...</span>}
        {error && <span className="text-red-400 text-xs font-bold uppercase tracking-widest text-center border-2 border-red-900 p-2">{error}</span>}
        
        {!isLoading && !error && messages.map((msg) => {
          
          // LOGIC: Determine if the message is sent by us
          const isMe = msg.sender_id === myUserId || msg.sender_username === 'ME';

          return (
            // WRAPPER: Aligns the bubble to the left or right
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              
              {/* BUBBLE: Slightly different background color for our own messages */}
              <div className={`flex flex-col border-2 border-black p-2 shadow-[2px_2px_0_0_#000000] w-fit max-w-[90%] ${
                isMe ? 'bg-zinc-700' : 'bg-zinc-800'
              }`}>
                
                <div className={`flex justify-between items-end gap-4 mb-1 border-b pb-1 ${isMe ? 'border-zinc-600' : 'border-zinc-700'}`}>
                  
                  {/* SENDER NAME: Show "ME" or the friend's username */}
                  <span className={`font-bold text-[10px] uppercase tracking-wider ${isMe ? 'text-lime-500' : 'text-amber-500'}`}>
                    {isMe ? 'ME' : friendUsername}
                  </span>
                  
                  <span className="text-zinc-400 font-bold text-[10px]">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                </div>
                <span className="text-zinc-100 text-sm">{msg.content}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT AREA: Matches old Chat.tsx logic */}
     <div className="p-3 bg-zinc-800 border-t-4 border-black flex gap-2 shrink-0">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="MESSAGE..."
          className="w-full flex-1 p-2 bg-zinc-900 text-white font-bold text-xs uppercase tracking-wider border-2 border-black outline-none focus:border-lime-700 transition-colors"
        />
        <button
          onClick={handleSendMessage}
          className="bg-lime-700 text-white font-bold uppercase tracking-widest px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_#000000] hover:bg-lime-600 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-xs"
        >
          Send
        </button>
      </div>
      
    </div>
  );
}