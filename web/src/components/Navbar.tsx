// src/components/Navbar.tsx
import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { Menu, X, Bell, Search, User, LogOut, Shield } from 'lucide-react'

interface NavbarProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left side - Brand + Sidebar toggle */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <Link to="/" className="text-xl font-bold text-gray-900">
            PedidoCompras
          </Link>
        </div>

        {/* Center - Search (opcional) */}
        <div className="hidden md:flex flex-1 max-w-lg mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>

          {/* Admin Panel Quick Access */}
          {user?.role === 'admin' && (
            <Link
              to="/admin/requests"
              className="p-2 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-600"
              title="Painel Administrativo"
            >
              <Shield size={20} />
            </Link>
          )}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                user?.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                {user?.role === 'admin' ? (
                  <Shield size={16} className="text-white" />
                ) : (
                  <User size={16} className="text-white" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <span className="text-sm font-medium block">{user?.name || 'Usuário'}</span>
                <span className="text-xs text-gray-500 capitalize">
                  {user?.role === 'admin' ? 'Administrador' : 'Solicitante'}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border">
                <div className="px-4 py-3 border-b">
                  <p className="font-medium text-gray-900">{user?.name || 'Usuário'}</p>
                  <p className="text-sm text-gray-500">{user?.email || 'email@exemplo.com'}</p>
                  <div className="flex items-center mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user?.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user?.role === 'admin' ? (
                        <>
                          <Shield size={12} className="mr-1" />
                          Administrador
                        </>
                      ) : (
                        <>
                          <User size={12} className="mr-1" />
                          Solicitante
                        </>
                      )}
                    </span>
                  </div>
                  {user?.sector && (
                    <p className="text-xs text-gray-500 mt-1">
                      Setor: {user.sector.Name}
                    </p>
                  )}
                </div>
                
                {user?.role === 'admin' && (
                  <Link
                    to="/admin/requests"
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Shield size={16} className="mr-2" />
                    Painel Administrativo
                  </Link>
                )}
                
                <Link
                  to="/settings"
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User size={16} className="mr-2" />
                  Meu Perfil
                </Link>
                
                <div className="border-t">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar