// src/pages/RequestBudgetsPage.tsx - VERSÃO FINAL COM CORREÇÃO
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  DollarSign,
  Package,
  Award,
  BarChart3,
  User,
  Building
} from 'lucide-react';

import { getRequestBudgets, type ItemBudget } from '../api/budget';
import { getPurchaseRequest, type PurchaseRequest } from '../api/requests';
import { BudgetCard, AddBudgetModal } from '../components/budgets';

type RawPurchaseRequest = Omit<PurchaseRequest, 'items'> & {
  items?: PurchaseRequest['items'];
  Items?: PurchaseRequest['items'];
};

const RequestBudgetsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);

  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [budgets, setBudgets] = useState<ItemBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: number;
    name: string;
    unit: string;
    quantity: number;
  } | null>(null);

  useEffect(() => {
    if (requestId) loadData();
  }, [requestId]);

  async function loadData() {
    try {
      setLoading(true);
      
      const [reqRes, budgetsRes] = await Promise.all([
        getPurchaseRequest(requestId),
        getRequestBudgets(requestId)
      ]);

      const raw = reqRes.data as RawPurchaseRequest;
      const itemsFromLower = raw.items ?? [];
      const itemsFromUpper = raw.Items ?? [];
      const finalItems = itemsFromLower.length > 0 ? itemsFromLower : itemsFromUpper;

      const normalized: PurchaseRequest = {
        ...raw,
        items: finalItems
      };

      setRequest(normalized);
      setBudgets(budgetsRes.data ?? []);

    } catch (error) {
      console.error('Erro ao carregar dados da requisição:', error);
      alert('Falha ao carregar dados da requisição');
    } finally {
      setLoading(false);
    }
  }

  function handleAddBudget(item: PurchaseRequest['items'][0]) {
    setSelectedItem({
      id: item.id,
      name: item.product?.name ?? `Produto ID ${item.productId}`,
      unit: item.product?.unit ?? 'un',
      quantity: item.quantity
    });
    setShowAddModal(true);
  }

  function handleBudgetUpdate() {
    loadData();
  }

  function handleBudgetDelete() {
    loadData();
  }

  const getItemBudgets = (itemId: number) => {
    return budgets.filter(b => b.requestItemId === itemId);
  };

  const getLowestPriceBudget = (itemBudgets: ItemBudget[]) => {
    if (itemBudgets.length === 0) return null;
    return itemBudgets.reduce((low, cur) => (cur.unitPrice < low.unitPrice ? cur : low), itemBudgets[0]);
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getTotalSavings = () => {
    if (!request?.items) return 0;
    return request.items.reduce((sum, item) => {
      const itemBudgets = getItemBudgets(item.id);
      if (itemBudgets.length > 1) {
        const prices = itemBudgets.map(b => b.unitPrice);
        return sum + (Math.max(...prices) - Math.min(...prices)) * item.quantity;
      }
      return sum;
    }, 0);
  };

  // Estatísticas
  const totalBudgets = budgets.length;
  const itemsWithBudgets = new Set(budgets.map(b => b.requestItemId)).size;
  const totalItems = request?.items.length ?? 0;
  const averagePrice = budgets.length > 0
    ? budgets.reduce((sum, b) => sum + b.unitPrice, 0) / budgets.length
    : 0;

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
        <Link
          to="/budgets"
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft className="-ml-1 mr-2 h-4 w-4" /> Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/budgets" className="p-2 rounded-md hover:bg-gray-100">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Cotações - Requisição #{request.id}</h1>
          <p className="text-gray-600">Gerencie cotações para todos os itens</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center">
          <User size={20} className="text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-600">Solicitante</p>
            <p className="font-medium">{request.requester?.name ?? 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Building size={20} className="text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-600">Setor</p>
            <p className="font-medium">{request.sector?.name ?? 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Package size={20} className="text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span
              className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                request.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : request.status === 'partial'
                  ? 'bg-purple-100 text-purple-800'
                  : request.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {request.status}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <DollarSign size={20} className="text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-600">Economia Potencial</p>
            <p className="font-medium text-green-600">{formatPrice(getTotalSavings())}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total de Cotações</p>
            <p className="text-2xl font-bold text-gray-900">{totalBudgets}</p>
          </div>
          <DollarSign className="h-6 w-6 text-blue-600" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Itens com Cotação</p>
            <p className="text-2xl font-bold text-green-600">
              {itemsWithBudgets}/{totalItems}
            </p>
          </div>
          <Package className="h-6 w-6 text-green-600" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Preço Médio</p>
            <p className="text-2xl font-bold text-purple-600">{formatPrice(averagePrice)}</p>
          </div>
          <BarChart3 className="h-6 w-6 text-purple-600" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Economia Total</p>
            <p className="text-2xl font-bold text-orange-600">{formatPrice(getTotalSavings())}</p>
          </div>
          <Award className="h-6 w-6 text-orange-600" />
        </div>
      </div>

      {/* Items & Budgets */}
      <div className="space-y-8">
        {request.items.map((item, _itemIndex) => {
          const itemBudgets = getItemBudgets(item.id);
          const lowestPriceBudget = getLowestPriceBudget(itemBudgets);
          
          return (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b flex justify-between">
                <div className="flex items-center">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <Package className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">
                      {item.product?.name ?? `Produto ID ${item.productId}`}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.product?.description ?? 'Sem descrição'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Quantidade: {item.quantity} {item.product?.unit ?? 'un'}
                      {item.deadline && (
                        <span className="ml-4">
                          Prazo: {new Date(item.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {itemBudgets.length > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Melhor preço</p>
                      <p className="font-bold text-green-600">
                        {lowestPriceBudget ? formatPrice(lowestPriceBudget.unitPrice) : 'N/A'}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => handleAddBudget(item)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                  >
                    <Plus size={16} />
                    <span>Adicionar Cotação</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {itemBudgets.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma cotação</h3>
                    <p className="text-sm text-gray-500">
                      Adicione cotações de diferentes fornecedores para comparar preços.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itemBudgets.map(budget => (
                      <BudgetCard
                        key={budget.ID}
                        budget={budget}
                        isLowestPrice={budget.ID === lowestPriceBudget?.ID}
                        onUpdate={handleBudgetUpdate}
                        onDelete={handleBudgetDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showAddModal && selectedItem && (
        <AddBudgetModal
          isOpen
          onClose={() => {
            setShowAddModal(false);
            setSelectedItem(null);
          }}
          onSuccess={handleBudgetUpdate}
          requestId={requestId}
          itemId={selectedItem.id}
          productName={selectedItem.name}
          productUnit={selectedItem.unit}
          quantity={selectedItem.quantity}
          existingSupplierIds={[...new Set(getItemBudgets(selectedItem.id).map(b => b.supplierId))]}
        />
      )}
    </div>
  );
};

export default RequestBudgetsPage;