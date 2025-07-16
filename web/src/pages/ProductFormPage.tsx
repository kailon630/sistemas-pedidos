// src/pages/ProductFormPage.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, ArrowLeft, Package, AlertCircle } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { getSectors, getProduct, createProduct, updateProduct, type CreateProductData, type UpdateProductData } from '../api/products';

interface Sector {
  ID: number;
  Name: string; // ← CORRIGIDO: maiúsculo para corresponder ao backend Go
}

interface ProductFormData {
  name: string;
  description: string;
  unit: string;
  sectorId: number | '';
  status: 'available' | 'discontinued';
}

const ProductFormPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    unit: '',
    sectorId: user?.role === 'admin' ? '' : user?.sectorId || '',
    status: 'available'
  });

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Opções de unidades comuns
  const unitOptions = [
    'unidade', 'peça', 'kg', 'g', 'litro', 'ml', 'metro', 'cm', 
    'resma', 'caixa', 'pacote', 'cartucho', 'galão', 'rolo'
  ];

  useEffect(() => {
    loadSectors();
    if (isEditing) {
      loadProduct();
    }
  }, [id]);

  const loadSectors = async () => {
    try {
      const response = await getSectors();
      setSectors(response.data);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const loadProduct = async () => {
    try {
      setLoadingData(true);
      const response = await getProduct(Number(id));
      const product = response.data;
      
      setFormData({
        name: product.Name,        // ← CORRIGIDO: maiúsculo
        description: product.Description, // ← CORRIGIDO: maiúsculo
        unit: product.Unit,        // ← CORRIGIDO: maiúsculo
        sectorId: product.SectorID, // ← CORRIGIDO: maiúsculo + ID
        status: product.Status     // ← CORRIGIDO: maiúsculo
      });
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert('Erro ao carregar dados do produto');
      navigate('/products');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unidade é obrigatória';
    }

    if (!formData.sectorId) {
      newErrors.sectorId = 'Setor é obrigatório';
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
      
      if (isEditing) {
        const updateData: UpdateProductData = {
          name: formData.name,
          description: formData.description,
          unit: formData.unit,
          status: formData.status
        };
        await updateProduct(Number(id), updateData);
        alert('Produto atualizado com sucesso!');
      } else {
        const createData: CreateProductData = {
          name: formData.name,
          description: formData.description,
          unit: formData.unit,
          sectorId: Number(formData.sectorId)
        };
        await createProduct(createData);
        alert('Produto criado com sucesso!');
      }
      
      navigate('/products');
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      
      if (error.response?.data?.error) {
        alert(`Erro: ${error.response.data.error}`);
      } else {
        alert('Erro ao salvar produto. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Remove erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/products"
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Atualize as informações do produto' : 'Adicione um novo produto ao catálogo'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Informações do Produto</h2>
              <p className="text-sm text-gray-600">Preencha os dados básicos do produto</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Papel A4, Caneta Azul, Monitor 24"
              />
              {errors.name && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.name}
                </div>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descreva as características do produto..."
              />
            </div>

            {/* Unidade */}
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                Unidade de Medida *
              </label>
              <div className="relative">
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.unit ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione a unidade</option>
                  {unitOptions.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              {errors.unit && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.unit}
                </div>
              )}
            </div>

            {/* Setor */}
            <div>
              <label htmlFor="sectorId" className="block text-sm font-medium text-gray-700 mb-2">
                Setor *
              </label>
              <select
                id="sectorId"
                value={formData.sectorId}
                onChange={(e) => handleChange('sectorId', e.target.value)}
                disabled={user?.role !== 'admin'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sectorId ? 'border-red-500' : 'border-gray-300'
                } ${user?.role !== 'admin' ? 'bg-gray-100' : ''}`}
              >
                <option value="">Selecione o setor</option>
                {sectors.map(sector => (
                  <option key={sector.ID} value={sector.ID}>{sector.Name}</option>
                ))}
              </select>
              {user?.role !== 'admin' && (
                <p className="mt-1 text-sm text-gray-500">
                  Produtos serão criados para seu setor atual
                </p>
              )}
              {errors.sectorId && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.sectorId}
                </div>
              )}
            </div>

            {/* Status - apenas para admin em edição */}
            {isEditing && user?.role === 'admin' && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="available"
                      checked={formData.status === 'available'}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Disponível</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="discontinued"
                      checked={formData.status === 'discontinued'}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Descontinuado</span>
                  </label>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Produto')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="text-blue-600 mr-3 mt-0.5" size={16} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Dicas para cadastro de produtos:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Use nomes descritivos e padronizados</li>
              <li>Selecione a unidade de medida correta</li>
              <li>Adicione descrições detalhadas quando necessário</li>
              {user?.role !== 'admin' && (
                <li>Produtos serão automaticamente vinculados ao seu setor</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormPage;