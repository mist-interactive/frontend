import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
   <div className="flex min-h-screen items-center justify-center bg-zinc-900">
      <h1 className="text-4xl font-bold text-emerald-500 underline">
        Tailwind v4 works!
      </h1>
    </div>
  )
}

export default App
