import { useState, useEffect, useReducer } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { HttpStatus } from '../utils/httpStatus';
import { useWebSocket } from '../contexts/WebSocketContext';

// friend data
interface Friend {
  friendship_id: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  status: 'pending' | 'accepted' | 'blocked';
  is_incoming: boolean;
  is_online?: boolean;
}

// component state
interface FriendsState {
  items: Friend[]; // store everythin in one array
  isLoading: boolean;
  error: string | null;
}

// actions
type FriendsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Friend[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'ADD_FRIEND'; payload: Friend }
  | { type: 'UPDATE_STATUS'; payload: { id: number; status: 'accepted' | 'blocked' } }
  | { type: 'REMOVE_FRIEND'; payload: number }
  | { type: 'SET_INITIAL_PRESENCE'; payload: string[] }
  | { type: 'UPDATE_PRESENCE'; payload: { username: string; is_online: boolean } };

// React Reducer, takes list from api and sets it into a state
function friendsReducer(state: FriendsState, action: FriendsAction): FriendsState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
      
    case 'FETCH_SUCCESS':
      return { ...state, isLoading: false, items: action.payload };
      
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    
    case 'ADD_FRIEND':
      // add new friend to the list
      return { ...state, items: [...state.items, action.payload] };

    case 'UPDATE_STATUS':
      return {
        ...state,
        items: state.items.map(friend => 
          friend.friendship_id === action.payload.id 
            ? { ...friend, status: action.payload.status } 
            : friend
        )
      };

    case 'REMOVE_FRIEND':
      return {
        ...state,
        items: state.items.filter(friend => friend.friendship_id !== action.payload)
      };
      case 'SET_INITIAL_PRESENCE':
      return {
        ...state,
        // go through every friend, if name is in the payload array, is_online = true
        items: state.items.map(friend => ({
          ...friend,
          is_online: action.payload.includes(friend.username)
        }))
      };

    case 'UPDATE_PRESENCE':
      return {
        ...state,
        // find the correct user and overwrite its boolean value
        items: state.items.map(friend => 
          friend.username === action.payload.username 
            ? { ...friend, is_online: action.payload.is_online } 
            : friend
        )
      };


    default:
      return state;
  }
}
interface FriendsListProps {
  onOpenChat?: (username: string) => void;
}

