'use client'
import { usePlayerContext } from '@/context/players'
import Link from 'next/link'

export const Navbar = () => {
  const { currentPlayer } = usePlayerContext() || {}

  return (
    <nav className='sticky flex top-0 left-0 items-center w-full h-12 bg-slate-500 justify-between p-5 text-white'>
      <div className="flex w-[15%]">
        <Link href={"/"} className="flex w-[100%]">
          <img src="https://asset.brandfetch.io/idKeVpeAGq/idap9QtdW_.svg" alt="Exploding Kittens" />
        </Link>
      </div>
      <div className="flex justify-end gap-5">
        <Link
          href={"/auth/login"}
          className=""
        >
          {currentPlayer?.username || 'Login'}
        </Link>
        <Link
          href={currentPlayer ? '#' : '/auth/signup'}
          className=""
        >
          {currentPlayer ? 'Logout' : 'Signup'}
        </Link>
      </div>
    </nav>
  )
}