import FriendsList from '../components/FriendsList';
import { useState } from 'react';

interface Message {
  id: string;
  sender: string;
  timestamp: string;
  content: string;
}

export default function Chat() {

    const [messages, setMessages] = useState<Message[]>([
    { id: '1',
    sender: 'pelaaja2',
    timestamp: '11:30',
    content: 'Terve!' 
    }
]);

    const [currentMessage, setCurrentMessage] = useState("");

    const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    //new message object
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'mhirvasm',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: currentMessage
    };

    // update messagelog through usestate
    setMessages([...messages, newMessage]);

    // reset input field
    setCurrentMessage("");
  };

  return (

    <div className="flex h-full w-full bg-gray-950">
      
      {/* Left side */}
      <FriendsList />
      
      {/* Right side for upcoming messages */}
      <div className="flex-1 flex flex-col p-4">
        
        {/* Messagelog: overflow-y-auto enables scroll effect */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col bg-gray-800 p-3 rounded w-fit max-w-lg">
              <div className="flex justify-between items-end gap-4 mb-1">
                <span className="text-blue-400 font-bold">{msg.sender}</span>
                <span className="text-gray-500 text-xs">{msg.timestamp}</span>
              </div>
              <span className="text-white">{msg.content}</span>
            </div>
          ))}
        </div>

        {/* Input form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="w-full flex-1 p-2 bg-gray-800 text-white rounded outline-none border border-gray-600 focus:border-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 hover:bg-blue-600 transition-colors px-6 py-2 rounded text-white font-bold"
          >
            Send
          </button>
        </div>
        
      </div>
      
    </div>
  );
}