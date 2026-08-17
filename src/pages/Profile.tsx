import { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import reactLogo from '../assets/react.svg'; //fallback pic for testing
import { apiFetch } from "../utils/apiFetch";


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
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // state for view/edit modes
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const endpoint = username ? `/api/protected/profile/${username}` : `/api/protected/profile`;
        const response = await apiFetch(endpoint);
        
        if (response.ok) 
        {
          // parse the JSON response and call setUserData()
          const data = await response.json();
          setUserData(data);

        } else {
          console.error("Failed to fetch profile data, status:", response.status);
        }
      } catch (error) {
        console.error("Network error during profile fetch:", error);
      } finally {
        // network request finished (success or fail). Turn off the loading screen.
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // handler for textfields
  const handleInputChange = (field: keyof UserProfile, value: string) => {
    // copy old object, and use dynamic key to modify wanted data
    if (userData)
      {
        setUserData({...userData, [field]: value});
      }
   
  };

  // Updating profile
  const handleSave = async () => {
    if (!userData)
      {
        return;
      }
      try {
      // create a payload object with only the text fields.
      const payload = {
        email: userData.email,
        bio: userData.bio
      };

      // execute request using your wrapper
      const response = await apiFetch('/api/protected/profile', {
        // define the correct HTTP method for updating data
        method: 'PATCH',
        // tell the server we are sending JSON data
        headers: {
          'Content-Type': 'application/json'
        },
        // convert the javascript object into a JSON string for transport
        body: JSON.stringify(payload)
      });

      // if the server returns 200 OK (or 204 No Content)
      if (response.ok) {
        // success, exit edit mode to return to view mode
        setIsEditing(false);
      } else {
        console.error("Failed to update profile, status:", response.status);
      }
    } catch (error) {
      console.error("Network error during profile update:", error);
    }
  };
  

  // Render a loading screen while the fetch request is pending.
  if (isLoading) {
    return <div className="p-4 bg-gray-900 text-white min-h-screen">Loading profile...</div>;
  }

  // If loading finished but we have no data (e.g., 404 Not Found), show an error.
  if (!userData) {
    return <div className="p-4 bg-gray-900 text-white min-h-screen">Profile not found.</div>;
  }

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