import { Link } from 'react-router-dom';

export default function Navbar() {

  // check if user is logged in
  const isAuthenticated = localStorage.getItem("token") !== null;

  // define the logout action
  const handleLogout = () => {
    // 1. remove the token from local storage
    localStorage.removeItem("token");
    
    // 2. force hard refresh
    window.location.href = "/";
    
  };

  return (
    <nav className="p-4 bg-zinc-800 text-white flex justify-between shrink-0">
      
      <div className="flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/game">Game</Link>
      </div>

      <div className="flex gap-4 items-center">
        {/* use a ternary operator here to conditionally render the buttons */}
        {isAuthenticated ? (
          
          /* what to show if logged in */
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
            Logout
          </button>

        ) : (

          /* what to show if NOT logged in (fragment used to wrap multiple elements) */
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="bg-zinc-600 hover:bg-zinc-500 px-3 py-1 rounded">
              Sign Up
            </Link>
          </>

        )}
      </div>
      
    </nav>
  );
}