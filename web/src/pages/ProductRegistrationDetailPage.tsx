import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Check, Package, User, Calendar, FileText } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { productRegistrationApi } from '../api/productRegistration';
import ProductRegistrationStatus from '../components/ProductRegistrationStatus';
import type { ProductRegistrationRequest, ProcessProductRegistrationData } from '../types/productRegistration';

const ProductRegistrationDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [request, setRequest] = useState<ProductRegistrationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processData, setProcessData] = useState<ProcessProductRegistrationData>({
    status: 'approved',
    adminNotes: '',
  });

  const isAdmin = user?.role === 'admin';
  const canEdit = request?.Status === 'pending' && 
    (isAdmin || request?.RequesterID === Number(user?.id));

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await productRegistrationApi.getById(Number(id));
      setRequest(response.data);
    } catch (err) {
      setError('Erro ao carregar solicitação');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!request || !confirm('Tem certeza que deseja excluir esta solicitação?')) return;

    try {
      await productRegistrationApi.delete(request.ID);
      navigate('/product-requests');
    } catch (err) {
      setError('Erro ao excluir solicitação');
      console.error('Erro:', err);
    }
  };

  const handleProcess = async () => {
    if (!request) return;

    try {
      setProcessing(true);
      const response = await productRegistrationApi.process(request.ID, processData);
      setRequest(response.data);
      setShowProcessModal(false);
      setProcessData({ status: 'approved', adminNotes: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao processar solicitação');
      console.error('Erro:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Solicitação não encontrada
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          A solicitação pode ter sido removida ou você não tem acesso a ela.
        </p>
        <div className="mt-6">
          <Link
            to="/product-requests"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar à Lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/product-requests')}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Solicitação #{request.ID}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {request.ProductName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <ProductRegistrationStatus status={request.Status} size="lg" />
          
          {canEdit && (
            <div className="flex space-x-2 ml-4">
              <Link
                to={`/product-requests/${request.ID}/edit`}
                className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit size={16} className="mr-2" />
                Editar
              </Link>
              
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-2 text-sm border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-2" />
                Excluir
              </button>
            </div>
          )}

          {isAdmin && request.Status === 'pending' && (
            <button
              onClick={() => setShowProcessModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Check size={16} className="mr-2" />
              Processar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Produto */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm rounded-lg border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Informações do Produto
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome do Produto
                </label>
                <p className="mt-1 text-sm text-gray-900">{request.ProductName}</p>
              </div>

              {request.ProductDescription && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descrição
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{request.ProductDescription}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Unidade de Medida
                </label>
                <p className="mt-1 text-sm text-gray-900">{request.ProductUnit}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Justificativa
                </label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {request.Justification}
                </p>
              </div>
            </div>
          </div>

          {/* Observações do Admin */}
          {request.AdminNotes && (
            <div className="bg-white shadow-sm rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Observações da Administração
                </h3>
              </div>
              
              <div className="px-6 py-4">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {request.AdminNotes}
                </p>
              </div>
            </div>
          )}

          {/* Produto Criado */}
          {request.CreatedProduct && (
            <div className="bg-green-50 border border-green-200 rounded-lg">
              <div className="px-6 py-4 border-b border-green-200">
                <h3 className="text-lg font-medium text-green-900">
                  Produto Criado
                </h3>
              </div>
              
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900">
                      {request.CreatedProduct.Name}
                    </p>
                    <p className="text-sm text-green-700">
                      {request.CreatedProduct.Unit} • Status: {request.CreatedProduct.Status}
                    </p>
                  </div>
                  
                  <Link
                    to={`/products/${request.CreatedProduct.ID}`}
                    className="inline-flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Package size={16} className="mr-2" />
                    Ver Produto
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Informações Gerais */}
        <div className="space-y-6">
          {/* Solicitante */}
          <div className="bg-white shadow-sm rounded-lg border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Solicitante
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center space-x-3">
                <User size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {request.Requester.Name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {request.Requester.Email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FileText size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Setor
                  </p>
                  <p className="text-sm text-gray-500">
                    {request.Sector.Name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="bg-white shadow-sm rounded-lg border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Histórico
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Criado em
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(request.CreatedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {request.ProcessedAt && (
                <div className="flex items-center space-x-3">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Processado em
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(request.ProcessedAt).toLocaleString('pt-BR')}
                    </p>
                    {request.Processor && (
                      <p className="text-sm text-gray-500">
                        por {request.Processor.Name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Processamento */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Processar Solicitação
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Decisão
                </label>
                <select
                  value={processData.status}
                  onChange={(e) => setProcessData(prev => ({ 
                    ...prev, 
                    status: e.target.value as 'approved' | 'rejected' 
                  }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="approved">Aprovar</option>
                  <option value="rejected">Rejeitar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Observações
                </label>
                <textarea
                  rows={3}
                  value={processData.adminNotes}
                  onChange={(e) => setProcessData(prev => ({ 
                    ...prev, 
                    adminNotes: e.target.value 
                  }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Adicione comentários sobre a decisão..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowProcessModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleProcess}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductRegistrationDetailPage;