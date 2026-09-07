import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';

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

export default function ChatWindow({ friendUsername, onClose }: ChatWindowProps) {
  // UI states
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  /*
    HANDLER: Sends a new message.
    Currently a stub. Because of our architecture, this will NOT be an HTTP POST.
    It will be a WebSocket transmission to avoid overhead and enable instant two-way delivery.
  */
  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    // TODO: Implement WebSocket send logic here.
    // Example: ws.send(JSON.stringify({ action: "send_message", target: friendUsername, content: currentMessage }));

    setCurrentMessage("");
  };

  return (
    /* 
      Main container
    */
   <div className="w-80 h-96 bg-gray-950 border border-gray-700 rounded-t-lg flex flex-col shadow-xl">
      {/* HEADER: Shows who we are talking to and the close button */}
      <div className="flex justify-between items-center p-3 bg-gray-800 border-b border-gray-700 rounded-t-lg">
        <span className="font-bold text-white">{friendUsername}</span>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white font-bold transition-colors"
        >
          ✖
        </button>
      </div>

      {/* MESSAGE LOG: flex-1 takes remaining space, overflow-y-auto makes it scrollable */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
        
        {/* Loading and Error states */}
        {isLoading && <span className="text-gray-400 text-sm text-center">Loading...</span>}
        {error && <span className="text-red-500 text-sm text-center">{error}</span>}
        
        {/* Render messages if not loading and no errors */}
        {!isLoading && !error && messages.map((msg) => (
          <div key={msg.id} className="flex flex-col bg-gray-800 p-3 rounded w-fit max-w-[90%]">
            <div className="flex justify-between items-end gap-4 mb-1">
              
              {/* NOTE: We only have sender_id right now. We will need logic later to map ID to username. */}
              <span className="text-blue-400 font-bold text-xs">{msg.sender_id}</span>
              
              {/* Format the Go timestamp into HH:MM format */}
              <span className="text-gray-500 text-[10px]">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              
            </div>
            <span className="text-white text-sm">{msg.content}</span>
          </div>
        ))}
      </div>

      {/* INPUT AREA: Matches old Chat.tsx logic */}
      <div className="p-3 bg-gray-900 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          className="w-full flex-1 p-2 bg-gray-800 text-white rounded outline-none border border-gray-600 focus:border-blue-500 text-sm"
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 hover:bg-blue-600 transition-colors px-4 py-2 rounded text-white font-bold text-sm"
        >
          Send
        </button>
      </div>
      
    </div>
  );
}