import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Package } from 'lucide-react';
import { getPurchaseRequest, type PurchaseRequest } from '../api/requests';
import { getReceivingStatus, listItemReceipts, type ItemReceipt, type ReceivingStatus } from '../api/receipts';
import AddReceiptModal from '../components/receipts/AddReceiptModal';

interface ItemWithReceipts extends ReceivingStatus {
  receipts: ItemReceipt[];
}

const RequestReceiptsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);

  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [items, setItems] = useState<ItemWithReceipts[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState<ItemWithReceipts | null>(null);

  useEffect(() => {
    if (requestId) loadData();
  }, [requestId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqRes, statusRes] = await Promise.all([
        getPurchaseRequest(requestId),
        getReceivingStatus(requestId),
      ]);
      setRequest(reqRes.data);

      const itemsWithReceipts: ItemWithReceipts[] = await Promise.all(
        statusRes.data.items.map(async (status) => {
          const receiptsRes = await listItemReceipts(requestId, status.itemId);
          return { ...status, receipts: receiptsRes.data || [] };
        })
      );

      setItems(itemsWithReceipts);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item: ItemWithReceipts) => setModalItem(item);
  const closeModal = () => setModalItem(null);

  const handleSuccess = () => loadData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Requisição não encontrada</h3>
        <Link to="/requests" className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <ArrowLeft className="-ml-1 mr-2 h-4 w-4" /> Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/requests" className="p-2 rounded-md hover:bg-gray-100">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Recebimentos - Requisição #{request.id}</h1>
          <p className="text-gray-600">Registre e acompanhe os recebimentos dos itens</p>
        </div>
      </div>

      <div className="space-y-4">
        {items.map(item => (
          <div key={item.itemId} className="bg-white rounded-lg border p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                <p className="text-sm text-gray-600">
                  Pedido: {item.quantityOrdered} | Recebido: {item.quantityReceived} | Pendente: {item.quantityPending}
                </p>
              </div>
              <button
                onClick={() => openModal(item)}
                className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <Plus size={16} className="mr-1" /> Receber
              </button>
            </div>
            {item.receipts.length > 0 && (
              <div className="border-t pt-2 space-y-2 text-sm">
                {item.receipts.map(r => (
                  <div key={r.ID} className="flex justify-between">
                    <span>
                      {new Date(r.CreatedAt).toLocaleDateString('pt-BR')} - NF {r.invoiceNumber}
                    </span>
                    <span>
                      {r.quantityReceived} {request.items.find(i => i.id === item.itemId)?.product.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {modalItem && (
        <AddReceiptModal
          isOpen={!!modalItem}
          onClose={closeModal}
          onSuccess={handleSuccess}
          requestId={requestId}
          itemId={modalItem.itemId}
          productName={modalItem.productName}
          productUnit={request.items.find(i => i.id === modalItem.itemId)?.product.unit || ''}
          quantityPending={modalItem.quantityPending}
        />
      )}
    </div>
  );
};

export default RequestReceiptsPage;
