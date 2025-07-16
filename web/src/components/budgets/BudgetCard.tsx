// src/components/budgets/BudgetCard.tsx - VERSÃO ADMIN ONLY

import React, { useState, useContext } from 'react';
import { Edit2, Trash2, Phone, Mail, Award, DollarSign } from 'lucide-react';
import { type ItemBudget, updateBudget, deleteBudget } from '../../api/budget';
import { AuthContext } from '../../contexts/AuthContext'; // ← ADICIONAR IMPORT

interface BudgetCardProps {
  budget: ItemBudget;
  isLowestPrice?: boolean;
  onUpdate: () => void;
  onDelete: () => void;
  canEdit?: boolean;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ 
  budget, 
  isLowestPrice = false, 
  onUpdate, 
  onDelete,
  canEdit = true 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState(budget.unitPrice.toString());
  const [loading, setLoading] = useState(false);
  
  // ✅ ADICIONAR: Pegar dados do usuário atual
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const handleSaveEdit = async () => {
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      alert('Preço deve ser um número válido maior que zero');
      return;
    }

    try {
      setLoading(true);
      await updateBudget(budget.ID, { unitPrice: newPrice });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      alert('Erro ao atualizar orçamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const supplierName = budget.Supplier?.name || 'este fornecedor';
    
    if (window.confirm(`Tem certeza que deseja excluir a cotação de ${supplierName}?`)) {
      try {
        setLoading(true);
        await deleteBudget(budget.ID);
        onDelete();
      } catch (error: any) {
        console.error('Erro ao deletar orçamento:', error);
        
        if (error.response?.status === 403) {
          alert('Apenas administradores podem excluir cotações.');
        } else {
          alert('Erro ao deletar orçamento. Tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getTotalPrice = () => {
    const quantity = budget.RequestItem?.Quantity || 1;
    return budget.unitPrice * quantity;
  };

  return (
    <div className={`bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
      isLowestPrice 
        ? 'border-green-200 bg-green-50' 
        : 'border-gray-200 hover:border-blue-200'
    }`}>
      <div className="p-4">
        {/* Header com fornecedor e badge de melhor preço */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              isLowestPrice ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <DollarSign className={`h-5 w-5 ${
                isLowestPrice ? 'text-green-600' : 'text-blue-600'
              }`} />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">
                {budget.Supplier?.name || 'Fornecedor não encontrado'}
              </h3>
              <p className="text-sm text-gray-600">
                {budget.Supplier?.contact || 'Sem contato'}
              </p>
            </div>
          </div>
          
          {isLowestPrice && (
            <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full">
              <Award size={14} className="mr-1" />
              <span className="text-xs font-medium">Melhor Preço</span>
            </div>
          )}
        </div>

        {/* Preços */}
        <div className="mb-4">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Unitário
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditPrice(budget.unitPrice.toString());
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-400 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Preço unitário:</span>
                <span className={`text-lg font-bold ${
                  isLowestPrice ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {formatPrice(budget.unitPrice)}
                </span>
              </div>
              
              {budget.RequestItem?.Quantity && budget.RequestItem.Quantity > 1 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total ({budget.RequestItem.Quantity} {budget.RequestItem.Product?.Unit}):
                  </span>
                  <span className={`text-lg font-bold ${
                    isLowestPrice ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informações de contato */}
        {budget.Supplier && (
          <div className="mb-4 space-y-2">
            {budget.Supplier.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone size={14} className="mr-2" />
                <span>{budget.Supplier.phone}</span>
              </div>
            )}
            {budget.Supplier.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail size={14} className="mr-2" />
                <span className="truncate">{budget.Supplier.email}</span>
              </div>
            )}
          </div>
        )}

        {/* Data de criação */}
        <div className="text-xs text-gray-500 mb-4">
          Cotação criada em {new Date(budget.CreatedAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        {/* Ações */}
        {canEdit && !isEditing && (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 flex items-center justify-center text-sm font-medium transition-colors"
            >
              <Edit2 size={14} className="mr-1" />
              Editar Preço
            </button>
            
            {/* ✅ MUDANÇA: Só mostra botão excluir para admins */}
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded-md hover:bg-red-100 flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} className="mr-1" />
                {loading ? 'Excluindo...' : 'Excluir'}
              </button>
            )}
          </div>
        )}
        
        {/* ✅ ADICIONAR: Mensagem informativa para não-admins */}
        {!isAdmin && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              💡 Apenas administradores podem excluir cotações.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetCard;