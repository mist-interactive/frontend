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

  // if param in URL, use it, otherwise assume its /me
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [initialUserData, setInitialUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // state for view/edit modes
  const [isEditing, setIsEditing] = useState(false);
  // store selected file for upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  // local preview url for selected avatar
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // saving indicator for button state
  const [isSaving, setIsSaving] = useState(false);

  // clean up blob preview url to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const endpoint = username ? `/api/protected/profile/${username}` : `/api/protected/profile`;
        const response = await apiFetch(endpoint);
        
        if (response.ok) 
        {
          // parse the JSON response and update user states
          const data = await response.json();
          setUserData(data);
          setInitialUserData(data);

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
    if (!userData) {
      return;
    }
    setIsSaving(true);
    try {
      let currentData = userData;

      // if user selected a new avatar, upload it to the avatar endpoint
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const avatarResponse = await apiFetch('/api/protected/avatar', {
          method: 'POST',
          body: formData,
        });

        if (!avatarResponse.ok) {
          const errorMsg = await avatarResponse.text();
          console.error("failed to upload avatar, status:", avatarResponse.status, errorMsg);
          alert(`failed to upload avatar: ${errorMsg || "unsupported format (use PNG, JPEG, or GIF)"}`);
          return;
        }

        // get profile with new avatar url from backend
        const updatedWithAvatar = await avatarResponse.json();
        currentData = {
          ...updatedWithAvatar,
          email: userData.email,
          bio: userData.bio,
        };
        setUserData(currentData);
        setAvatarFile(null);
        setPreviewUrl(null);
      }

      // dirty check: only send patch if text fields changed
      const hasTextChanges = Boolean(
        initialUserData &&
        (currentData.email !== initialUserData.email || currentData.bio !== initialUserData.bio)
      );

      if (hasTextChanges) {
        // create a payload object with only the text fields
        const payload = {
          email: currentData.email,
          bio: currentData.bio,
        };

        // execute request using your wrapper
        const response = await apiFetch('/api/protected/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          // update local state with saved profile from server
          const updated = await response.json();
          currentData = updated;
          setUserData(updated);
        } else {
          console.error("Failed to update profile, status:", response.status);
          return;
        }
      }

      // update initial snapshot and exit edit mode
      setInitialUserData(currentData);
      setIsEditing(false);
    } catch (error) {
      console.error("Network error during profile update:", error);
    } finally {
      setIsSaving(false);
    }
  };
  

  // Render a loading screen while the fetch request is pending.
  if (isLoading) {
    return <div className="p-8 bg-zinc-900 text-zinc-400 font-bold uppercase tracking-widest min-h-screen text-center">Loading profile...</div>;
  }

  // If loading finished but we have no data (e.g., 404 Not Found), show an error.
  if (!userData) {
    return <div className="p-8 bg-zinc-900 text-red-400 font-bold uppercase tracking-widest min-h-screen text-center">Profile not found.</div>;
  }

  return (
    <div className="p-8 bg-zinc-900 text-white min-h-screen font-sans">
      
      {/* avatar and fallback */}
      <div className="mb-6">
        {/* render preview when editing, otherwise avatarUrl or default fallback */}
        <img 
        src={(isEditing && previewUrl) ? previewUrl : (userData.avatarUrl || reactLogo)} 
        // alt for error cases
        alt={`${userData.username} avatar`} 
        className="w-28 h-28 border-4 border-black shadow-[4px_4px_0_0_#000000] bg-zinc-800 object-cover"
        />
      </div>

      <h1 className="text-3xl font-bold uppercase tracking-widest text-zinc-100 mb-6">{userData.username}'s Profile</h1>

      {isEditing ? (
        
        /* Editing form */
        <div className="flex flex-col gap-4 max-w-md">
        
        {/* Email */}
        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-300">
            Email:
            <input 
            type="email" 
            value={userData.email} 
            onChange={(e) => handleInputChange('email', e.target.value)} 
            className="bg-zinc-900 border-4 border-black p-2 outline-none focus:border-lime-700 transition-colors text-white tracking-wider text-sm font-bold"
            />
        </label>

        {/* Bio */}
         <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-300">
            Bio:
            <textarea 
            value={userData.bio} 
            onChange={(e) => handleInputChange('bio', e.target.value)} 
            rows={3}
            className="bg-zinc-900 border-4 border-black p-2 outline-none focus:border-lime-700 transition-colors text-white tracking-wider text-sm font-bold resize-none"
            />
        </label>

        {/* Avatar */}
        <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Avatar:</span>
            <label 
              htmlFor="avatar-upload"
              className="cursor-pointer bg-zinc-700 text-white font-bold uppercase tracking-widest px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-zinc-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-center text-xs truncate"
            >
              {avatarFile ? avatarFile.name : "Choose New Avatar"}
            </label>
            <input 
            id="avatar-upload"
            type="file" 
            accept="image/png, image/jpeg, image/gif"
            onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // check allowed image formats
                  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
                  if (!allowedTypes.includes(file.type)) {
                    alert("unsupported file format (please choose PNG, JPEG, or GIF)");
                    return;
                  }
                  // max 2mb file size limit
                  if (file.size > 2 * 1024 * 1024) {
                    alert("image too large (max 2mb)");
                    return;
                  }
                  // revoke previous preview url if one was active
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  // store file for upload on save
                  setAvatarFile(file);
                  // generate local preview url
                  setPreviewUrl(URL.createObjectURL(file));
                }
            }}
            className="hidden"
            />
            {/* helper text describing formats and max size */}
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
              PNG, JPEG or GIF • Max 2 MB
            </p>
        </div>

        <div className="flex gap-4 mt-2">
          <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-lime-700 text-white font-bold uppercase tracking-widest px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50 text-xs"
          >
              {isSaving ? "Saving..." : "Save Profile"}
          </button>
          <button 
              onClick={() => {
                // revert changes back to initial state
                if (initialUserData) {
                  setUserData(initialUserData);
                }
                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }
                setAvatarFile(null);
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="bg-zinc-700 text-white font-bold uppercase tracking-widest px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-zinc-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50 text-xs"
          >
              Cancel
          </button>
        </div>
        </div>


      ) : (

        /* View mode */
        <div className="flex flex-col gap-4 max-w-md bg-zinc-800 border-4 border-black p-4 shadow-[4px_4px_0_0_#000000]">
          <p className="text-zinc-300 text-sm">
            <strong className="text-zinc-100 uppercase tracking-wider block text-xs mb-1">Bio</strong>
            {userData.bio || <span className="text-zinc-500 italic">No bio provided</span>}
          </p>
          
          {/* edit button only showed if profile/me. (!username checks the url doesnt contain any other username) */}
          {!username && (
            <div className="pt-2">
              <button 
                onClick={() => {
                  setInitialUserData(userData);
                  setIsEditing(true);
                }}
                className="bg-zinc-700 text-white font-bold uppercase tracking-widest px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-zinc-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-xs"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

      )}
    </div>
  );
}