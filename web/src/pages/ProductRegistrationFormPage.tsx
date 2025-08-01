import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { productRegistrationApi } from '../api/productRegistration';
import type { CreateProductRegistrationData, ProductRegistrationRequest } from '../types/productRegistration';

const ProductRegistrationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setExistingRequest] = useState<ProductRegistrationRequest | null>(null);
  
  const [formData, setFormData] = useState<CreateProductRegistrationData>({
    productName: '',
    productDescription: '',
    productUnit: '',
    justification: '',
  });

  // Unidades comuns
  const commonUnits = [
    'unidade', 'peça', 'kg', 'g', 'litro', 'ml', 'metro', 'cm', 
    'caixa', 'pacote', 'rolo', 'folha', 'par'
  ];

  useEffect(() => {
    if (isEditing && id) {
      loadRequest();
    }
  }, [id, isEditing]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await productRegistrationApi.getById(Number(id));
      const request = response.data;
      
      if (request.Status !== 'pending') {
        setError('Apenas solicitações pendentes podem ser editadas');
        return;
      }
      
      setExistingRequest(request);
      setFormData({
        productName: request.ProductName,
        productDescription: request.ProductDescription,
        productUnit: request.ProductUnit,
        justification: request.Justification,
      });
    } catch (err) {
      setError('Erro ao carregar solicitação');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName.trim() || !formData.productUnit.trim() || !formData.justification.trim()) {
      setError('Nome do produto, unidade e justificativa são obrigatórios');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isEditing && id) {
        await productRegistrationApi.update(Number(id), formData);
      } else {
        await productRegistrationApi.create(formData);
      }

      navigate('/product-requests');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar solicitação');
      console.error('Erro:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/product-requests')}
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Solicitação' : 'Nova Solicitação de Produto'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isEditing 
              ? 'Altere os dados da sua solicitação'
              : 'Solicite o cadastro de um novo produto'
            }
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Formulário */}
      <div className="bg-white shadow-sm rounded-lg border">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome do Produto */}
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
              Nome do Produto *
            </label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Papel A4, Caneta esferográfica azul..."
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700">
              Descrição
            </label>
            <textarea
              id="productDescription"
              name="productDescription"
              rows={3}
              value={formData.productDescription}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descreva características específicas do produto..."
            />
          </div>

          {/* Unidade */}
          <div>
            <label htmlFor="productUnit" className="block text-sm font-medium text-gray-700">
              Unidade de Medida *
            </label>
            <div className="mt-1 flex space-x-2">
              <select
                id="productUnit"
                name="productUnit"
                value={formData.productUnit}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione uma unidade</option>
                {commonUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              
              <input
                type="text"
                name="productUnit"
                value={formData.productUnit}
                onChange={handleInputChange}
                placeholder="Ou digite outra"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Selecione da lista ou digite uma unidade personalizada
            </p>
          </div>

          {/* Justificativa */}
          <div>
            <label htmlFor="justification" className="block text-sm font-medium text-gray-700">
              Justificativa *
            </label>
            <textarea
              id="justification"
              name="justification"
              rows={4}
              value={formData.justification}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explique por que precisa deste produto, como será utilizado, qual a necessidade..."
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Detalhe o motivo da solicitação para facilitar a análise
            </p>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/product-requests')}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Solicitação'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductRegistrationFormPage;