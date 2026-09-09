import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';

export default function MatchmakingOverlay() {
  // local state to store the challenger's username
  const [challenger, setChallenger] = useState<string | null> (null);

  // bring in the websocket data and send function
  const { lastMessage, sendMessage } = useWebSocket();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  // listen and react to incoming websocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
 
      //error
      case 'error':
        setErrorMsg(lastMessage.payload.message);
        // reset error after 4 sec
        setTimeout(() => setErrorMsg(null), 4000);
        break;
      
        // match invite response 
        case 'match_invite_response':
        if (lastMessage.payload.status === 'declined' || lastMessage.payload.status === 'rejected') {
          setErrorMsg("CHALLENGE DECLINED");
          setTimeout(() => setErrorMsg(null), 4000);
        }
        break;
      // trigger the overlay when a challenge arrives
      case 'match_invite_recv':
        setChallenger(lastMessage.payload.username);
        break;
      
      // hide popup if the challenger cancels the invite
      case 'match_invite_cancel':
        if (lastMessage.payload.username === challenger) {
          setChallenger(null);
        }
        break;
      
      // match initialized by backend, navigate to game view
      case 'match_started':
        setChallenger(null);
        console.log("Match started with:", lastMessage.payload.opponent);
        navigate('/game');
        break;
      
      // if invite fails or expires, backend sends an error
      case 'error':
        console.error("Matchmaking error:", lastMessage.payload.message);
        setChallenger(null);
        break;
    }
  }, [lastMessage, navigate, challenger]);

  // handle accepting the challenge
  const handleAccept = () => {
    if (!challenger) return;
    
    sendMessage({
      type: "match_invite_response",
      payload: { username: challenger, status: "accepted" }
    });
    
    // hide the overlay while waiting for 'match_started' confirmation
    setChallenger(null);
  };

  // handle declining the challenge
  const handleDecline = () => {
    if (!challenger) return;
    
    sendMessage({
      type: "match_invite_response",
      payload: { username: challenger, status: "declined" }
    });
    
    // hide the overlay immediately
    setChallenger(null);
  };

  // if no active challenge, do not render the component
  if (!challenger) return null;

  // render the tactical pixel overlay
  return (

    <>
      {/* Error notification */}
      {errorMsg && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-red-900 border-4 border-red-500 p-4 shadow-[8px_8px_0_0_#000000]">
          <span className="text-red-100 font-bold uppercase tracking-widest text-lg">
            {errorMsg}
          </span>
        </div>
      )}

    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 font-sans">
      
      {/* main panel */}
      <div className="bg-zinc-800 border-4 border-black p-8 w-full max-w-md shadow-[8px_8px_0_0_#000000]">
        
        <h2 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest text-center mb-2">
          Incoming Challenge
        </h2>
        
        <p className="text-center text-amber-500 font-bold tracking-widest mb-8 text-xl">
          {challenger}
        </p>
        
        {/* action buttons */}
        <div className="flex gap-4">
          <button 
            onClick={handleAccept}
            className="flex-1 bg-lime-700 text-white font-bold uppercase tracking-widest py-3 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
          >
            Accept
          </button>
          
          <button 
            onClick={handleDecline}
            className="flex-1 bg-red-700 text-white font-bold uppercase tracking-widest py-3 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-red-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
          >
            Decline
          </button>
        </div>
        
      </div>
    </div>
    </>
  );
}