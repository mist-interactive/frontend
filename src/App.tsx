import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './Login';
import Home from './Home';
import Game from './Game';
import ProtectedRoute from './ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      {/* This navbar is always visible */}
      <nav className="p-4 bg-zinc-800 text-white flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/game">Game</Link>
        <Link to="/login">Login</Link>
      </nav>

      {/* This changes by URLS */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<ProtectedRoute><Game/></ProtectedRoute>} />
        <Route path="/login" element={<Login/>} />
      </Routes>
    </BrowserRouter>
  );
}