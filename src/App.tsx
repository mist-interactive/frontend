import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameLayout from './layouts/GameLayout';
import StandardLayout from './layouts/StandardLayout';
import Game from './pages/Game';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* the game layout */}
        <Route element={<GameLayout />}>
          
          {/* the protected route acts as a gatekeeper for anything nested inside it */}
          <Route element={<ProtectedRoute />}>
            <Route path="/game" element={<Game/>} />
          </Route>
          
        </Route>

        {/* The Standard Layout */}
        <Route element={<StandardLayout/>}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}