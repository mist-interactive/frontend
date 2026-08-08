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
    <div>
      <h2>Register</h2>
      
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

        {/* Email field */}
        <div>
          <label htmlFor="email">Email:</label>
          <input 
            type="email" 
            id="email"
            value={email} // bind to email state
            onChange={(e) => setEmail(e.target.value)} // ppdate email state
          />
        </div>

        {/* Password field (note the type="password" to hide characters) */}
        <div>
          <label htmlFor="password">Password:</label>
          <input 
            type="password" 
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Confirm Password field */}
        <div>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input 
            type="password" 
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Submit button triggers the form's onSubmit event */}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}