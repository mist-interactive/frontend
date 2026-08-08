import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    // change: added justify-between to push child divs apart
    <nav className="p-4 bg-zinc-800 text-white flex justify-between shrink-0">
      
      {/* left side navigation */}
      <div className="flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/game">Game</Link>
      </div>

      {/* right side auth links */}
      <div className="flex gap-4 items-center">
        <Link to="/login">Login</Link>
        {/* adding minimal styling to make signup look like a button */}
        <Link to="/register" className="bg-zinc-600 hover:bg-zinc-500 px-3 py-1 rounded">
          Sign Up
        </Link>
      </div>
      
    </nav>
  );
}