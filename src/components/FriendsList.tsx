import { useState, useEffect, useReducer } from 'react';
import { apiFetch } from '../utils/apiFetch';

// friend data
interface Friend {
  friendship_id: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  status: 'pending' | 'accepted' | 'blocked';
  is_incoming: boolean;
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
  | { type: 'FETCH_ERROR'; payload: string };

// React Reducer, takes list from api and sets it into a state
function friendsReducer(state: FriendsState, action: FriendsAction): FriendsState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
      
    case 'FETCH_SUCCESS':
      return { ...state, isLoading: false, items: action.payload };
      
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };

    default:
      return state;
  }
}

export default function FriendsList() {

  const [isExpanded, setIsExpanded] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");

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

  // handler for adding new friend (empty stub for now)
  const handleAddFriend = () => {
    // TODO: implement POST /friends logic here
  };

  // handler for removing friend (empty stub for now)
  const handleRemoveFriend = (friendship_id: number) => {
    // TODO: implement DELETE /friends/{id} logic here
  };

  return (
    // Fixed: collapsed state width is now w-16
    <div className={`absolute left-0 bottom-0 bg-gray-900 border-gray-700 text-white z-50 transition-all duration-300 overflow-hidden ${
      isExpanded 
        ? 'w-64 h-full border-r'
        : 'w-64 h-16 border-r border-t rounded-tr-lg'
        }`}>

      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full h-16 flex items-center justify-center hover:bg-gray-800 transition-colors border-b border-gray-700 text-xl font-bold"
      >
        {isExpanded ? "✖" : "👥"}
      </button>

      {/* Rendering*/}
      {isExpanded && (
        <div className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
          
          <h2 className="text-xl font-bold mb-4">Friends</h2>

          {/* Add friend form */}
          <div className="flex gap-2 mb-4">
            <input 
                type="text" 
                value={newFriendName} 
                onChange={(e) => setNewFriendName(e.target.value)}
                className=" w-full flex-1 p-2 bg-gray-800 rounded outline-none border border-gray-600 focus:border-blue-500"
                placeholder="Username"
                />
                <button 
                onClick={handleAddFriend}
                className="bg-blue-500 px-4 py-2 rounded font-bold"
                >
                Add 
                </button>
          </div>

          {/* State indicators for loading and errors */}
          {state.isLoading && <p className="text-sm text-gray-400 mb-2">Loading friends...</p>}
          {state.error && <p className="text-sm text-red-500 mb-2">{state.error}</p>}

          {/* Friendlist rendering */}
          <ul className="flex flex-col gap-2">
            {/* Using state.items instead of friends */}
            {state.items.map((friend) => (
            // every element needs unique attribute, now using friendship_id
            <li key={friend.friendship_id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                <div className="flex items-center gap-2">
                {/* Replaced isOnline with status text for now */}
                <div className="text-xs text-gray-400">[{friend.status}]</div>
                <span>{friend.username}</span>
                </div>
                <button 
                onClick={() => handleRemoveFriend(friend.friendship_id)}
                className="text-red-500 hover:text-red-400 font-bold px-2"
                >
                X
                </button>
            </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}