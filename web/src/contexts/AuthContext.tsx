// src/contexts/AuthContext.tsx 
import React, { createContext, useState, useEffect } from 'react'
import api from '../api/client'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'requester'
  sectorId: number
  sector?: {
    ID: number
    Name: string
  }
}

// ✅ INTERFACES PARA TIPAGEM DA RESPOSTA DA API
interface LoginResponse {
  token: string
  user?: {
    id: number
    name: string
    email: string
    role: string
    sectorId: number
    sector: {
      ID: number
      Name: string
    }
  }
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  updateUser: (userData: Partial<User>) => void
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType)

const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error)
    return null
  }
}

const createUserFromJWT = (decodedToken: any, email?: string): User => {
  return {
    id: decodedToken.sub || decodedToken.userID || decodedToken.id || '1',
    name: decodedToken.name || decodedToken.username || 'Usuário',
    email: decodedToken.email || email || 'user@example.com',
    role: decodedToken.role === 'admin' ? 'admin' : 'requester',
    sectorId: decodedToken.sectorId || decodedToken.sector_id || 1,
    sector: {
      ID: decodedToken.sectorId || decodedToken.sector_id || 1,
      Name: decodedToken.sectorName || decodedToken.sector_name || 'Default'
    }
  }
}

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isAuthenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('accessToken')
        
        if (token) {
          const decodedToken = decodeJWT(token)
          
          if (decodedToken && decodedToken.exp && decodedToken.exp > Date.now() / 1000) {
            const userData = createUserFromJWT(decodedToken)
            setUser(userData)
            setAuthenticated(true)
          } else {
            localStorage.removeItem('accessToken')
            setAuthenticated(false)
            setUser(null)
          }
        } else {
          setAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error)
        localStorage.removeItem('accessToken')
        setAuthenticated(false)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // ✅ TIPAR A RESPOSTA DA API
      const resp = await api.post<LoginResponse>('/auth/login', { email, password })
      const token = resp.data.token
      
      if (!token) {
        throw new Error('Token não retornado pela API')
      }
      
      localStorage.setItem('accessToken', token)
      
      // ✅ USAR DADOS DO USUÁRIO RETORNADOS PELA API (mais confiável)
      if (resp.data.user) {
        const userData: User = {
          id: resp.data.user.id.toString(),
          name: resp.data.user.name,
          email: resp.data.user.email,
          role: resp.data.user.role as 'admin' | 'requester',
          sectorId: resp.data.user.sectorId,
          sector: {
            ID: resp.data.user.sector.ID,
            Name: resp.data.user.sector.Name,
          },
        }
        setUser(userData)
        setAuthenticated(true)
      } else {
        // Fallback para o token se não vier dados do usuário
        const decodedToken = decodeJWT(token)
        if (decodedToken) {
          const userData = createUserFromJWT(decodedToken, email)
          setUser(userData)
          setAuthenticated(true)
        } else {
          throw new Error('Token inválido')
        }
      }
    } catch (error) {
      console.error('Erro no login:', error)
      localStorage.removeItem('accessToken')
      setAuthenticated(false)
      setUser(null)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    setAuthenticated(false)
    setUser(null)
  }

  // Nova função para atualizar dados do usuário
  const updateUser = (userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null
      
      const updatedUser = { ...prevUser, ...userData }
      
      // Opcional: Persistir no localStorage para manter dados atualizados
      try {
        const existingUserData = localStorage.getItem('userData')
        if (existingUserData) {
          const parsedData = JSON.parse(existingUserData)
          localStorage.setItem('userData', JSON.stringify({ ...parsedData, ...userData }))
        } else {
          localStorage.setItem('userData', JSON.stringify(updatedUser))
        }
      } catch (error) {
        console.warn('Erro ao salvar dados do usuário no localStorage:', error)
      }
      
      return updatedUser
    })
  }

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout()
        }
        return Promise.reject(error)
      }
    )

    return () => {
      api.interceptors.response.eject(interceptor)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout, 
      loading,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}