'use client'
import { usePlayerContext } from '@/context/players'
import Link from 'next/link'
export const Navbar = () => {
  const { currentPlayer } = usePlayerContext() || {}

  return (
    <nav className='sticky flex top-0 left-0 items-center w-full h-12 bg-slate-500 justify-between p-5'>
      <div className="img-container">
        <img /> {/* Icon for site? */}
      </div>
      <div className="flex justify-end gap-5">
        <Link
          href={"#"}
          className=""
        >
          {currentPlayer?.username || 'Login'}
        </Link>
        <Link
          href={"#"}
          className=""
        >
          Logout
        </Link>
      </div>
    </nav>
  )
}