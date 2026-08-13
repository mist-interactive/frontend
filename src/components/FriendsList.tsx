import { useState } from 'react';

// friend data
interface Friend {
  id: string;
  username: string;
  isOnline: boolean;
}

export default function FriendsList() {
  // initialize with mock data for testing
  const [friends, setFriends] = useState<Friend[]>([
    { id: '1', username: 'mhirvasm', isOnline: true },
    { id: '2', username: 'pelaaja2', isOnline: false },
    { id: '3', username: 'testaaja', isOnline: true }
  ]);

  // state for newfriend input field
  const [newFriendName, setNewFriendName] = useState("");

  // handler for adding new friend
  const handleAddFriend = () => {
    // Logic:
    // 1. Deny empty field
    if (!newFriendName.trim()) return;
    // 2. create new friend object
    const newFriend: Friend = {
    id: Date.now().toString(),
    username: newFriendName,
    isOnline: true // assume online for testing
  };
    // 3. call setFriends: copy old array with spread-operator??? and add new object.
    setFriends([...friends, newFriend]);
    // 4. empty new friend nampe input field back to ""
    setNewFriendName("");
  };

  // handler for removing friend
  const handleRemoveFriend = (idToRemove: string) => {
    setFriends(friends.filter((friend) => friend.id !== idToRemove));
  };

  return (
    <div className="p-4 bg-gray-900 text-white w-64 min-h-screen">
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

      {/* Friendlist rendering */}
      <ul className="flex flex-col gap-2">
        {friends.map((friend) => (
        // every element needs unique attribute
        <li key={friend.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
            <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span>{friend.username}</span>
            </div>
            <button 
            onClick={() => handleRemoveFriend(friend.id)}
            className="text-red-500 hover:text-red-400 font-bold px-2"
            >
            X
            </button>
        </li>
        ))}
      </ul>
    </div>
  );
}