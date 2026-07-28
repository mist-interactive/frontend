import { Link } from 'react-router-dom';

export default function Navbar() {
  // components return
  return (
    <nav className="p-4 bg-zinc-800 text-white flex gap-4 shrink-0">
      <Link to="/">Home</Link>
      <Link to="/game">Game</Link>
      <Link to="/login">Login</Link>
    </nav>
  );
}