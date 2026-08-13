import { useState } from "react";
import { useParams } from 'react-router-dom';
import reactLogo from '../assets/react.svg'; //fallback pic for testing

// define struct for ts
interface UserProfile {
  username: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
}

/*Notes: this needs to be inside protected route, remember to update navbar behaviour too. 
  Connect to api endpoints. protected/profile/me and protected/profile/:username*/
export default function Profile() {
  // read dynamic param from URL (profile/usva --> username: usva )
  const { username } = useParams();

  // init mock-data. if param in URL, use it, otherwise assume its /me
  const [userData, setUserData] = useState<UserProfile>({
    username: username || "kaverin kaverin sedän profiili",
    email: "maitopoika@luukku.com",
    bio: "man i love fishing",
    avatarUrl: null 
  });

  // state for view/edit modes
  const [isEditing, setIsEditing] = useState(false);

  // handler for textfields
  const handleInputChange = (field: keyof UserProfile, value: string) => {
    // copy old object, and use dynamic key to modify wanted data
    setUserData({...userData, [field]: value});

   
  };

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      
      {/* avatar and fallback */}
      <div className="mb-6">
        {/* render img. if userData.avatarUrl is null, use some default*/}
        <img 
        src={userData.avatarUrl || reactLogo} 
        // alt for error cases
        alt={`${userData.username} avatar`} 
        className="w-24 h-24 rounded-full bg-gray-800 object-cover"
        />
      </div>

      <h1 className="text-3xl font-bold mb-4">{userData.username}'s Profile</h1>

      {isEditing ? (
        
        /* Editing form */
        <div className="flex flex-col gap-4 max-w-md">
        
        {/* Email */}
        <label className="flex flex-col gap-1">
            Email:
            <input 
            type="email" 
            value={userData.email} 
            onChange={(e) => handleInputChange('email', e.target.value)} 
            className="p-2 bg-gray-800 text-white rounded outline-none border border-gray-600 focus:border-blue-500"
            />
        </label>

        {/* Bio */}
         <label className="flex flex-col gap-1">
            Bio:
            <input 
            type="bio" 
            value={userData.bio} 
            onChange={(e) => handleInputChange('bio', e.target.value)} 
            className="p-2 bg-gray-800 text-white rounded outline-none border border-gray-600 focus:border-blue-500"
            />
        </label>

        {/* Avatar */}
        <label className="flex flex-col gap-1">
            Avatar:
            <input 
            type="file" 
            accept="image/*"
            onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                // Generate local temp URL for testing
                const tempUrl = URL.createObjectURL(file);
                handleInputChange('avatarUrl', tempUrl);
                }
            }}
            className="p-2 bg-gray-800 text-white rounded border border-gray-600"
            />
        </label>

        <button 
            onClick={() => setIsEditing(false)}
            className="bg-blue-500 hover:bg-blue-600 transition-colors px-4 py-2 mt-4 font-bold rounded"
        >
            Save (Mock)
        </button>
        </div>


      ) : (

        /* View mode */
        <div>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Bio:</strong> {userData.bio}</p>
          
          {/* edit button only showed if profile/me. (!username checks the url doesnt contain any other username) */}
          {!username && (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-gray-700 px-4 py-2 mt-4"
            >
              Edit Profile
            </button>
          )}
        </div>

      )}
    </div>
  );
}