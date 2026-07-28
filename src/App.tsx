import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameLayout from './layouts/GameLayout';
import StandardLayout from './layouts/StandardLayout';
import Game from './pages/Game';
import Home from './pages/Home';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* The Game Layout */}
        <Route element={<GameLayout />}>
          <Route path="/game" element={<ProtectedRoute><Game/></ProtectedRoute>} />
        </Route>

        {/* The Standard Layout */}
        <Route element={<StandardLayout/>}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login/>} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}