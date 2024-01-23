'use client'
import { usePlayerContext } from '@/context/players'

export const Navbar = () => {
  const { currentPlayer } = usePlayerContext() || {}

  return (
    <nav className="fixed w-full h-10 flex justify-between bg-slate-500 p-2">
      <div className="img-container">
        <img /> {/* Icon for site? */}
      </div>
      <div className="flex justify-end gap-5">
        <a
          href=""
          className=""
        >
          {currentPlayer?.username || 'Login'}
        </a>
        <a
          href=""
          className=""
        >
          Logout
        </a>
      </div>
    </nav>
  )
}