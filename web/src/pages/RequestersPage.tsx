// src/pages/RequestersPage.tsx - Versão Completa
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Search, Mail, Building, Calendar, Edit, Trash2, Shield, UserCheck, MoreVertical } from 'lucide-react';
import { getRequesters, deleteRequester, promoteToAdmin, type Requester } from '../api/requesters';
import { AuthContext } from '../contexts/AuthContext'; 

const RequestersPage: React.FC = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState<Requester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'requester'>('all');
  const [sectorFilter, setSectorFilter] = useState<number | 'all'>('all');
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);

  const uniqueSectors = Array.from(
    new Set(users.map(u => u.Sector?.ID).filter(Boolean))
  ).map(id => users.find(u => u.Sector?.ID === id)?.Sector).filter(Boolean);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getRequesters(); // Pega todos os usuários
      setUsers(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
      alert('Erro ao carregar usuários. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: Requester) => {
    if (user.ID.toString() === currentUser?.id) {
      alert('Você não pode excluir seu próprio usuário!');
      return;
    }

    const confirmMessage = user.Role === 'admin' 
      ? `Tem certeza que deseja excluir o administrador "${user.Name}"? Esta ação não pode ser desfeita.`
      : `Tem certeza que deseja excluir o usuário "${user.Name}"? Esta ação não pode ser desfeita.`;

    if (!confirm(confirmMessage)) return;

    try {
      await deleteRequester(user.ID);
      alert('Usuário excluído com sucesso!');
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      const errorMsg = error.response?.data?.error || 'Erro ao excluir usuário';
      alert(`Erro: ${errorMsg}`);
    }
  };

  const handlePromoteUser = async (user: Requester) => {
    if (user.Role === 'admin') {
      alert('Este usuário já é administrador!');
      return;
    }

    const confirmMessage = `Tem certeza que deseja promover "${user.Name}" para Administrador? Ele terá acesso total ao sistema.`;
    
    if (!confirm(confirmMessage)) return;

    try {
      await promoteToAdmin(user.ID);
      alert('Usuário promovido a administrador com sucesso!');
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao promover usuário:', error);
      const errorMsg = error.response?.data?.error || 'Erro ao promover usuário';
      alert(`Erro: ${errorMsg}`);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (user.Name && user.Name.toLowerCase().includes(searchLower)) ||
      (user.Email && user.Email.toLowerCase().includes(searchLower)) ||
      (user.Sector?.Name && user.Sector.Name.toLowerCase().includes(searchLower));
    
    const matchesRole = roleFilter === 'all' || user.Role === roleFilter;
    const matchesSector = sectorFilter === 'all' || user.SectorID === sectorFilter;
    
    return matchesSearch && matchesRole && matchesSector;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.Role === 'admin').length,
    requesters: users.filter(u => u.Role === 'requester').length,
    sectors: uniqueSectors.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários do Sistema</h1>
          <p className="text-gray-600">
            Gerencie todos os usuários (administradores e solicitantes)
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/requesters/new?role=requester"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus size={16} />
            <span>Novo Solicitante</span>
          </Link>
          {currentUser?.role === 'admin' && (
            <Link
              to="/requesters/new?role=admin"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors"
            >
              <Shield size={16} />
              <span>Novo Admin</span>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Solicitantes</p>
              <p className="text-2xl font-bold text-green-600">{stats.requesters}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Setores Ativos</p>
              <p className="text-2xl font-bold text-orange-600">{stats.sectors}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Building className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, email ou setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'requester')}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Papéis</option>
            <option value="admin">Administradores</option>
            <option value="requester">Solicitantes</option>
          </select>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Setores</option>
            {uniqueSectors.map(sector => (
              <option key={sector?.ID} value={sector?.ID}>{sector?.Name}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
              setSectorFilter('all');
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.ID} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  <div className={`p-3 rounded-lg ${user.Role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    {user.Role === 'admin' ? (
                      <Shield className="h-6 w-6 text-purple-600" />
                    ) : (
                      <Users className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {user.Name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ID: {user.ID}
                    </p>
                  </div>
                </div>

                {/* Action Menu */}
                {currentUser?.role === 'admin' && user.ID.toString() !== currentUser.id && (
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === user.ID ? null : user.ID)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {actionMenuOpen === user.ID && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                        <div className="py-1">
                          <Link
                            to={`/requesters/${user.ID}/edit`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setActionMenuOpen(null)}
                          >
                            <Edit size={14} className="mr-2" />
                            Editar
                          </Link>
                          
                          {user.Role === 'requester' && (
                            <button
                              onClick={() => {
                                setActionMenuOpen(null);
                                handlePromoteUser(user);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                            >
                              <Shield size={14} className="mr-2" />
                              Promover a Admin
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              handleDeleteUser(user);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail size={14} className="mr-2 text-gray-400" />
                  <span className="truncate">{user.Email}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Building size={14} className="mr-2 text-gray-400" />
                  <span>{user.Sector?.Name || 'Sem setor'}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={14} className="mr-2 text-gray-400" />
                  <span>Criado em {new Date(user.CreatedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* User Stats (para requesters) */}
              {user.stats && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Estatísticas de Requisições:</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.stats.totalRequests}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-600">{user.stats.pendingRequests}</p>
                      <p className="text-xs text-gray-500">Pendentes</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600">{user.stats.completedRequests}</p>
                      <p className="text-xs text-gray-500">Concluídas</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status and Role */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.Role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-1.5 ${
                    user.Role === 'admin' ? 'bg-purple-400' : 'bg-green-400'
                  }`}></div>
                  {user.Role === 'admin' ? 'Administrador' : 'Solicitante'}
                </span>
                
                {user.ID.toString() === currentUser?.id && (
                  <span className="text-xs text-blue-600 font-medium">
                    Você
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || roleFilter !== 'all' || sectorFilter !== 'all' ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || roleFilter !== 'all' || sectorFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.' 
              : 'Comece criando um novo usuário.'
            }
          </p>
          {!searchTerm && roleFilter === 'all' && sectorFilter === 'all' && (
            <div className="mt-6">
              <Link
                to="/requesters/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Novo Usuário
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuOpen(null)}
        />
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Users className="text-blue-600 mr-3 mt-0.5" size={16} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Sobre os usuários:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li><strong>Solicitantes</strong> podem criar requisições de compra para seu setor</li>
              <li><strong>Administradores</strong> têm acesso total ao sistema e podem gerenciar outros usuários</li>
              <li>Todos os usuários são vinculados a um setor específico</li>
              <li>Você pode promover solicitantes para administradores quando necessário</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestersPage;