import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkPasswordComplexity(pw: string): {
  hasLength: boolean;
  hasMixedChars: boolean;
  isValid: boolean;
} {
  const hasLength = pw.length >= 8 && pw.length <= 72;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSpecial = /[\p{P}\p{S}]/u.test(pw);
  const typesCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  const hasMixedChars = typesCount >= 2;
  return {
    hasLength,
    hasMixedChars,
    isValid: hasLength && hasMixedChars,
  };
}

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field touched states for non-intrusive validation
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const navigate = useNavigate();

  // Real-time validations
  const isUsernameValid = username.length >= 3 && username.length <= 50 && USERNAME_REGEX.test(username);
  const isEmailValid = email.length > 0 && email.length <= 255 && EMAIL_REGEX.test(email);
  const passwordStatus = checkPasswordComplexity(password);
  const isPasswordMatch = confirmPassword.length > 0 && confirmPassword === password;
  const isFormValid = isUsernameValid && isEmailValid && passwordStatus.isValid && isPasswordMatch;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      if (!isUsernameValid) {
        setError("Username must be between 3 and 50 characters (letters, numbers, _ and - only).");
      } else if (!isEmailValid) {
        setError("Please enter a valid email address.");
      } else if (!passwordStatus.isValid) {
        setError("Password must be 8–72 characters and contain at least 2 types: uppercase, lowercase, numbers, or symbols (spaces don't count).");
      } else if (!isPasswordMatch) {
        setError("Passwords do not match.");
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/register', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          email: email.trim().toLowerCase(),
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        if (errText.includes("users_username_key") || errText.toLowerCase().includes("username already")) {
          setError("This username is already taken. Please choose another.");
        } else if (errText.includes("users_email_key") || errText.toLowerCase().includes("email already")) {
          setError("An account with this email already exists.");
        } else if (errText.includes("Validation error")) {
          setError("Input validation failed on server. Please check your entries.");
        } else {
          setError(errText || "Registration failed. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }

      navigate("/login");
    } catch (err) {
      setError("Network error. Could not reach the server.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full py-8 bg-zinc-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-zinc-800 border-4 border-black p-5 sm:p-8 w-full max-w-md shadow-[6px_6px_0_0_#000000] sm:shadow-[8px_8px_0_0_#000000]">
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 uppercase tracking-widest text-center mb-6 sm:mb-8">
          Register
        </h2>

        {error && (
          <div className="mb-6 bg-red-900/50 border-4 border-red-500 p-3">
            <p className="text-red-200 font-bold text-center text-xs uppercase tracking-wider">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username Field */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label htmlFor="username" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Username
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                {username.length}/50
              </span>
            </div>
            <input
              type="text"
              id="username"
              maxLength={50}
              value={username}
              onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Maverick_99"
              className={`bg-zinc-900 border-4 ${
                touched.username && !isUsernameValid ? "border-rose-500" : "border-black"
              } text-white p-3 outline-none focus:border-lime-700 transition-colors text-sm font-medium`}
            />
            {touched.username && !isUsernameValid && (
              <span className="text-[11px] text-rose-400 font-bold tracking-wider">
                3–50 chars, letters, numbers, _ and - only
              </span>
            )}
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              id="email"
              maxLength={255}
              value={email}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className={`bg-zinc-900 border-4 ${
                touched.email && !isEmailValid ? "border-rose-500" : "border-black"
              } text-white p-3 outline-none focus:border-lime-700 transition-colors text-sm font-medium`}
            />
            {touched.email && !isEmailValid && (
              <span className="text-[11px] text-rose-400 font-bold tracking-wider">
                Please enter a valid email address
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                {password.length}/72
              </span>
            </div>
            <input
              type="password"
              id="password"
              maxLength={72}
              value={password}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              onChange={(e) => setPassword(e.target.value)}
              className={`bg-zinc-900 border-4 ${
                touched.password && !passwordStatus.isValid ? "border-rose-500" : "border-black"
              } text-white p-3 outline-none focus:border-lime-700 transition-colors text-sm font-medium`}
            />
            {/* Password Requirement Indicators */}
            <div className="flex flex-col gap-1 mt-1 text-[11px] font-bold">
              <div className={`flex items-center gap-1.5 ${passwordStatus.hasLength ? "text-lime-400" : "text-zinc-500"}`}>
                <span>{passwordStatus.hasLength ? "✓" : "•"}</span>
                <span>8 to 72 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passwordStatus.hasMixedChars ? "text-lime-400" : "text-zinc-500"}`}>
                <span>{passwordStatus.hasMixedChars ? "✓" : "•"}</span>
                <span>At least 2 types: uppercase, lowercase, numbers, or symbols (spaces don't count)</span>
              </div>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              maxLength={72}
              value={confirmPassword}
              onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`bg-zinc-900 border-4 ${
                touched.confirmPassword && !isPasswordMatch ? "border-rose-500" : "border-black"
              } text-white p-3 outline-none focus:border-lime-700 transition-colors text-sm font-medium`}
            />
            {confirmPassword.length > 0 && (
              <span
                className={`text-[11px] font-bold tracking-wider ${
                  isPasswordMatch ? "text-lime-400" : "text-rose-400"
                }`}
              >
                {isPasswordMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
              </span>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="mt-4 bg-lime-700 text-white font-bold uppercase tracking-widest px-6 py-4 border-4 border-black shadow-[4px_4px_0_0_#000000] hover:bg-lime-600 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Registering..." : "Submit"}
          </button>

          {/* terms and privacy acceptance notice */}
          <p className="text-[11px] text-zinc-400 text-center tracking-wider mt-2">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="text-lime-400 font-bold underline hover:text-lime-300">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-lime-400 font-bold underline hover:text-lime-300">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}