export default function FriendsList({ onOpenChat }: FriendsListProps) {

  const [isExpanded, setIsExpanded] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");
  const { sendMessage, lastMessage } = useWebSocket();
  const [cooldowns, setCooldowns] = useState<string[]>([]);

  // init useReducer
  const [state, dispatch] = useReducer(friendsReducer, {
    items: [],
    isLoading: true,
    error: null
  });
  
  useEffect(() => {
    const fetchFriends = async () => {
      dispatch({ type: 'FETCH_START' });

      try {
        const response = await apiFetch('/api/protected/friends');
        
        if (!response.ok) {
          throw new Error('Error fetching friendslist');
        }
        const data = await response.json();
        
        // send data to reducer
        // reducer puts the data into state.items array.
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
        
      } catch (error) {
        // error catching
        dispatch({ type: 'FETCH_ERROR', payload: 'Something went wrong' });
      }
    };

    // Execute
    fetchFriends();
    
  }, []);

  // listen presence updates through ws
  useEffect(() => {
    if (!lastMessage) return;
    

    switch (lastMessage.type) {
      case 'initial_presence':
        dispatch({ 
          type: 'SET_INITIAL_PRESENCE', 
          payload: lastMessage.payload.online_users 
        });
        break;

      case 'presence_update':
        dispatch({ 
          type: 'UPDATE_PRESENCE', 
          payload: { 
            username: lastMessage.payload.username, 
            is_online: lastMessage.payload.online_status 
          } 
        });
        break;

      // other user sent you friend request
      case 'friend_request_recv':
        dispatch({ type: 'ADD_FRIEND', payload: lastMessage.payload });
        break;

      // other user responded your request
      case 'friend_request_response':
        if (lastMessage.payload.status === 'accepted') {
          // user pressed accept
          dispatch({ 
            type: 'UPDATE_STATUS', 
            payload: { 
              id: lastMessage.payload.friendship_id, 
              status: 'accepted' 
            } 
          });
        } else {
          // user pressed decline 
          dispatch({ 
            type: 'REMOVE_FRIEND', 
            payload: lastMessage.payload.friendship_id 
          });
        }
        break;
      
    }
  }, [lastMessage]);

  // handler for adding new friend (empty stub for now)
  // deny empty field
    const handleAddFriend = async () => {
    if (!newFriendName.trim()) return;

    try {
    
        const response = await apiFetch('/api/protected/friends', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target: newFriendName
          }),
      });

      if (!response.ok) {
        throw new Error('Failed to send friend request. User might not exist.');
      }

      // empty new friend name input field
      setNewFriendName("");

      const responseData = await response.json();
      const newRequest: Friend = {
        friendship_id: responseData.id,
        user_id: 0,
        username: newFriendName,
        avatar_url: null,
        status: responseData.status,
        is_incoming: false
      };

      dispatch({ type: 'ADD_FRIEND', payload: newRequest });

      } catch (error: any) {
      // Dispatch the error to the reducer so the UI displays it to the user.
      // Reusing FETCH_ERROR as it maps to the same state.error string.
      dispatch({ type: 'FETCH_ERROR', payload: error.message });
    }
  };

  // handler for accepting a friend request
  const handleAcceptFriend = async (friendship_id: number) => {
    try {
      const response = await apiFetch(`/api/protected/friends/${friendship_id}`, {
         method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "accepted"
          }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept friend request');
      }
      dispatch({ 
        type: 'UPDATE_STATUS', 
        payload: { id: friendship_id, status: 'accepted' } 
      });

      console.log("Request accepted!");

    } catch (error) {
      console.error(error);
    }
  };

  

  // handler for removing friend
  const handleRemoveFriend = async (friendship_id: number) => {
    try {
      const response = await apiFetch(`/api/protected/friends/${friendship_id}`, {
        method: "DELETE",
      });
      // request doesnt exist on the server anymore, force UI update to clear the ghost state and exit
      if (response.status === HttpStatus.NOT_FOUND) {
          dispatch({ type: 'REMOVE_FRIEND', payload: friendship_id });
          return;
        }

      if (!response.ok) {
        throw new Error('Failed to remove friendship');
      }

      dispatch({ type: 'REMOVE_FRIEND', payload: friendship_id });

      console.log("Friendship removed!");

    } catch (error) {
      console.error(error);
    }
  };

  // handler for challenging a friend via websocket
  const handleChallenge = (username: string) => {
    // block challenging if user on cooldown list
    if (cooldowns.includes(username)) return;
    sendMessage({
      type: "match_invite_send",
      payload: { username: username }
    });
    console.log(`[WS] Challenge sent to ${username}`);
    // add user to cooldown list
    setCooldowns((prev) => [...prev, username]);
    // how long user is in cooldown list
    setTimeout(() => {
      setCooldowns((prev) => prev.filter(name => name !== username));
    }, 10000);
  };


  return (
    // main tactical wrapper. dynamic width based on state. hard borders.
    <div className={`absolute left-0 bottom-0 bg-zinc-900 border-black z-50 transition-all duration-300 overflow-hidden font-sans flex flex-col ${
      isExpanded 
        ? 'w-80 h-full border-r-4 border-t-0'
        : 'w-16 h-16 border-r-4 border-t-4'
    }`}>

      {/* toggle button - acts as the header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full h-16 shrink-0 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 transition-colors border-b-4 border-black text-xl font-bold uppercase tracking-widest text-zinc-100"
      >
        {isExpanded ? "FRIENDS" : "👥"}
      </button>

      {/* content area */}
      {isExpanded && (
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-6">
          
          {/* error/loading indicators wrapped in tactical alert boxes */}
          {state.isLoading && <div className="bg-zinc-800 border-4 border-black p-2 text-xs font-bold uppercase text-zinc-400 text-center">Loading Data...</div>}
          {state.error && <div className="bg-red-900/50 border-4 border-red-500 p-2 text-xs font-bold uppercase text-red-200 text-center">{state.error}</div>}

          {/* add friend form */}
          <div className="flex gap-2 w-full">
            <input 
                type="text" 
                value={newFriendName} 
                onChange={(e) => setNewFriendName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                className="flex-1 bg-zinc-900 border-4 border-black p-2 outline-none focus:border-lime-700 transition-colors text-white uppercase tracking-wider text-xs font-bold"
                placeholder="USERNAME"
            />
            <button 
              onClick={handleAddFriend}
              className="bg-lime-700 text-white font-bold uppercase tracking-widest px-3 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-xs"
            >
              Add
            </button>
          </div>

          {/* friend list rendering */}
          <ul className="flex flex-col gap-3">
            {state.items.map((friend) => (
              
              // tactical list item block
              <li key={friend.friendship_id} className="flex flex-col bg-zinc-800 border-4 border-black p-3 shadow-[4px_4px_0_0_#000000]">
                
                {/* top row: username and status icon */}
                <div className="flex justify-between items-center w-full mb-2">
                  <div className="flex items-center gap-2">
                    {/* green pixel indicates if friend online */}
                    <div className={`w-2 h-2 border border-black shadow-[1px_1px_0_0_#000] ${
                      friend.is_online ? 'bg-lime-500' : 'bg-zinc-600'
                    }`}></div>
                    <span className="font-bold text-zinc-100 uppercase tracking-widest text-sm">
                      {friend.username}
                    </span>
                  </div>
                  
                  {/* visual indicator of status */}
                  {friend.status === 'accepted' && <span className="text-lime-500 text-xl font-bold leading-none">+</span>}
                  {friend.status === 'pending' && <span className="text-amber-500 text-xs font-bold uppercase">Pending</span>}
                </div>

                {/* bottom row: tactical action buttons */}
                <div className="flex gap-3 justify-end border-t-2 border-zinc-900 pt-3">
                  
                  {/* pending incoming requests */}
                  {friend.status === 'pending' && friend.is_incoming && (
                    <>
                      <button 
                        onClick={() => handleAcceptFriend(friend.friendship_id)}
                        className="text-lime-500 hover:text-lime-400 font-bold uppercase text-xs tracking-widest transition-colors"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRemoveFriend(friend.friendship_id)}
                        className="text-red-500 hover:text-red-400 font-bold uppercase text-xs tracking-widest transition-colors"
                      >
                        Ignore
                      </button>
                    </>
                  )}

                  {/* pending outgoing requests */}
                  {friend.status === 'pending' && !friend.is_incoming && (
                    <button 
                      onClick={() => handleRemoveFriend(friend.friendship_id)}
                      className="text-zinc-500 hover:text-zinc-400 font-bold uppercase text-xs tracking-widest transition-colors"
                    >
                      Cancel
                    </button>
                  )}

                  {/* accepted friends actions */}
                  {friend.status === 'accepted' && (
                    <>
                      <button 
                        onClick={() => onOpenChat && onOpenChat(friend.username)}
                        className="text-zinc-300 hover:text-zinc-100 font-bold uppercase text-xs tracking-widest transition-colors"
                      >
                        Chat
                      </button>
                      
                      {/* the new challenge button */}
                      <button 
                        onClick={() => handleChallenge(friend.username)}
                        // button locked if cooldown or offline
                        disabled={cooldowns.includes(friend.username) || !friend.is_online}
                        className={`font-bold uppercase text-xs tracking-widest transition-colors ${
                          cooldowns.includes(friend.username) || !friend.is_online
                            ? 'text-zinc-600 cursor-not-allowed' 
                            : 'text-amber-500 hover:text-amber-400'
                        }`}
                      >
                        {cooldowns.includes(friend.username) ? 'WAIT' : 'DUEL'}
                      </button>

                      <button 
                        onClick={() => handleRemoveFriend(friend.friendship_id)}
                        className="text-zinc-600 hover:text-red-500 font-bold uppercase text-xs tracking-widest transition-colors ml-auto"
                      >
                        Del
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}