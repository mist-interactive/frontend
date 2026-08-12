import FriendsList from '../components/FriendsList';

export default function Chat() {
  return (

    <div className="flex min-h-screen bg-gray-950">
      
      {/* Left side */}
      <FriendsList />
      
      {/* Right side for upcoming messages */}
      <div className="flex-1 p-4 flex flex-col justify-center items-center text-gray-500">
        <p>Chat log and input field will be here</p>
      </div>
      
    </div>
  );
}