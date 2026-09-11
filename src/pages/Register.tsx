import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  // useState variables
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // submission handler
  const handleSubmit  = async (e: React.FormEvent<HTMLFormElement>) => {
    // prevent the default browser form submission (which reloads the page)
    e.preventDefault();
    
    // Reset error state on new submission attempt
    setError("");

    // validation: Check for empty strings
    if (!username || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    // validate the passwords are equal
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return; 
    }

    // success path: send data to backend api
    console.log("Validation passed. Ready to send:", { username, email, password });
    
    // implement fetch request to POST /register here
    try {
      const response = await fetch('/api/register', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            password: password,
            email : email,
          }),
      });
      
      // handle server-side errors here
      if (!response.ok) {
        // lets assume for now that  backend sends { "message": "Username taken" }
        const data = await response.json(); 
        setError(data.message || "Registration failed. Please try again.");
        return;
      }

      // handle success: redirect to the login page
      navigate("/login");

    } catch (err) {
      // handle network failures (backend is offline)
      setError("Network error. Could not reach the server.");
    }
  };

  // Render the UI
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 font-sans">
    <div className="bg-zinc-800 border-4 border-black p-8 w-full max-w-md">
    
      <h2 className="text-3xl font-bold text-zinc-100 uppercase tracking-widest text-center mb-8">
        Register
        </h2>
      
      {/* conditionally render the error message if the error state has a string */}
      {error && (
          <div className="mb-6 bg-red-900/50 border-4 border-red-500 p-3">
            <p className="text-red-200 font-bold text-center text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* username field */}
        <div className="flex flex-col">
            <label htmlFor="username" className="text-xs font-bold text-zinc-400 mb-2 tracking-wider">
              Username
            </label>
            <input 
              type="text" 
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-zinc-900 border-4 border-black text-white p-3 outline-none focus:border-lime-700 transition-colors"
            />
          </div>

        {/* Email field */}
        <div className="flex flex-col">
            <label htmlFor="email" className="text-xs font-bold text-zinc-400 mb-2 tracking-wider">
              Email
            </label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 border-4 border-black text-white p-3 outline-none focus:border-lime-700 transition-colors"
            />
          </div>

        {/* Password field (note the type="password" to hide characters) */}
        <div className="flex flex-col">
            <label htmlFor="password" className="text-xs font-bold text-zinc-400 uppercase mb-2 tracking-wider">
              Password
            </label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900 border-4 border-black text-white p-3 outline-none focus:border-lime-700 transition-colors"
            />
          </div>

        {/* Confirm Password field */}
        <div className="flex flex-col">
            <label htmlFor="confirmPassword" className="text-xs font-bold text-zinc-400 uppercase mb-2 tracking-wider">
              Confirm Password
            </label>
            <input 
              type="password" 
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-zinc-900 border-4 border-black text-white p-3 outline-none focus:border-lime-700 transition-colors"
            />
          </div>

        {/* Submit button triggers the form's onSubmit event */}
        <button 
            type="submit"
            className="mt-4 bg-lime-700 text-white font-bold uppercase tracking-widest px-6 py-4 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
          >
            Submit
          </button>
      </form>
      </div>
    </div>
  );
}