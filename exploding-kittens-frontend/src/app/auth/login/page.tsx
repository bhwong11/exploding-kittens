'use client'
import { useState } from 'react'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    console.log('Username:', username)
    console.log('Password:', password)
  }

  return (
    <div>
      <h2>Login</h2>
      <form id='login-form'>
        <label>
          Username:
          <input
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Password:
          <input  
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type='button' onClick={handleLogin}>
          Login
        </button>
      </form>
    </div>
  )
}

export default Login