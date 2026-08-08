import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  // useState variables
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

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
      navigate("/"); 

    } catch (err) {
      // handle network failures (backend is offline)
      setError("Network error. Could not reach the server.");
    }
  };

  // render the ui
  return (
    <div>
      <h2>Login</h2>
      
      {/* conditionally render the error message if the error state has a string */}
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {/* attach the submit handler to the form element */}
      <form onSubmit={handleSubmit}>
        
        {/* username field */}
        <div>
          <label htmlFor="username">Username:</label>
          <input 
            type="text" 
            id="username"
            value={username} // bind to username state
            onChange={(e) => setUsername(e.target.value)} // update username state
          />
        </div>

        {/* password field */}
        <div>
          <label htmlFor="password">Password:</label>
          <input 
            type="password" 
            id="password"
            value={password} // bind to password state
            onChange={(e) => setPassword(e.target.value)} // update password state
          />
        </div>

        {/* submit button triggers the form's onSubmit event */}
        <button type="submit">Submit</button>
      </form>
      {/* link to registration for new users */}
      <div className="mt-4">
        <p>dont have an account? <Link to="/register" className="text-blue-500 underline">register here</Link></p>
      </div>
    </div>
  );
}