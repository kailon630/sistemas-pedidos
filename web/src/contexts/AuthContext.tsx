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
        // ✅ VERIFICAR MÚLTIPLAS FONTES DE TOKEN
        const token = localStorage.getItem('accessToken') 
          || localStorage.getItem('token') 
          || localStorage.getItem('authToken')
        
        console.log('🔍 Auth: Inicializando...', {
          accessToken: !!localStorage.getItem('accessToken'),
          token: !!localStorage.getItem('token'),
          authToken: !!localStorage.getItem('authToken'),
          found: !!token
        })
        
        if (token) {
          const decodedToken = decodeJWT(token)
          
          if (decodedToken && decodedToken.exp && decodedToken.exp > Date.now() / 1000) {
            console.log('✅ Auth: Token válido encontrado')
            const userData = createUserFromJWT(decodedToken)
            setUser(userData)
            setAuthenticated(true)
          } else {
            console.log('❌ Auth: Token expirado')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('token')
            localStorage.removeItem('authToken')
            setAuthenticated(false)
            setUser(null)
          }
        } else {
          console.log('❌ Auth: Nenhum token encontrado')
          setAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error('❌ Auth: Erro ao inicializar:', error)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('token')
        localStorage.removeItem('authToken')
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
      console.log('🔐 Auth: Iniciando login para:', email);

      
      const resp = await api.post<LoginResponse>('/auth/login', { email, password })
      const token = resp.data.token
      
      if (!token) {
        throw new Error('Token não retornado pela API')
      }
      
      console.log('✅ Auth: Token recebido, salvando no localStorage...')
      
      // ✅ SALVAR TOKEN EM MÚLTIPLOS LOCAIS PARA GARANTIR
      localStorage.setItem('accessToken', token)
      localStorage.setItem('token', token) // fallback
      localStorage.setItem('authToken', token) // fallback extra
      
      console.log('✅ Auth: Token salvo:', {
        accessToken: !!localStorage.getItem('accessToken'),
        token: !!localStorage.getItem('token'),
        authToken: !!localStorage.getItem('authToken')
      })
      
      // ✅ USAR DADOS DO USUÁRIO RETORNADOS PELA API
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
        console.log('✅ Auth: Login realizado com sucesso para:', userData.name)
      } else {
        // Fallback para o token se não vier dados do usuário
        const decodedToken = decodeJWT(token)
        if (decodedToken) {
          const userData = createUserFromJWT(decodedToken, email)
          setUser(userData)
          setAuthenticated(true)
          console.log('✅ Auth: Login realizado via token decode para:', userData.name)
        } else {
          throw new Error('Token inválido')
        }
      }
    } catch (error) {
      console.error('❌ Auth: Erro no login:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('token')
      localStorage.removeItem('authToken')
      setAuthenticated(false)
      setUser(null)
      throw error
    }
  }

  const logout = () => {
    console.log('🚪 Auth: Fazendo logout...')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('token')
    localStorage.removeItem('authToken')
    setAuthenticated(false)
    setUser(null)
  }

  const updateUser = (userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null
      const updatedUser = { ...prevUser, ...userData }
      return updatedUser
    })
  }

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('⚠️ Auth: Recebido 401, fazendo logout...')
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