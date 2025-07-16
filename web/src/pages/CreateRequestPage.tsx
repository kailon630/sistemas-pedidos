// src/pages/CreateRequestPage.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Package, Save, AlertCircle, ShoppingCart } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { getProducts, type Product } from '../api/products';
import { createPurchaseRequest } from '../api/requests';

interface RequestItem {
  productId: number;
  quantity: number;
  deadline?: string; // Pode ser uma string YYYY-MM-DD
  product?: Product;
}

interface RequestFormData {
  items: RequestItem[];
  observations: string;
}

const CreateRequestPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RequestFormData>({
    items: [],
    observations: ''
  });

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showProductSelector, setShowProductSelector] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await getProducts();
      // Filtra apenas produtos disponíveis
      const available = response.data.filter(p => p.Status === 'available');
      setAvailableProducts(available);
    } catch (error: any) { // Tipagem do erro para evitar 'unknown'
      console.error('Erro ao carregar produtos:', error);
      alert('Erro ao carregar produtos. Tente novamente.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const addItem = (product: Product) => {
    // Verifica se o produto já foi adicionado
    const existingItem = formData.items.find(item => item.productId === product.ID);
    if (existingItem) {
      alert('Este produto já foi adicionado à requisição.');
      return;
    }

    const newItem: RequestItem = {
      productId: product.ID,
      quantity: 1,
      deadline: '', // Inicializa como string vazia
      product
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setShowProductSelector(false);
  };

  const updateItem = (index: number, field: keyof RequestItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.items.length === 0) {
      newErrors.items = 'Adicione pelo menos um item à requisição';
    }

    formData.items.forEach((item, index) => {
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantidade deve ser maior que zero';
      }
      // Validação opcional para o deadline: se preenchido, deve ser uma data válida no futuro
      if (item.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data
        const selectedDate = new Date(item.deadline + 'T00:00:00'); // Garante que a data seja interpretada em UTC ou local consistentemente
        
        if (isNaN(selectedDate.getTime())) {
          newErrors[`item_${index}_deadline`] = 'Data inválida';
        } else if (selectedDate < today) {
          newErrors[`item_${index}_deadline`] = 'Prazo deve ser uma data futura';
        }
      }
    });

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
      
      const requestData = {
        items: formData.items.map(item => {
          // CORREÇÃO AQUI: Formata o deadline para ISO 8601 com Z (UTC) se ele existir
          const formattedDeadline = item.deadline
            ? new Date(item.deadline + 'T00:00:00Z').toISOString() // Adiciona 'T00:00:00Z' para forçar UTC 00:00:00
            : undefined;
          
          return {
            productId: item.productId,
            quantity: item.quantity,
            deadline: formattedDeadline // Envia a data formatada ou undefined
          };
        }),
        observations: formData.observations.trim()
      };

      await createPurchaseRequest(requestData);
      alert('Requisição criada com sucesso!');
      navigate('/');
    } catch (error: any) { // Tipagem do erro para evitar 'unknown'
      console.error('Erro ao criar requisição:', error);
      
      if (error.response?.data?.error) {
        alert(`Erro: ${error.response.data.error}`);
      } else {
        alert('Erro ao criar requisição. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = () => {
    return formData.items.reduce((total, item) => total + item.quantity, 0);
  };

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/"
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Requisição de Compras</h1>
          <p className="text-gray-600">
            Adicione os produtos necessários para o setor {user?.sector?.Name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Items Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Itens da Requisição</h2>
                  <p className="text-sm text-gray-600">
                    {formData.items.length} produto(s) - {getTotalItems()} item(s) total
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProductSelector(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus size={16} />
                <span>Adicionar Produto</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {formData.items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum item adicionado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Clique em "Adicionar Produto" para começar sua requisição.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <Package className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-900">{item.product?.Name}</h4>
                            <p className="text-sm text-gray-600">{item.product?.Description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Quantity */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantidade *
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                              />
                              <span className="text-sm text-gray-500">{item.product?.Unit}</span>
                            </div>
                            {errors[`item_${index}_quantity`] && (
                              <div className="flex items-center mt-1 text-sm text-red-600">
                                <AlertCircle size={14} className="mr-1" />
                                {errors[`item_${index}_quantity`]}
                              </div>
                            )}
                          </div>

                          {/* Deadline */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Prazo Desejado
                            </label>
                            <input
                              type="date"
                              value={item.deadline}
                              onChange={(e) => updateItem(index, 'deadline', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors[`item_${index}_deadline`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                             {errors[`item_${index}_deadline`] && (
                              <div className="flex items-center mt-1 text-sm text-red-600">
                                <AlertCircle size={14} className="mr-1" />
                                {errors[`item_${index}_deadline`]}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errors.items && (
              <div className="flex items-center mt-4 text-sm text-red-600">
                <AlertCircle size={14} className="mr-1" />
                {errors.items}
              </div>
            )}
          </div>
        </div>

        {/* Observations */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              id="observations"
              rows={4}
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adicione informações adicionais sobre a requisição..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || formData.items.length === 0}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save size={16} className="mr-2" />
            )}
            {loading ? 'Criando...' : 'Criar Requisição'}
          </button>
        </div>
      </form>

      {/* Product Selector Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Selecionar Produto</h3>
                <button
                  onClick={() => setShowProductSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="grid gap-3">
                {availableProducts.map((product) => (
                  <div
                    key={product.ID}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => addItem(product)}
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="font-medium text-gray-900">{product.Name}</h4>
                        <p className="text-sm text-gray-600">{product.Description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Unidade: {product.Unit} • Setor: {product.Sector.Name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {availableProducts.length === 0 && (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto disponível</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Não há produtos cadastrados para seu setor.
                  </p>
                  <Link
                    to="/products/new"
                    className="inline-flex items-center mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="-ml-1 mr-2 h-4 w-4" />
                    Cadastrar Produto
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateRequestPage;