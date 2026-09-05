import { Outlet } from 'react-router-dom';

export default function GameLayout() {
  // components return
  return (
    // lock app wrapper size to screen limits
    <div className="flex flex-col h-full w-full overflow-hidden ">

      {/* strict boundary for child views */}
      <main className="flex-1 w-full relative overflow-hidden">
        {/* Child route (like Game.tsx) is injected here */}
        <Outlet />
      </main>
    </div>
  );
}