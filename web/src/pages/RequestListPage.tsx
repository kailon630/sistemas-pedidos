// src/pages/RequestsListPage.tsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Eye, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { getPurchaseRequests, type PurchaseRequest, type RequestItem } from '../api/requests';

const RequestsListPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'partial' | 'rejected'>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await getPurchaseRequests();
      setRequests(response.data);
    } catch (error) {
      console.error('Erro ao carregar requisições:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.id.toString().includes(searchTerm) ||
      request.requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.sector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.observations && request.observations.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-purple-600 bg-purple-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'approved': return <CheckCircle size={14} />;
      case 'partial': return <AlertCircle size={14} />;
      case 'rejected': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'partial': return 'Parcial';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  const getItemsStats = (request: PurchaseRequest) => {
    const total = request.items.length;
    const approved = request.items.filter((item: RequestItem) => item.status === 'approved').length;
    const rejected = request.items.filter((item: RequestItem) => item.status === 'rejected').length;
    const pending = request.items.filter((item: RequestItem) => item.status === 'pending').length;
    
    return { total, approved, rejected, pending };
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
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Todas as Requisições' : 'Minhas Requisições'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? 'Gerencie todas as requisições do sistema' 
              : 'Visualize e gerencie suas requisições de compras'
            }
          </p>
        </div>
        <Link
          to="/requests/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Nova Requisição</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total', 
            count: requests.length, 
            color: 'blue',
            icon: Package
          },
          { 
            label: 'Pendentes', 
            count: requests.filter(r => r.status === 'pending').length, 
            color: 'yellow',
            icon: Clock
          },
          { 
            label: 'Aprovadas', 
            count: requests.filter(r => r.status === 'approved').length, 
            color: 'green',
            icon: CheckCircle
          },
          { 
            label: 'Rejeitadas', 
            count: requests.filter(r => r.status === 'rejected').length, 
            color: 'red',
            icon: XCircle
          }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por ID, solicitante, setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="partial">Parcial</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => {
          const stats = getItemsStats(request);
          return (
            <div key={request.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Requisição #{request.id}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{getStatusText(request.status)}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Solicitante</p>
                          <p className="font-medium text-sm">{request.requester.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Building size={16} className="text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Setor</p>
                          <p className="font-medium text-sm">{request.sector.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Package size={16} className="text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Itens</p>
                          <p className="font-medium text-sm">
                            {stats.total} total
                            {stats.approved > 0 && (
                              <span className="text-green-600"> • {stats.approved} aprovados</span>
                            )}
                            {stats.rejected > 0 && (
                              <span className="text-red-600"> • {stats.rejected} rejeitados</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar size={16} className="text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Criada em</p>
                          <p className="font-medium text-sm">
                            {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {request.observations && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <p className="text-sm text-gray-700 line-clamp-2">{request.observations}</p>
                      </div>
                    )}

                    {request.adminNotes && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                        <p className="text-sm font-medium text-blue-800">Observações do Admin:</p>
                        <p className="text-sm text-blue-700 line-clamp-2">{request.adminNotes}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <Link
                      to={`/requests/${request.id}`}
                      className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center space-x-2 transition-colors"
                    >
                      <Eye size={16} />
                      <span>Ver Detalhes</span>
                    </Link>
                    
                    {user?.role === 'admin' && request.status === 'pending' && (
                      <Link
                        to={`/admin/requests/${request.id}`}
                        className="bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 flex items-center space-x-2 transition-colors"
                      >
                        <CheckCircle size={16} />
                        <span>Revisar</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma requisição encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.' 
              : 'Comece criando uma nova requisição.'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <div className="mt-6">
              <Link
                to="/requests/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Nova Requisição
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestsListPage;