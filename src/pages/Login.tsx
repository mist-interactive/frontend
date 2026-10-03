import { useState } from "react";
import { Link } from "react-router-dom";
import { setAuth } from "../utils/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = username.trim();

    // validation: check for empty strings and length constraints
    if (!trimmedUsername || !password) {
      setError("Please enter both username/email and password.");
      return;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 255) {
      setError("Username or email must be between 3 and 255 characters.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Password must be between 8 and 72 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      // phase 1: send credentials. backend sets httponly cookie on success
      const loginResponse = await fetch('/api/login', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: password,
        }),
      });

      // check if login passed
      if (!loginResponse.ok) {
        const errText = await loginResponse.text().catch(() => "");
        if (loginResponse.status === 404 || loginResponse.status === 403) {
          setError("Invalid username/email or password.");
        } else if (errText.includes("Validation error")) {
          setError("Invalid username/email or password format.");
        } else {
          setError(errText || "Login failed. Please check your credentials.");
        }
        setIsSubmitting(false);
        return;
      }

      // phase 2: login successful and cookie is set. fetch jwt
      const renewResponse = await fetch('/api/renew', {
        method: "POST",
      });

      if (!renewResponse.ok) {
        setError("Failed to retrieve access token.");
        setIsSubmitting(false);
        return;
      }

      const jwtData = await renewResponse.json();

      // phase 3: save token and user claims to local storage
      setAuth(jwtData.token);
      sessionStorage.setItem("open_friends_on_login", "true");

      // phase 4: redirect user 
      window.location.href = "/";
    } catch (err) {
      // handle network failures (backend is offline)
      setError("Network error. Could not reach the server.");
      setIsSubmitting(false);
    }
  };

  const isFormValid = username.trim().length >= 3 && password.length >= 8;

  return (
    <div className="min-h-full py-8 bg-zinc-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-zinc-800 border-4 border-black p-5 sm:p-8 w-full max-w-md shadow-[6px_6px_0_0_#000000] sm:shadow-[8px_8px_0_0_#000000]">
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 uppercase tracking-widest text-center mb-6 sm:mb-8">
          Login
        </h2>

        {/* conditionally render the error message if the error state has a string */}
        {error && (
          <div className="mb-6 bg-red-900/50 border-4 border-red-500 p-3">
            <p className="text-red-200 font-bold text-center text-xs uppercase tracking-wider">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* username or email field */}
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-xs font-bold text-zinc-400 mb-1 tracking-wider uppercase">
              Username or Email
            </label>
            <input
              type="text"
              id="username"
              maxLength={255}
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or Email"
              className="bg-zinc-900 border-4 border-black text-white p-3 outline-none focus:border-lime-700 transition-colors text-sm font-medium"
            />
          </div>

          {/* password field */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-xs font-bold text-zinc-400 mb-1 tracking-wider uppercase">
              Password
            </label>
            <input
              type="password"
              id="password"
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-zinc-900 border-4 border-black text-white p-3 outline-none focus:border-lime-700 transition-colors text-sm font-medium"
            />
          </div>

          {/* submit button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="mt-4 bg-lime-700 text-white font-bold uppercase tracking-widest px-6 py-4 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging in..." : "Submit"}
          </button>
        </form>

        {/* link to registration for new users */}
        <div className="mt-8 text-center">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
            Don't have an account? <br className="mb-2" />
            <Link to="/register" className="text-lime-500 hover:text-lime-400 underline decoration-2 underline-offset-4 transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}