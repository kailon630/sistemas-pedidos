// src/pages/AdminRequestsPanel.tsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
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

const AdminRequestsPanel: React.FC = () => {
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
      const response = await getPurchaseRequests();
      setRequests(response.data);
    } catch (error) {
      console.error('Erro ao carregar requisições:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async (requestId: number, data: ReviewRequestData) => {
    try {
      const response = await reviewRequest(requestId, data);
      setRequests(prev => prev.map(req => 
        req.ID === requestId ? response.data : req
      ));
      if (selectedRequest?.ID === requestId) {
        setSelectedRequest(response.data);
      }
    } catch (error) {
      console.error('Erro ao revisar requisição:', error);
    }
  };

  const handleReviewItem = async (requestId: number, itemId: number, data: ReviewItemData) => {
    try {
      await reviewRequestItem(requestId, itemId, data);
      await loadRequests(); // Recarrega para atualizar status automático
      if (selectedRequest) {
        // Atualiza a requisição selecionada
        const updatedRequest = requests.find(r => r.ID === requestId);
        if (updatedRequest) setSelectedRequest(updatedRequest);
      }
      setShowReviewModal(false);
      setReviewingItem(null);
    } catch (error) {
      console.error('Erro ao revisar item:', error);
    }
  };

  const handleCompleteRequest = async (requestId: number) => {
    const notes = window.prompt('Observações da conclusão (opcional)') || undefined;
    try {
      const response = await completeRequest(requestId, notes);
      setRequests(prev => prev.map(req =>
        req.ID === requestId ? response.data : req
      ));
      if (selectedRequest?.ID === requestId) {
        setSelectedRequest(response.data);
      }
    } catch (error) {
      console.error('Erro ao concluir requisição:', error);
    }
  };

  const handleReopenRequest = async (requestId: number) => {
    try {
      const response = await reopenRequest(requestId);
      setRequests(prev => prev.map(req =>
        req.ID === requestId ? response.data : req
      ));
      if (selectedRequest?.ID === requestId) {
        setSelectedRequest(response.data);
      }
    } catch (error) {
      console.error('Erro ao reabrir requisição:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-purple-600 bg-purple-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'approved': return <CheckCircle size={16} />;
      case 'partial': return <AlertCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const filteredRequests = requests.filter(req => 
    filter === 'all' || req.status === filter
  );

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'partial': return 'Parcial';
      case 'rejected': return 'Rejeitado';
      case 'completed': return 'Concluído';
      default: return status;
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
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie e aprove requisições de compras</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={16} className="mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total', count: requests.length, color: 'blue' },
          { label: 'Pendentes', count: requests.filter(r => r.status === 'pending').length, color: 'yellow' },
          { label: 'Aprovados', count: requests.filter(r => r.status === 'approved').length, color: 'green' },
          { label: 'Rejeitados', count: requests.filter(r => r.status === 'rejected').length, color: 'red' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                <Package className={`h-6 w-6 text-${stat.color}-600`} />
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
            {(['all', 'pending', 'approved', 'partial', 'rejected'] as const).map((status) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Requisições */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Requisições ({filteredRequests.length})
            </h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {filteredRequests.map((request) => (
              <div
                key={request.ID}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedRequest?.ID === request.ID ? 'bg-blue-50 border-l-4 border-blue-500' : ''
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
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User size={14} className="mr-2" />
                        {request.requester.name}
                      </div>
                      <div className="flex items-center">
                        <Building size={14} className="mr-2" />
                        {request.sector.name}
                      </div>
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2" />
                        {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{request.items.length} itens</p>
                    <button className="mt-1 text-blue-600 hover:text-blue-700 text-sm">
                      <Eye size={14} className="inline mr-1" />
                      Ver detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="ml-2">{getStatusText(selectedRequest.status)}</span>
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Informações do Solicitante */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Informações do Solicitante</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nome:</span>
                      <span className="text-sm font-medium">{selectedRequest.requester.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{selectedRequest.requester.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Setor:</span>
                      <span className="text-sm font-medium">{selectedRequest.sector.name}</span>
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

                {/* Itens da Requisição */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Itens ({selectedRequest.items.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedRequest.items.map((item) => (
                      <div key={item.ID} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                            <p className="text-sm text-gray-600">{item.product.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span>Qtd: {item.quantity} {item.product.unit}</span>
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
              <h4 className="font-medium">{reviewingItem.product.name}</h4>
              <p className="text-sm text-gray-600">Quantidade: {reviewingItem.quantity} {reviewingItem.product.unit}</p>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const status = formData.get('status') as 'approved' | 'rejected';
              const adminNotes = formData.get('adminNotes') as string;
              
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