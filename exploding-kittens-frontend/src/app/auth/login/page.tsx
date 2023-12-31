'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayerContext } from '@/context/players'

const Login = () => {
  const router = useRouter()
  const { setCurrentPlayer } = usePlayerContext() || {}
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const handleLogin = async () => {

    try {
      await fetch('http://localhost:3000/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
        }),
      })
      .then(res => res.json())
      .then((data: User) => {
        if (setCurrentPlayer && data.username) {
          console.log(data)
          setCurrentPlayer(data)
          router.push('/')
        }
      })
    } catch (error) {
      console.error('Error during login:', error);
    }
  }
  return (
    <div>
      <h2>Login</h2>
      <form id='login-form'>
        <label>
          Username:
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Password:
          <input  
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button 
          className="btn btn-blue"
          type='button' 
          onClick={handleLogin}
        >
          Login
        </button>
      </form>
    </div>
  )
}

export default Login