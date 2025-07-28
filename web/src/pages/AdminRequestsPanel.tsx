// src/pages/AdminRequestsPanel.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle, // ✅ ÍCONE CORRETO PARA URGENTES
  AlertCircle,
  Calendar,
  User,
  Building,
  Package,
  Filter,
  Download,
  MessageSquare,
  RotateCcw
} from 'lucide-react';
import type { PurchaseRequest, RequestItem, ReviewRequestData, ReviewItemData } from '../types/admin';
import {
  getPurchaseRequests,
  reviewRequest,
  reviewRequestItem,
  completeRequest,
  reopenRequest,
} from '../api/admin';
import PriorityButton from '../components/PriorityButton';
import { AuthContext } from '../contexts/AuthContext';
import ReviewItemModal from '../components/ReviewItemModal';

const AdminRequestsPanel: React.FC = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'partial' | 'rejected'>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<RequestItem | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando requisições...');

      const response = await getPurchaseRequests();
      console.log('📦 Resposta bruta da API:', response.data);

      if (Array.isArray(response.data)) {
        const validRequests = response.data.filter(req => {
          if (!req) {
            console.warn('❌ Requisição nula encontrada');
            return false;
          }
          if (!req.requester) {
            console.warn('❌ Requisição sem requester:', req);
            return false;
          }
          if (!req.sector) {
            console.warn('❌ Requisição sem sector:', req);
            return false;
          }
          return true;
        });

        console.log('✅ Requisições válidas:', validRequests.length);
        setRequests(validRequests);
      } else {
        console.error('❌ Resposta não é um array:', response.data);
        setRequests([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar requisições:', error);
      setRequests([]);
      alert('Erro ao carregar requisições. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async (requestId: number, data: ReviewRequestData) => {
    try {
      console.log('🔍 Revisando requisição:', { requestId, data });
      const response = await reviewRequest(requestId, data);
      setRequests(prev =>
        prev.map(req => (req.ID === requestId ? response.data : req))
      );
      if (selectedRequest?.ID === requestId) {
        setSelectedRequest(response.data);
      }
      console.log('✅ Requisição revisada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao revisar requisição:', error);
      alert('Erro ao revisar requisição. Tente novamente.');
    }
  };

  const handleReviewItem = async (requestId: number, itemId: number, data: ReviewItemData) => {
    try {
      console.log('🔍 Revisando item:', { requestId, itemId, data });
      await reviewRequestItem(requestId, itemId, data);
      await loadRequests();
      if (selectedRequest) {
        const updated = requests.find(r => r.ID === requestId);
        if (updated) setSelectedRequest(updated);
      }
      setShowReviewModal(false);
      setReviewingItem(null);
      console.log('✅ Item revisado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao revisar item:', error);
      alert('Erro ao revisar item. Tente novamente.');
    }
  };

  const handleCompleteRequest = async (requestId: number) => {
    try {
      const notes = window.prompt('Observações da conclusão (opcional)') || undefined;
      console.log('🔍 Concluindo requisição:', { requestId, notes });
      const response = await completeRequest(requestId, notes);
      setRequests(prev =>
        prev.map(req => (req.ID === requestId ? response.data : req))
      );
      if (selectedRequest?.ID === requestId) {
        setSelectedRequest(response.data);
      }
      console.log('✅ Requisição concluída com sucesso');
    } catch (error) {
      console.error('❌ Erro ao concluir requisição:', error);
      alert('Erro ao concluir requisição. Tente novamente.');
    }
  };

  const handleReopenRequest = async (requestId: number) => {
    try {
      console.log('🔍 Reabrindo requisição:', requestId);
      const response = await reopenRequest(requestId);
      setRequests(prev =>
        prev.map(req => (req.ID === requestId ? response.data : req))
      );
      if (selectedRequest?.ID === requestId) {
        setSelectedRequest(response.data);
      }
      console.log('✅ Requisição reaberta com sucesso');
    } catch (error) {
      console.error('❌ Erro ao reabrir requisição:', error);
      alert('Erro ao reabrir requisição. Tente novamente.');
    }
  };

  const handleRequestUpdate = (updatedRequest: PurchaseRequest) => {
    setRequests(prev =>
      prev.map(req => (req.ID === updatedRequest.ID ? updatedRequest : req))
    );
    if (selectedRequest?.ID === updatedRequest.ID) {
      setSelectedRequest(updatedRequest);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-purple-600 bg-purple-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'suspended': return 'text-orange-600 bg-orange-100'; // ✅ NOVO
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock size={16} />;
      case 'approved': return <CheckCircle size={16} />;
      case 'partial': return <AlertCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'suspended': return <AlertTriangle size={16} />; // ✅ NOVO
      default: return <Clock size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'partial': return 'Parcial';
      case 'rejected': return 'Rejeitado';
      case 'completed': return 'Concluído';
      case 'suspended': return 'Suspenso'; // ✅ NOVO
      default: return status;
    }
  };

  const filteredRequests = requests.filter(
    req => req && (filter === 'all' || req.status === filter)
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie e aprove requisições de compras</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download size={16} className="mr-2" />
          Exportar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { label: 'Total', count: requests.length, color: 'blue', icon: Package },
          { label: 'Pendentes', count: requests.filter(r => r.status === 'pending').length, color: 'yellow', icon: Clock },
          { label: 'Aprovados', count: requests.filter(r => r.status === 'approved').length, color: 'green', icon: CheckCircle },
          { label: 'Parciais', count: requests.filter(r => r.status === 'partial').length, color: 'purple', icon: AlertCircle },
          { label: 'Rejeitados', count: requests.filter(r => r.status === 'rejected').length, color: 'red', icon: XCircle },
          { label: 'Urgentes', count: requests.filter(r => r.priority === 'urgent').length, color: 'red', icon: AlertTriangle },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <Filter size={20} className="text-gray-500" />
          <div className="flex space-x-2">
            {(['all', 'pending', 'approved', 'partial', 'rejected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Todos' : getStatusText(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Requisições */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Requisições ({filteredRequests.length})
            </h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {filteredRequests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Nenhuma requisição encontrada</p>
              </div>
            ) : (
              filteredRequests.map(request => (
                <div
                  key={request.ID}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedRequest?.ID === request.ID ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  } ${
                    request.priority === 'urgent'
                      ? 'border-l-4 border-red-500 bg-red-50'
                      : ''
                  }`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900">#{request.ID}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{getStatusText(request.status)}</span>
                        </span>
                        <PriorityButton
                          request={request}
                          onUpdate={handleRequestUpdate}
                          isAdmin={isAdmin}
                          size="small"
                          showDropdown={false}
                        />
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User size={14} className="mr-2" />
                          {request.requester?.name || 'Usuário não identificado'}
                        </div>
                        <div className="flex items-center">
                          <Building size={14} className="mr-2" />
                          {request.sector?.name || 'Setor não identificado'}
                        </div>
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2" />
                          {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{request.items?.length || 0} itens</p>
                      <button className="mt-1 text-blue-600 hover:text-blue-700 text-sm flex items-center justify-center">
                        <Eye size={14} className="inline mr-1" />
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detalhes da Requisição */}
        <div className="bg-white rounded-lg shadow-sm border">
          {selectedRequest ? (
            <div>
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Requisição #{selectedRequest.ID}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Criada em {new Date(selectedRequest.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {getStatusIcon(selectedRequest.status)}
                      <span className="ml-2">{getStatusText(selectedRequest.status)}</span>
                    </span>
                    <PriorityButton
                      request={selectedRequest}
                      onUpdate={handleRequestUpdate}
                      isAdmin={isAdmin}
                      showDropdown={true}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Solicitante */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Informações do Solicitante</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nome:</span>
                      <span className="text-sm font-medium">{selectedRequest.requester?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{selectedRequest.requester?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Setor:</span>
                      <span className="text-sm font-medium">{selectedRequest.sector?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {selectedRequest.observations && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Observações</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedRequest.observations}
                    </p>
                  </div>
                )}

                {/* Itens */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Itens ({selectedRequest.items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {(selectedRequest.items || []).map(item => (
                      <div key={item.ID} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.product?.name || 'Produto não identificado'}</h4>
                            <p className="text-sm text-gray-600">{item.product?.description || 'Sem descrição'}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span>Qtd: {item.quantity} {item.product?.unit || 'un'}</span>
                              {item.deadline && (
                                <span>Prazo: {new Date(item.deadline).toLocaleDateString('pt-BR')}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              <span className="ml-1">{getStatusText(item.status)}</span>
                            </span>
                            {item.status === 'pending' && (
                              <button
                                onClick={() => {
                                  setReviewingItem(item);
                                  setShowReviewModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                Revisar
                              </button>
                            )}
                          </div>
                        </div>
                        {item.adminNotes && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-3">
                            <div className="flex items-start">
                              <MessageSquare size={16} className="text-blue-400 mr-2 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-blue-800">Observações do Admin:</p>
                                <p className="text-sm text-blue-700">{item.adminNotes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {item.suspensionReason && (
                          <div className="bg-orange-50 border-l-4 border-orange-400 p-3 mt-3">
                            <div className="flex items-start">
                              <AlertTriangle size={16} className="text-orange-400 mr-2 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-orange-800">Motivo da Suspensão:</p>
                                <p className="text-sm text-orange-700">{item.suspensionReason}</p>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                </div>

                {/* Ações Administrativas */}
                {selectedRequest.status === 'pending' && (
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Ações Administrativas</h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleReviewRequest(selectedRequest.ID, { status: 'approved' })}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Aprovar Tudo
                      </button>
                      <button
                        onClick={() => handleReviewRequest(selectedRequest.ID, { status: 'rejected' })}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center"
                      >
                        <XCircle size={16} className="mr-2" />
                        Rejeitar Tudo
                      </button>
                    </div>
                  </div>
                )}

                {(selectedRequest.status === 'approved' || selectedRequest.status === 'partial') && (
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Concluir Requisição</h3>
                    <button
                      onClick={() => handleCompleteRequest(selectedRequest.ID)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Concluir
                    </button>
                  </div>
                )}

                {selectedRequest.status === 'completed' && (
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Requisição Concluída</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">
                          Requisição concluída em {selectedRequest.completedAt ? new Date(selectedRequest.completedAt).toLocaleDateString('pt-BR') : 'N/A'}
                        </span>
                      </div>
                      {selectedRequest.completionNotes && (
                        <p className="text-sm text-green-700 mt-2">
                          <strong>Observações:</strong> {selectedRequest.completionNotes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleReopenRequest(selectedRequest.ID)}
                      className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center justify-center"
                    >
                      <RotateCcw size={16} className="mr-2" />
                      Reabrir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Selecione uma requisição para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Revisão de Item */}
      {showReviewModal && reviewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Revisar Item</h3>
            <div className="mb-4">
              <h4 className="font-medium">{reviewingItem.product?.name || 'Produto não identificado'}</h4>
              <p className="text-sm text-gray-600">
                Quantidade: {reviewingItem.quantity} {reviewingItem.product?.unit || 'un'}
              </p>
            </div>
            <form onSubmit={e => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const status = fd.get('status') as 'approved' | 'rejected';
                const adminNotes = fd.get('adminNotes') as string;
                handleReviewItem(selectedRequest!.ID, reviewingItem.ID, {
                  status,
                  adminNotes: adminNotes || undefined
                });
              }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Decisão</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="radio" name="status" value="approved" className="mr-2" />
                      <CheckCircle size={16} className="text-green-600 mr-2" />
                      Aprovar
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="status" value="rejected" className="mr-2" />
                      <XCircle size={16} className="text-red-600 mr-2" />
                      Rejeitar
                    </label>
                    <ReviewItemModal
                      isOpen={showReviewModal}
                      onClose={() => {
                        setShowReviewModal(false);
                        setReviewingItem(null);
                      }}
                      onSubmit={(data) => {
                        console.log('📝 Dados do modal:', data);
                        handleReviewItem(selectedRequest!.ID, reviewingItem.ID, data);
                      }}
                      item={reviewingItem}
                      loading={loading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    name="adminNotes"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Adicione observações sobre esta decisão..."
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewingItem(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequestsPanel;
