import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function StandardLayout() {
  // components return
  return (
    <div className="flex flex-col min-h-screen w-screen">
      
      <Navbar />

      <main className="flex-1 w-full relative">
        <Outlet />
      </main>
    </div>
  );
}