// src/pages/LoginPage.tsx
import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
    navigate('/')
  }

  return (
    <>
    <div className="bg-red-500 text-white p-4 mb-4">
        🔥 Se isto ficar VERMELHO, o Tailwind está funcionando!
    </div>

    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-20">
      <h1 className="text-2xl mb-4">Login</h1>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border mb-2" />
      <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border mb-4" />
      <button type="submit" className="w-full p-2 bg-blue-600 text-white">Entrar</button>
    </form>
    </>
  )
}

export default LoginPage