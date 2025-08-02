// src/pages/LoginPage.tsx - Versão Minimalista
import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import settingsApi from '../api/settings'
import type { CompanySettings } from '../types/settings'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  // Carregar configurações da empresa para logo
  useEffect(() => {
    const loadCompanySettings = async () => {
      try {
        const response = await settingsApi.getCompanySettings()
        setCompanySettings(response.data)
      } catch (err) {
        // Falha silenciosa - logo não é crítico para login
        console.warn('Não foi possível carregar configurações da empresa')
      }
    }
    loadCompanySettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciais inválidas')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo da empresa */}
        <div className="flex justify-center mb-6">
          {companySettings?.LogoPath ? (
            <img
              src={`${settingsApi.getCompanyLogoUrl()}?t=${Date.now()}`}
              alt={companySettings.CompanyName}
              className="h-12 w-auto max-w-48 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                {companySettings?.CompanyName || 'PedidoCompras'}
              </h1>
            </div>
          )}
        </div>

        {/* Título */}
        <h2 className="text-center text-2xl font-medium text-gray-900">
          Acesse sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Entre com suas credenciais para continuar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border">
          {/* Mensagem de erro */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2"
                  style={{
                    '--tw-ring-color': '#679080'
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#679080'
                    e.target.style.boxShadow = '0 0 0 3px rgba(103, 144, 128, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.boxShadow = 'none'
                  }}
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#679080'
                    e.target.style.boxShadow = '0 0 0 3px rgba(103, 144, 128, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.boxShadow = 'none'
                  }}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Botão de login */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#679080',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && email && password) {
                    e.currentTarget.style.backgroundColor = '#5a7a6b'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && email && password) {
                    e.currentTarget.style.backgroundColor = '#679080'
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(103, 144, 128, 0.3)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
          </form>

          {/* Rodapé com informações do sistema */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Sistema de Gerenciamento de Pedidos
              </p>
              {companySettings?.CompanyName && (
                <p className="text-xs text-gray-400 mt-1">
                  {companySettings.CompanyName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage