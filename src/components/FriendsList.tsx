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
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'ADD_FRIEND'; payload: Friend }
  | { type: 'UPDATE_STATUS'; payload: { id: number; status: 'accepted' | 'blocked' } }
  | { type: 'REMOVE_FRIEND'; payload: number };;

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
        throw new Error('Failed to send friend request');
      }

      // empty new friend name input field
      setNewFriendName("");

      const responseData = await response.json();
      const newRequest: Friend = {
        friendship_id: responseData.id,
        user_id: 0, // Backend ei palauta tätä POST-kutsussa, asetetaan väliaikaisesti 0
        username: newFriendName,
        avatar_url: null,
        status: responseData.status,
        is_incoming: false // Pyyntö lähti meiltä, joten se ei ole saapuva
      };

dispatch({ type: 'ADD_FRIEND', payload: newRequest });

      console.log("DEBUG: Friend equest sent!");

    } catch (error) {
      console.error(error);
      // to show error on ui TODO:
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

      // TODO: Update UI
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

      if (!response.ok) {
        throw new Error('Failed to remove friendship');
      }

      dispatch({ type: 'REMOVE_FRIEND', payload: friendship_id });

      console.log("Friendship removed!");

    } catch (error) {
      console.error(error);
    }
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
                onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddFriend();
                }
              }}
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
            {state.items.map((friend) => (
              
              <li key={friend.friendship_id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                
                {/* Leftside : name */}
                <div className="flex items-center gap-2">
                  <span>{friend.username}</span>
                </div>

                {/* steam styled text*/}
                <div className="flex gap-3 text-xs text-blue-600 font-bold">
                  
                  {/* Incoming friend request */}
                  {friend.status === 'pending' && friend.is_incoming && (
                    <>
                      <button 
                        onClick={() => handleAcceptFriend(friend.friendship_id)}
                        className="hover:text-green-400 transition-colors"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRemoveFriend(friend.friendship_id)}
                        className="hover:text-white transition-colors"
                      >
                        Ignore
                      </button>
                    </>
                  )}

                  {/* Friendrequest sent */}
                  {friend.status === 'pending' && !friend.is_incoming && (
                    <button 
                      onClick={() => handleRemoveFriend(friend.friendship_id)}
                      className="hover:text-white transition-colors"
                    >
                      Cancel request
                    </button>
                  )}

                  {/* Accepted friends */}
                  {friend.status === 'accepted' && (
                    <button 
                      onClick={() => handleRemoveFriend(friend.friendship_id)}
                      className="hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
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