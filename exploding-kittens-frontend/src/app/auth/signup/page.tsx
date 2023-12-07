'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayerContext } from '@/context/players'

const Signup = () => {
  const router = useRouter()
  const { setCurrentPlayer } = usePlayerContext() || {}
  const [username, setUsername] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('')

  const passMatch = () => {
    if (password === passwordConfirmation) return true
    return false
  }

  const handleSignup = async () => {
    try {
      await fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password
        }),
      })
      .then(res => res.json())
      .then((data: User) => {
        if (setCurrentPlayer && data.username) {
          setCurrentPlayer(data)
          router.push('/')
        }
      })
    } catch (error) {
      console.error('Error during signup:', error)
    }
  }

  return (
    <div>
      <h2>Sign Up</h2>
      <form id='signup-form'>
        <label>
          Username:
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <br />
        <label>
          Email:
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <br />
        <label>
          Password:
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <br />
        <label>
          Confirm Password:
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
          { passMatch() ? <p></p> : <p className='text-red-600'>Passwords don't match</p>}
        </label>
        <br />
        <button 
          disabled={!passMatch()}
          className="btn btn-blue"
          type="button" 
          onClick={handleSignup}
        >
          Sign Up
        </button>
      </form>
    </div>
  )
}

export default Signup