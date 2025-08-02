import React, { useContext } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  FilePlus, 
  Layers, 
  Users, 
  Truck, 
  Settings, 
  FileText, 
  BarChart3,
  Package,
  Shield,
  DollarSign
} from 'lucide-react'
import { AuthContext } from '../contexts/AuthContext'

interface SidebarProps {
  isOpen: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  // ✅ NAVEGAÇÃO RESTRITA - usuários comuns só veem o essencial
  const navigation = isAdmin ? [
    // ✅ NAVEGAÇÃO COMPLETA PARA ADMINS
    { 
      name: 'Principal', 
      items: [
        { to: '/', label: 'Dashboard', icon: Home },
        { to: '/requests/new', label: 'Nova Requisição', icon: FilePlus },
      ]
    },
    { 
      name: 'Gestão', 
      items: [
        { to: '/requests', label: 'Minhas Requisições', icon: FileText },
        { to: '/products', label: 'Produtos', icon: Package },
        { to: '/product-requests', label: 'Solicitações de Produto', icon: Package },
        { to: '/suppliers', label: 'Fornecedores', icon: Truck },
      ]
    },
    {
      name: 'Administração',
      items: [
        { to: '/admin/requests', label: 'Painel Admin', icon: Shield },
        { to: '/budgets', label: 'Cotações', icon: DollarSign },
        { to: '/sectors', label: 'Setores', icon: Layers },
        { to: '/requesters', label: 'Usuários', icon: Users },
      ]
    },
    { 
      name: 'Relatórios', 
      items: [
        { to: '/reports', label: 'Relatórios', icon: BarChart3 },
      ]
    },
    { 
      name: 'Sistema', 
      items: [
        { to: '/settings', label: 'Configurações', icon: Settings },
      ]
    },
  ] : [
    // ✅ NAVEGAÇÃO LIMITADA PARA USUÁRIOS COMUNS
    { 
      name: 'Principal', 
      items: [
        { to: '/', label: 'Dashboard', icon: Home },
      ]
    },
    { 
      name: 'Minhas Atividades', 
      items: [
        { to: '/requests', label: 'Minhas Requisições', icon: FileText },
        { to: '/product-requests', label: 'Solicitações de Produto', icon: Package },
      ]
    }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => {}} // Será controlado pelo Layout
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-[calc(100vh-4rem)]
      `}>
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* User Info */}
          <div className="px-3 py-2 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: isAdmin ? '#dc2626' : '#679080' // ✅ Cor diferente para admin
                }}
              >
                {isAdmin ? (
                  <Shield size={16} className="text-white" />
                ) : (
                  <Users size={16} className="text-white" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {isAdmin ? 'Administrador' : 'Solicitante'}
                </p>
                {/* ✅ Mostrar setor para usuários comuns */}
                {!isAdmin && user?.sector && (
                  <p className="text-xs text-gray-400">
                    {user.sector.Name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ✅ AVISO PARA USUÁRIOS COMUNS */}
          {!isAdmin && (
            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <FileText className="text-blue-600 mr-2 mt-0.5" size={14} />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">Acesso Limitado</p>
                  <p className="text-blue-700">
                    Como solicitante, você tem acesso às suas requisições e solicitações de produtos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {navigation.map((section) => (
            <div key={section.name}>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {section.name}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                          isActive
                            ? 'border-r-2'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                      style={({ isActive }) => isActive ? {
                        backgroundColor: 'rgba(103, 144, 128, 0.1)',
                        color: '#679080',
                        borderRightColor: '#679080'
                      } : {}}
                    >
                      <Icon size={18} className="mr-3" />
                      {item.label}
                      {/* ✅ Badge especial para admin */}
                      {item.to === '/admin/requests' && (
                        <Shield 
                          size={14} 
                          className="ml-auto" 
                          style={{ color: '#679080' }}
                        />
                      )}
                      {/* ✅ Badge para usuários (mudei de "Solicitantes" para "Usuários") */}
                      {item.to === '/requesters' && (
                        <Users 
                          size={14} 
                          className="ml-auto" 
                          style={{ color: '#679080' }}
                        />
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}

          {/* ✅ INFORMAÇÕES EXTRAS PARA USUÁRIOS COMUNS */}
          {!isAdmin && (
            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <Package className="text-green-600 mr-2 mt-0.5" size={14} />
                <div className="text-xs text-green-800">
                  <p className="font-medium mb-1">Precisa de algo mais?</p>
                  <p className="text-green-700">
                    Entre em contato com um administrador para acessar outras funcionalidades.
                  </p>
                </div>
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar