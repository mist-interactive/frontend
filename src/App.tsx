import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameLayout from './layouts/GameLayout';
import StandardLayout from './layouts/StandardLayout';
import GlobalLayout from './layouts/GlobalLayout';
import Game from './pages/Game';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import Chat from './pages/Chat';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route element={<GlobalLayout />}>
          
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes, if not logged in, redirected to /login*/}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/chat" element={<Chat />} />
            
            {/* Gamelayout*/}
            <Route element={<GameLayout />}>
              <Route path="/game" element={<Game />} />
            </Route>
          </Route>

        </Route>

      </Routes>
    </BrowserRouter>
  );
}