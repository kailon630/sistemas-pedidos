// src/pages/BudgetsPage.tsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Package, TrendingUp, Award, Filter, User, Building, Eye, BarChart3 } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { getPurchaseRequests, type PurchaseRequest } from '../api/requests';

const BudgetsPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await getPurchaseRequests();
      setRequests(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar requisições:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      request.id.toString().includes(searchTerm) ||
      (request.requester?.name && request.requester.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.sector?.name && request.sector.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  // Calcular estatísticas gerais
  const totalRequests = requests.length;
  const requestsWithItems = requests.filter(r => r.items && r.items.length > 0).length;
  const totalItems = requests.reduce((sum, r) => sum + (r.items?.length || 0), 0);
  const averageItemsPerRequest = totalRequests > 0 ? totalItems / totalRequests : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getBudgetProgress = (request: PurchaseRequest) => {
    if (!request.items || request.items.length === 0) return 0;
    
    // Aqui você implementaria a lógica para verificar quantos itens têm cotações
    // Por enquanto, retornando um valor simulado baseado no status
    switch (request.status) {
      case 'approved': return 100;
      case 'partial': return 60;
      case 'pending': return 20;
      case 'rejected': return 0;
      default: return 0;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Central de Cotações</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? 'Gerencie cotações de todas as requisições do sistema' 
              : 'Visualize cotações das suas requisições'
            }
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Requisições</p>
              <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Com Itens</p>
              <p className="text-2xl font-bold text-green-600">{requestsWithItems}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Itens</p>
              <p className="text-2xl font-bold text-purple-600">{totalItems}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Média por Requisição</p>
              <p className="text-2xl font-bold text-orange-600">{averageItemsPerRequest.toFixed(1)}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Award className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por ID, solicitante ou setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="partial">Parcial</option>
            <option value="rejected">Rejeitado</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <Filter size={16} className="mr-2" />
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredRequests.map((request) => {
          const budgetProgress = getBudgetProgress(request);
          
          return (
            <div key={request.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Requisição #{request.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Criada em {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <User size={16} className="mr-2" />
                    <span>
                      <span className="font-medium">Solicitante:</span> {request.requester?.name || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Building size={16} className="mr-2" />
                    <span>
                      <span className="font-medium">Setor:</span> {request.sector?.name || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Package size={16} className="mr-2" />
                    <span>
                      <span className="font-medium">Itens:</span> {request.items?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Progress Bar para Cotações */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progresso das Cotações</span>
                    <span className="text-sm text-gray-500">{budgetProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        budgetProgress === 100 ? 'bg-green-500' :
                        budgetProgress >= 50 ? 'bg-yellow-500' :
                        budgetProgress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${budgetProgress}%` }}
                    />
                  </div>
                </div>

                {/* Observações */}
                {request.observations && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Observações:</span> {request.observations}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                  <Link
                    to={`/requests/${request.id}`}
                    className="flex-1 bg-gray-50 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 flex items-center justify-center text-sm font-medium transition-colors"
                  >
                    <Eye size={16} className="mr-2" />
                    Ver Requisição
                  </Link>
                  
                  <Link
                    to={`/requests/${request.id}/budgets`}
                    className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 flex items-center justify-center text-sm font-medium transition-colors"
                  >
                    <DollarSign size={16} className="mr-2" />
                    Gerenciar Cotações
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 && !loading && (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || statusFilter !== 'all' 
              ? 'Nenhuma requisição encontrada' 
              : 'Nenhuma requisição para cotação'
            }
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.' 
              : 'Aguarde novas requisições serem criadas.'
            }
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <DollarSign className="text-blue-600 mr-3 mt-0.5" size={16} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Como funciona o sistema de cotações:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Cada item de uma requisição pode ter múltiplas cotações de diferentes fornecedores</li>
              <li>Compare preços automaticamente para identificar as melhores ofertas</li>
              <li>Calcule economia potencial comparando a diferença entre preços</li>
              <li>Acompanhe o progresso das cotações em tempo real</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetsPage;