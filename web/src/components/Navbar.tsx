// Navbar.tsx
import React, { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { Menu, X, User, LogOut, Shield } from 'lucide-react'
import NotificationDropdown from './NotificationDropdown';
import SearchBox from './SearchBox'; // ✅ NOVO COMPONENTE
import type { CompanySettings } from '../types/settings';
import settingsApi from '../api/settings'

interface NavbarProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  
  // ✅ Estados para controle do logo
  const [logoError, setLogoError] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      // ✅ Carregar sempre, não só para admins (qualquer usuário pode ver o logo)
      try {
        setLogoLoading(true);
        const response = await settingsApi.getCompanySettings()
        setCompanySettings(response.data)
        setLogoError(false);
      } catch (err) {
        console.error('Erro ao carregar configurações da empresa:', err)
        setLogoError(true);
      } finally {
        setLogoLoading(false);
      }
    }
    
    // ✅ Carregar configurações para qualquer usuário logado
    if (user) {
      loadSettings();
    }
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // ✅ Função para lidar com erro de carregamento do logo
  const handleLogoError = () => {
    console.warn('Erro ao carregar logo no navbar');
    setLogoError(true);
  };

  // ✅ Gerar URL do logo com timestamp para quebrar cache
  const getLogoUrl = () => {
    if (!companySettings?.LogoPath) return null;
    return `${settingsApi.getCompanyLogoUrl()}?t=${Date.now()}`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left side - Brand + Sidebar toggle */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2"
            style={{
              '--tw-ring-color': '#679080'
            } as React.CSSProperties}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(103, 144, 128, 0.3)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <Link to="/" className="flex items-center space-x-3">
            {/* ✅ Logo melhorado com estados de loading e erro */}
            {companySettings?.LogoPath && !logoError && !logoLoading && (
              <img 
                src={getLogoUrl()!}
                alt={companySettings.CompanyName}
                className="h-8 w-auto transition-opacity duration-200"
                onError={handleLogoError}
                style={{ 
                  maxWidth: '120px', // Limitar largura máxima
                  objectFit: 'contain' 
                }}
              />
            )}
            
            {/* ✅ Loading state para logo */}
            {logoLoading && (
              <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
            )}
            
            {/* ✅ Fallback para quando não há logo ou erro */}
            <span className={`text-xl font-bold text-gray-900 ${
              companySettings?.LogoPath && !logoError && !logoLoading ? 'ml-2' : ''
            }`}>
              {companySettings?.CompanyName || 'PedidoCompras'}
            </span>
          </Link>
        </div>

        {/* ✅ Center - Search Funcional */}
        <div className="hidden md:flex flex-1 max-w-lg mx-8">
          <SearchBox />
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button 
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 relative"
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(103, 144, 128, 0.3)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <NotificationDropdown />
          </button>

          {/* Admin Panel Quick Access */}
          {user?.role === 'admin' && (
            <Link
              to="/admin/requests"
              className="p-2 rounded-md focus:outline-none focus:ring-2 transition-colors"
              title="Painel Administrativo"
              style={{
                color: '#679080'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(103, 144, 128, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(103, 144, 128, 0.3)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Shield size={20} />
            </Link>
          )}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2"
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(103, 144, 128, 0.3)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: user?.role === 'admin' ? '#dc2626' : '#679080'
                }}
              >
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
                    <span 
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: user?.role === 'admin' ? '#fef2f2' : 'rgba(103, 144, 128, 0.1)',
                        color: user?.role === 'admin' ? '#dc2626' : '#679080'
                      }}
                    >
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