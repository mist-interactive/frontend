import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './Login';
import Home from './Home';
import Game from './Game';
import ProtectedRoute from './ProtectedRoute';

export default function App() {
  // components return
  return (
    <BrowserRouter>
      {/* lock app wrapper size to screen limits */}
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        
        {/* This navbar is always visible */}
        <nav className="p-4 bg-zinc-800 text-white flex gap-4 shrink-0">
          <Link to="/">Home</Link>
          <Link to="/game">Game</Link>
          <Link to="/login">Login</Link>
        </nav>

        {/* This changes by URLS*/}
        <main className="flex-1 w-full relative overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<ProtectedRoute><Game/></ProtectedRoute>} />
            <Route path="/login" element={<Login/>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}