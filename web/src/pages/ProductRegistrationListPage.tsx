import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Package } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { productRegistrationApi } from '../api/productRegistration';
import ProductRegistrationStatus from '../components/ProductRegistrationStatus';
import type { ProductRegistrationRequest } from '../types/productRegistration';

const ProductRegistrationListPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState<ProductRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await productRegistrationApi.list(statusFilter || undefined);
      setRequests(response.data);
    } catch (err) {
      setError('Erro ao carregar solicitações');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?')) return;

    try {
      await productRegistrationApi.delete(id);
      setRequests(requests.filter(req => req.ID !== id));
    } catch (err) {
      setError('Erro ao excluir solicitação');
      console.error('Erro:', err);
    }
  };

  const filteredRequests = requests.filter(request =>
    request.ProductName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.Requester.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.Sector.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Solicitações de Cadastro de Produtos
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isAdmin 
              ? 'Gerencie todas as solicitações de cadastro de produtos'
              : 'Suas solicitações de cadastro de produtos'
            }
          </p>
        </div>
        
        {!isAdmin && (
          <Link
            to="/product-requests/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus size={20} className="mr-2" />
            Nova Solicitação
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por produto, solicitante ou setor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Solicitações */}
      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma solicitação encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {!isAdmin ? 'Comece criando uma nova solicitação de produto.' : 'Não há solicitações no momento.'}
            </p>
            {!isAdmin && (
              <div className="mt-6">
                <Link
                  to="/product-requests/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus size={20} className="mr-2" />
                  Nova Solicitação
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solicitante
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.ProductName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.ProductUnit} • {request.Sector.Name}
                        </div>
                      </div>
                    </td>
                    
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {request.Requester.Name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.Requester.Email}
                        </div>
                      </td>
                    )}
                    
                    <td className="px-6 py-4">
                      <ProductRegistrationStatus status={request.Status} />
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(request.CreatedAt).toLocaleDateString('pt-BR')}
                    </td>
                    
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/product-requests/${request.ID}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </Link>
                        
                        {request.Status === 'pending' && (!isAdmin || request.RequesterID === Number(user?.id)) && (
                          <>
                            <Link
                              to={`/product-requests/${request.ID}/edit`}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </Link>
                            
                            <button
                              onClick={() => handleDelete(request.ID)}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductRegistrationListPage;