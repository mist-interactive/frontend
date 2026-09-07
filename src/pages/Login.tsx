import { useState } from "react";
import { Link } from "react-router-dom";

export default function Login() {
  // useState variables
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

 

  // submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // prevent the default browser form submission
    e.preventDefault();
    
    // reset error state
    setError("");

    // validation: check for empty strings
    if (!username || !password) {
      setError("All fields are required.");
      return;
    }

    try {
      // phase 1: send credentials. backend sets httponly cookie on success
      const loginResponse = await fetch('/api/login', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            password: password,
          }),
      });
      
      // check if login passed
      if (!loginResponse.ok) {
        const data = await loginResponse.json(); 
        setError(data.message || "Login failed. Please check your credentials.");
        // stop execution here, dont try to fetch token
        return; 
      }

      // phase 2: login successful and cookie is set. fetch jwt
      const renewResponse = await fetch('/api/renew', {
          method: "POST",
      });

      if (!renewResponse.ok) {
        setError("Failed to retrieve access token.");
        return;
      }

      const jwtData = await renewResponse.json();
      
      // phase 3: save token to local storage for the iframe
      localStorage.setItem("token", jwtData.token);

      // phase 4: redirect user 
      window.location.href = "/";  

    } catch (err) {
      // handle network failures (backend is offline)
      setError("Network error. Could not reach the server.");
    }
  };

  // render the ui
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 font-sans">
    <div className="bg-zinc-800 border-4 border-black p-8 w-full max-w-md">
      <h2 className="text-3xl font-bold text-zinc-100 uppercase tracking-widest text-center mb-8">
          Login
        </h2>
      
      {/* conditionally render the error message if the error state has a string */}
      {error && (
          <div className="mb-6 bg-red-900/50 border-4 border-red-500 p-3">
            <p className="text-red-200 font-bold text-center text-sm">{error}</p>
          </div>
        )}
      
      {/* attach the submit handler to the form element */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* username field */}
        <div className="flex flex-col">
            <label htmlFor="username" className="text-xs font-bold text-zinc-400 uppercase mb-2 tracking-wider">
              Username:
            </label>
            <input 
              type="text" 
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-zinc-900 border-4 border-black text-white p-3 outline-none focus:border-lime-700 transition-colors"
            />
          </div>

        {/* password field */}
        <div className="flex flex-col">
            <label htmlFor="password" className="text-xs font-bold text-zinc-400 uppercase mb-2 tracking-wider">
              Password:
            </label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900 border-4 border-black text-white p-3 outline-none focus:border-lime-700 transition-colors"
            />
          </div>

        {/* submit button triggers the form's onSubmit event */}
        <button 
            type="submit"
            className="mt-4 bg-lime-700 text-white font-bold uppercase tracking-widest px-6 py-4 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
          >
            Submit
          </button>
      </form>
      {/* link to registration for new users */}
      <div className="mt-8 text-center">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
            Don't have an account? <br className="mb-2"/>
            <Link to="/register" className="text-lime-500 hover:text-lime-400 underline decoration-2 underline-offset-4 transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}