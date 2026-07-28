import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function GameLayout() {
  // components return
  return (
    // lock app wrapper size to screen limits
    <div className="flex flex-col h-screen w-screen overflow-hidden ">
      
      <Navbar />

      {/* strict boundary for child views */}
      <main className="flex-1 w-full relative overflow-hidden">
        {/* Child route (like Game.tsx) is injected here */}
        <Outlet />
      </main>
    </div>
  );
}