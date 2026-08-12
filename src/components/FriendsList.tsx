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
    // 2. create new friend object
    // 3. call setFriends: copy old array with spread-operator??? and add new object.
    // 4. empty new friend nampe input field back to ""
  };

  // handler for removing friend
  const handleRemoveFriend = (idToRemove: string) => {
    // Logic:
    // 1. Call set friends
    // 2. use friends.filter() -method to return new array
    //    where is ever1one else but the id that was removed
  };

  return (
    <div className="p-4 bg-gray-900 text-white w-64 min-h-screen">
      <h2 className="text-xl font-bold mb-4">Friends</h2>

      {/* Add friend form */}
      <div className="flex gap-2 mb-4">
        {/* 
          1. input-field, which value is binded newFriendName-state.
          2. onChange updates newFriendName-state.
          3. button, which onClick calls handleAddFriend.
        */}
      </div>

      {/* Friendlist rendering */}
      <ul className="flex flex-col gap-2">
        {/* 
          1. use friends.map((friend) => ( ... )) render <li> for all.
          2. remember to set key={friend.id} <li>-tag.
          3. render online-status with green/red color
          4. render delete button, which onClick calls handleRemoveFriend(friend.id).
        */}
      </ul>
    </div>
  );
}