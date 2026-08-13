import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function StandardLayout() {
  // components return
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      
      <Navbar />

      <main className="flex-1 w-full relative">
        <Outlet />
      </main>
    </div>
  );
}