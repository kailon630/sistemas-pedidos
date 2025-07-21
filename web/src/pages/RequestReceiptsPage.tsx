import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Package, AlertCircle, CheckCircle, Clock, TrendingUp, Info } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { getPurchaseRequest, type PurchaseRequest } from '../api/requests';
import { 
  getReceivingStatus, 
  listItemReceipts, 
  type ItemReceipt, 
  type ReceivingStatus 
} from '../api/receipts';
import AddReceiptModal from '../components/receipts/AddReceiptModal';

interface ItemWithReceipts extends ReceivingStatus {
  receipts: ItemReceipt[];
}

const RequestReceiptsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const requestId = Number(id);

  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [items, setItems] = useState<ItemWithReceipts[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState<ItemWithReceipts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requestId && !isNaN(requestId)) {
      loadData();
    } else {
      setError('ID da requisição inválido');
      setLoading(false);
    }
  }, [requestId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Carregando dados da requisição:', requestId);

      // Carregar requisição
      const reqRes = await getPurchaseRequest(requestId);
      console.log('📋 Dados da requisição:', reqRes.data);
      setRequest(reqRes.data);

      // Carregar status de recebimento
      const statusRes = await getReceivingStatus(requestId);
      console.log('📊 Status de recebimento:', statusRes.data);

      // Verificar se statusRes.data e statusRes.data.items existem
      if (!statusRes.data || !statusRes.data.items || !Array.isArray(statusRes.data.items)) {
        console.warn('⚠️ Dados de status de recebimento inválidos:', statusRes.data);
        setItems([]);
        return;
      }

      // Carregar recebimentos para cada item
      const itemsWithReceipts: ItemWithReceipts[] = await Promise.all(
        statusRes.data.items.map(async (status: ReceivingStatus) => {
          try {
            const receiptsRes = await listItemReceipts(requestId, status.itemId);
            return { 
              ...status, 
              receipts: receiptsRes.data || []
            };
          } catch (error) {
            console.error(`❌ Erro ao carregar recebimentos do item ${status.itemId}:`, error);
            return { 
              ...status, 
              receipts: []
            };
          }
        })
      );

      console.log('✅ Itens com recebimentos carregados:', itemsWithReceipts);
      setItems(itemsWithReceipts);

    } catch (err: any) {
      console.error('❌ Erro ao carregar dados:', err);
      setError(err.response?.data?.error || 'Erro ao carregar dados dos recebimentos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item: ItemWithReceipts) => setModalItem(item);
  const closeModal = () => setModalItem(null);

  const handleSuccess = () => {
    closeModal();
    loadData();
  };

  // ✅ FUNÇÃO PARA VERIFICAR SE PODE RECEBER
  const canReceiveItems = (request: PurchaseRequest | null): { canReceive: boolean; reason: string } => {
    if (!request) {
      return { canReceive: false, reason: 'Requisição não encontrada' };
    }

    if (user?.role !== 'admin') {
      return { canReceive: false, reason: 'Apenas administradores podem registrar recebimentos' };
    }

    // ✅ CORREÇÃO: Permitir recebimentos em approved, partial E completed
    const allowedStatuses = ['approved', 'partial', 'completed'];
    if (!allowedStatuses.includes(request.status)) {
      return { 
        canReceive: false, 
        reason: `Requisições com status "${request.status}" não permitem recebimentos. Status permitidos: ${allowedStatuses.join(', ')}` 
      };
    }

    return { canReceive: true, reason: '' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'over_delivered': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle size={16} />;
      case 'partial': return <TrendingUp size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'over_delivered': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete': return 'Completo';
      case 'partial': return 'Parcial';
      case 'pending': return 'Pendente';
      case 'over_delivered': return 'Excedente';
      default: return status;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Carregando recebimentos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar dados</h3>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <div className="mt-6 space-x-3">
          <button
            onClick={() => loadData()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
          <Link
            to="/requests"
            className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            <ArrowLeft className="-ml-1 mr-2 h-4 w-4" />
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  // Not found state
  if (!request) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Requisição não encontrada</h3>
        <Link
          to="/requests"
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft className="-ml-1 mr-2 h-4 w-4" />
          Voltar
        </Link>
      </div>
    );
  }

  // ✅ VERIFICAR PERMISSÕES DE RECEBIMENTO
  const receiptPermissions = canReceiveItems(request);

  // Calculate summary stats
  const summary = items.reduce(
    (acc, item) => {
      acc.totalItems++;
      switch (item.status) {
        case 'complete':
          acc.completeItems++;
          break;
        case 'partial':
          acc.partialItems++;
          break;
        case 'pending':
          acc.pendingItems++;
          break;
      }
      acc.totalOrdered += item.quantityOrdered;
      acc.totalReceived += item.quantityReceived;
      return acc;
    },
    {
      totalItems: 0,
      completeItems: 0,
      partialItems: 0,
      pendingItems: 0,
      totalOrdered: 0,
      totalReceived: 0,
    }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to={`/requests/${id}`}
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Recebimentos - Requisição #{request.id}
          </h1>
          <p className="text-gray-600">
            Registre e acompanhe os recebimentos dos itens aprovados
          </p>
        </div>
      </div>

      {/* ✅ ALERTA DE PERMISSÕES */}
      {!receiptPermissions.canReceive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="text-amber-600 mr-3 mt-0.5" size={20} />
            <div>
              <h3 className="text-amber-800 font-medium">Atenção: Recebimentos Restritos</h3>
              <p className="text-amber-700 text-sm mt-1">{receiptPermissions.reason}</p>
              {request.status === 'completed' && (
                <div className="mt-3 p-3 bg-amber-100 rounded-md">
                  <p className="text-amber-800 text-sm font-medium">💡 Solução:</p>
                  <p className="text-amber-700 text-sm">
                    Se necessário registrar recebimentos adicionais em requisições completas, 
                    solicite ao administrador do sistema para ajustar as permissões de recebimento.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Solicitante</p>
              <p className="font-medium text-gray-900">{request.requester?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Setor</p>
              <p className="font-medium text-gray-900">{request.sector?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${
              request.status === 'completed' ? 'bg-blue-100' :
              request.status === 'approved' ? 'bg-green-100' :
              request.status === 'partial' ? 'bg-purple-100' :
              'bg-gray-100'
            }`}>
              <TrendingUp className={`h-6 w-6 ${
                request.status === 'completed' ? 'text-blue-600' :
                request.status === 'approved' ? 'text-green-600' :
                request.status === 'partial' ? 'text-purple-600' :
                'text-gray-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Status da Requisição</p>
              <p className="font-medium text-gray-900 capitalize">{request.status}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Info className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pode Receber</p>
              <p className={`font-medium ${receiptPermissions.canReceive ? 'text-green-600' : 'text-red-600'}`}>
                {receiptPermissions.canReceive ? 'Sim' : 'Não'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Itens</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalItems}</p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completos</p>
              <p className="text-2xl font-bold text-green-600">{summary.completeItems}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Parciais</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.partialItems}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-600">{summary.pendingItems}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">% Recebido</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary.totalOrdered > 0 
                  ? Math.round((summary.totalReceived / summary.totalOrdered) * 100)
                  : 0
                }%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum item para recebimento</h3>
            <p className="mt-1 text-sm text-gray-500">
              Esta requisição não possui itens aprovados para recebimento.
            </p>
            <Link
              to={`/requests/${id}`}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Ver Requisição
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.itemId} className="bg-white rounded-lg border shadow-sm">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <Package className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Pedido: {item.quantityOrdered}</span>
                          <span>Recebido: {item.quantityReceived}</span>
                          <span>Pendente: {item.quantityPending}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Progresso do Recebimento</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{getStatusText(item.status)}</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            item.status === 'complete'
                              ? 'bg-green-500'
                              : item.status === 'partial'
                              ? 'bg-yellow-500'
                              : 'bg-gray-300'
                          }`}
                          style={{
                            width: `${item.quantityOrdered > 0 ? (item.quantityReceived / item.quantityOrdered) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="ml-6">
                    <button
                      onClick={() => openModal(item)}
                      disabled={!receiptPermissions.canReceive || item.quantityPending <= 0}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                      title={
                        !receiptPermissions.canReceive 
                          ? receiptPermissions.reason
                          : item.quantityPending <= 0 
                            ? 'Nenhuma quantidade pendente' 
                            : 'Registrar recebimento'
                      }
                    >
                      <Plus size={16} />
                      <span>Receber</span>
                    </button>
                    {!receiptPermissions.canReceive && (
                      <p className="text-xs text-red-600 mt-1 text-center">
                        Bloqueado
                      </p>
                    )}
                  </div>
                </div>

                {/* Receipts History */}
                {item.receipts && item.receipts.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Histórico de Recebimentos</h4>
                    <div className="space-y-2">
                      {item.receipts.map((receipt) => (
                        <div
                          key={receipt.ID}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium">
                                {new Date(receipt.CreatedAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="text-sm text-gray-600">
                                NF: {receipt.invoiceNumber}
                              </span>
                              {receipt.supplier && (
                                <span className="text-sm text-gray-600">
                                  Fornecedor: {receipt.supplier.name}
                                </span>
                              )}
                            </div>
                            {receipt.notes && (
                              <p className="text-xs text-gray-500 mt-1">{receipt.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-green-600">
                              +{receipt.quantityReceived}
                            </span>
                            {receipt.rejectedQuantity > 0 && (
                              <span className="text-sm text-red-600 block">
                                -{receipt.rejectedQuantity} rejeitado(s)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ✅ INFORMAÇÕES SOBRE LIMITAÇÕES */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="text-blue-600 mr-3 mt-0.5" size={16} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">ℹ️ Sobre recebimentos:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Recebimentos são permitidos em requisições aprovadas, parciais e completas</li>
              <li>Apenas administradores podem registrar recebimentos</li>
              <li>É possível fazer recebimentos parciais múltiplos do mesmo item</li>
              <li>O histórico completo de recebimentos é mantido para auditoria</li>
              {request.status === 'completed' && !receiptPermissions.canReceive && (
                <li className="text-amber-700">
                  <strong>Limitação atual:</strong> O backend está restringindo recebimentos em requisições completas
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalItem && receiptPermissions.canReceive && (
        <AddReceiptModal
          isOpen={!!modalItem}
          onClose={closeModal}
          onSuccess={handleSuccess}
          requestId={requestId}
          itemId={modalItem.itemId}
          productName={modalItem.productName}
          productUnit={request.items.find((i) => i.id === modalItem.itemId)?.product?.unit || ''}
          quantityPending={modalItem.quantityPending}
        />
      )}
    </div>
  );
};

export default RequestReceiptsPage;