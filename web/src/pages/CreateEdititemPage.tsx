// src/pages/CreateEditItemPage.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Save, 
  AlertCircle, 
  Search,
  Calendar,
  Hash,
  FileText,
  Info,
  CheckCircle,
  Plus
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { getProducts, type Product } from '../api/products';
import { 
  getPurchaseRequest, 
  getRequestItems, 
  addRequestItem, 
  updateRequestItem,
  type PurchaseRequest,
  type RequestItem 
} from '../api/requests';

interface CreateEditItemFormData {
  productId: number | '';
  quantity: number;
  deadline: string; // YYYY-MM-DD format
  adminNotes: string;
}

const CreateEditItemPage: React.FC = () => {
  const { id: requestId, itemId } = useParams<{ id: string; itemId?: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isEditing = !!itemId;
  const isAdmin = user?.role === 'admin';

  // States
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [currentItem, setCurrentItem] = useState<RequestItem | null>(null);
  const [formData, setFormData] = useState<CreateEditItemFormData>({
    productId: '',
    quantity: 1,
    deadline: '',
    adminNotes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [requestId, itemId]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      // Load request data
      const requestRes = await getPurchaseRequest(Number(requestId));
      setRequest(requestRes.data);

      // Load products
      const productsRes = await getProducts();
      const available = productsRes.data.filter(p => p.Status === 'available');
      setAvailableProducts(available);

      // If editing, load current item data
      if (isEditing && itemId) {
        const itemsRes = await getRequestItems(Number(requestId));
        const item = itemsRes.data.find((i: { id: number; }) => i.id === Number(itemId));
        
        if (item) {
          setCurrentItem(item);
          setFormData({
            productId: item.productId,
            quantity: item.quantity,
            deadline: item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : '',
            adminNotes: item.adminNotes || ''
          });
        } else {
          throw new Error('Item não encontrado');
        }
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados. Redirecionando...');
      navigate(`/requests/${requestId}`);
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Product validation
    if (!formData.productId) {
      newErrors.productId = 'Produto é obrigatório';
    }

    // Quantity validation
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantidade deve ser maior que zero';
    }

    // Deadline validation (if provided)
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        newErrors.deadline = 'Prazo deve ser uma data futura ou hoje';
      }
    }

    // Check for duplicate product (only when creating)
    if (!isEditing && request?.items) {
      const existingItem = request.items.find((item: { productId: any; }) => item.productId === formData.productId);
      if (existingItem) {
        newErrors.productId = 'Este produto já foi adicionado à requisição';
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

    // Check permissions
    if (!request) {
      alert('Dados da requisição não carregados');
      return;
    }

    if (!isAdmin && request.status !== 'pending') {
      alert('Não é possível modificar itens de requisições já revisadas');
      return;
    }

    if (!isAdmin && request.requesterId !== Number(user?.id)) {
      alert('Você só pode modificar itens de suas próprias requisições');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        productId: Number(formData.productId),
        quantity: formData.quantity,
        deadline: formData.deadline || undefined,
        ...(isAdmin && { adminNotes: formData.adminNotes })
      };

      if (isEditing) {
        await updateRequestItem(Number(requestId), Number(itemId), payload);
        alert('Item atualizado com sucesso!');
      } else {
        await addRequestItem(Number(requestId), payload);
        alert('Item adicionado com sucesso!');
      }

      navigate(`/requests/${requestId}`);
    } catch (error: any) {
      console.error('Erro ao salvar item:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao salvar item. Tente novamente.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateEditItemFormData, value: string | number) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const selectProduct = (product: Product) => {
    handleChange('productId', product.ID);
    setShowProductSearch(false);
    setSearchTerm('');
  };

  const getSelectedProduct = () => {
    return availableProducts.find((p: { ID: any; }) => p.ID === formData.productId);
  };

  const filteredProducts = availableProducts.filter((product: { Name: string; Description: string; }) => 
    product.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.Description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const selectedProduct = getSelectedProduct();
  const canEdit = isAdmin || (request && request.status === 'pending' && request.requesterId === Number(user?.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to={`/requests/${requestId}`}
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Item' : 'Adicionar Novo Item'}
          </h1>
          <p className="text-gray-600">
            {isEditing 
              ? `Atualize as informações do item da requisição #${requestId}`
              : `Adicione um novo item à requisição #${requestId}`
            }
          </p>
        </div>
      </div>

      {/* Request Info */}
      {request && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <FileText size={16} className="text-gray-400 mr-2" />
                <span className="text-sm font-medium">Requisição #{request.id}</span>
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                  request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {request.status === 'pending' ? 'Pendente' :
                   request.status === 'approved' ? 'Aprovada' :
                   request.status === 'rejected' ? 'Rejeitada' : request.status}
                </span>
              </div>
            </div>
            {!canEdit && (
              <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
                <AlertCircle size={16} className="mr-2" />
                <span className="text-sm">Modo somente leitura</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Informações do Item' : 'Detalhes do Novo Item'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? 'Modifique as informações conforme necessário' : 'Preencha os dados do item a ser requisitado'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produto *
              </label>
              
              {selectedProduct ? (
                // Selected product display
                <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium text-green-900">{selectedProduct.Name}</h4>
                        <p className="text-sm text-green-700">{selectedProduct.Description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-green-600">
                          <span>Unidade: {selectedProduct.Unit}</span>
                          <span>Setor: {selectedProduct.Sector.Name}</span>
                        </div>
                      </div>
                    </div>
                    {!isEditing && canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          handleChange('productId', '');
                          setShowProductSearch(true);
                        }}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Alterar
                      </button>
                    )}
                  </div>
                  {selectedProduct && (
                    <div className="mt-3 flex items-center text-sm text-green-600">
                      <CheckCircle size={14} className="mr-1" />
                      Produto selecionado
                    </div>
                  )}
                </div>
              ) : (
                // Product search/selection
                <div>
                  {!showProductSearch ? (
                    <button
                      type="button"
                      onClick={() => setShowProductSearch(true)}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-600">Clique para selecionar um produto</span>
                    </button>
                  ) : (
                    <div className="border border-gray-300 rounded-lg">
                      {/* Search header */}
                      <div className="p-4 border-b bg-gray-50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            placeholder="Buscar produtos..."
                            value={searchTerm}
                            onChange={(e: { target: { value: any; }; }) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      
                      {/* Products list */}
                      <div className="max-h-64 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <Package size={24} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">
                              {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                            </p>
                          </div>
                        ) : (
                          filteredProducts.map((product: Product) => (
                            <button
                              key={product.ID}
                              type="button"
                              onClick={() => selectProduct(product)}
                              className="w-full text-left p-4 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                            >
                              <div className="flex items-start">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <Package className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="ml-3 flex-1">
                                  <h4 className="font-medium text-gray-900">{product.Name}</h4>
                                  <p className="text-sm text-gray-600">{product.Description}</p>
                                  <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                    <span>Unidade: {product.Unit}</span>
                                    <span>Setor: {product.Sector.Name}</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      
                      {/* Cancel search */}
                      <div className="p-3 border-t bg-gray-50">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProductSearch(false);
                            setSearchTerm('');
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancelar seleção
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {errors.productId && (
                <div className="flex items-center mt-2 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.productId}
                </div>
              )}
            </div>

            {/* Quantity and Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash size={16} className="inline mr-1" />
                  Quantidade *
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={(e: { target: { value: string; }; }) => handleChange('quantity', parseInt(e.target.value) || 1)}
                  disabled={!canEdit}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-50' : ''}`}
                  placeholder="1"
                />
                {selectedProduct && (
                  <p className="mt-1 text-xs text-gray-500">
                    Unidade: {selectedProduct.Unit}
                  </p>
                )}
                {errors.quantity && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.quantity}
                  </div>
                )}
              </div>

              {/* Deadline */}
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Prazo Desejado
                </label>
                <input
                  type="date"
                  id="deadline"
                  value={formData.deadline}
                  onChange={(e: { target: { value: string | number; }; }) => handleChange('deadline', e.target.value)}
                  disabled={!canEdit}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.deadline ? 'border-red-500' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-50' : ''}`}
                />
                {errors.deadline && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.deadline}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Notes - only visible for admins */}
            {isAdmin && (
              <div>
                <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} className="inline mr-1" />
                  Observações Administrativas
                </label>
                <textarea
                  id="adminNotes"
                  rows={3}
                  value={formData.adminNotes}
                  onChange={(e: { target: { value: string | number; }; }) => handleChange('adminNotes', e.target.value)}
                  disabled={!canEdit}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !canEdit ? 'bg-gray-50' : ''
                  }`}
                  placeholder="Observações internas sobre este item..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Apenas administradores podem ver e editar estas observações.
                </p>
              </div>
            )}

            {/* Current Item Info - if editing */}
            {isEditing && currentItem && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Informações Atuais</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      currentItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      currentItem.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentItem.status === 'pending' ? 'Pendente' :
                       currentItem.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Criado em:</span>
                    <span className="ml-2">{new Date(currentItem.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                {currentItem.adminNotes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Observações do Admin:</p>
                    <p className="text-sm text-blue-800">{currentItem.adminNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate(`/requests/${requestId}`)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              {canEdit && (
                <button
                  type="submit"
                  disabled={loading || !selectedProduct}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  {loading 
                    ? (isEditing ? 'Salvando...' : 'Adicionando...')
                    : (isEditing ? 'Salvar Alterações' : 'Adicionar Item')
                  }
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="text-blue-600 mr-3 mt-0.5" size={16} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Dicas para {isEditing ? 'edição' : 'criação'} de itens:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Selecione produtos que pertencem ao setor da requisição</li>
              <li>Defina quantidades realistas baseadas na necessidade</li>
              <li>Use o prazo desejado para itens urgentes</li>
              {!isEditing && <li>Você pode adicionar vários itens à mesma requisição</li>}
              {!isAdmin && <li>Itens só podem ser editados enquanto a requisição estiver pendente</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Permission warning */}
      {!canEdit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-600 mr-3 mt-0.5" size={16} />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Permissões limitadas</p>
              <p>
                {isAdmin 
                  ? 'Esta requisição pode ter restrições de edição baseadas no seu status atual.'
                  : 'Você só pode editar itens de suas próprias requisições enquanto elas estiverem pendentes.'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEditItemPage;