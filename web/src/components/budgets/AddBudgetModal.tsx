// src/components/budgets/AddBudgetModal.tsx - VERSÃO FINAL LIMPA
import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle } from 'lucide-react';
import { createItemBudget } from '../../api/budget';
import { getSuppliers, type Supplier } from '../../api/supplier';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: number;
  itemId: number;
  productName: string;
  productUnit: string;
  quantity: number;
  existingSupplierIds: number[];
}

interface BudgetFormData {
  supplierId: number | '';
  unitPrice: string;
}

const AddBudgetModal: React.FC<AddBudgetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  requestId,
  itemId,
  productName,
  productUnit,
  quantity,
  existingSupplierIds
}) => {
  const [formData, setFormData] = useState<BudgetFormData>({
    supplierId: '',
    unitPrice: ''
  });
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      setFormData({ supplierId: '', unitPrice: '' });
      setErrors({});
    }
  }, [isOpen]);

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const response = await getSuppliers();
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // Filtrar fornecedores que ainda não têm cotação para este item
  const availableSuppliers = suppliers.filter(
    supplier => !existingSupplierIds.includes(supplier.id)
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplierId) {
      newErrors.supplierId = 'Fornecedor é obrigatório';
    }

    if (!formData.unitPrice.trim()) {
      newErrors.unitPrice = 'Preço unitário é obrigatório';
    } else {
      const price = parseFloat(formData.unitPrice);
      if (isNaN(price) || price <= 0) {
        newErrors.unitPrice = 'Preço deve ser um número válido maior que zero';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      await createItemBudget(requestId, itemId, {
        supplierId: Number(formData.supplierId),
        unitPrice: parseFloat(formData.unitPrice)
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar cotação:', error);
      
      if (error.response?.data?.error) {
        alert(`Erro: ${error.response.data.error}`);
      } else {
        alert('Erro ao criar cotação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof BudgetFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numPrice);
  };

  const getTotalPrice = () => {
    const unitPrice = parseFloat(formData.unitPrice);
    if (isNaN(unitPrice)) return 'R$ 0,00';
    
    return formatPrice((unitPrice * quantity).toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">Nova Cotação</h3>
                <p className="text-sm text-gray-600">{productName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Informações do produto */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Detalhes do Item</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Produto:</span>
                <span className="font-medium">{productName}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantidade:</span>
                <span className="font-medium">{quantity} {productUnit}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fornecedor */}
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-2">
                Fornecedor *
              </label>
              <select
                id="supplierId"
                value={formData.supplierId}
                onChange={(e) => handleChange('supplierId', Number(e.target.value))}
                disabled={loadingSuppliers}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.supplierId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {loadingSuppliers ? 'Carregando...' : 'Selecione um fornecedor'}
                </option>
                {availableSuppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.supplierId}
                </div>
              )}
              {availableSuppliers.length === 0 && !loadingSuppliers && suppliers.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Todos os fornecedores já possuem cotação para este item
                </p>
              )}
              {suppliers.length === 0 && !loadingSuppliers && (
                <p className="mt-1 text-sm text-red-500">
                  Nenhum fornecedor encontrado. Cadastre fornecedores antes de criar cotações.
                </p>
              )}
            </div>

            {/* Preço Unitário */}
            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Preço Unitário * (por {productUnit})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="unitPrice"
                value={formData.unitPrice}
                onChange={(e) => handleChange('unitPrice', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.unitPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0,00"
              />
              {errors.unitPrice && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.unitPrice}
                </div>
              )}
            </div>

            {/* Preview do valor total */}
            {formData.unitPrice && !isNaN(parseFloat(formData.unitPrice)) && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Resumo da Cotação</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-blue-800">
                    <span>Preço unitário:</span>
                    <span className="font-medium">{formatPrice(formData.unitPrice)}</span>
                  </div>
                  <div className="flex justify-between text-blue-800">
                    <span>Quantidade:</span>
                    <span className="font-medium">{quantity} {productUnit}</span>
                  </div>
                  <div className="flex justify-between text-blue-900 font-semibold border-t border-blue-200 pt-1">
                    <span>Total:</span>
                    <span>{getTotalPrice()}</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || availableSuppliers.length === 0}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Criando...' : 'Criar Cotação'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBudgetModal;