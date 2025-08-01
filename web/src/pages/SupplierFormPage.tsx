import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, ArrowLeft, Truck, AlertCircle, FileText } from 'lucide-react';
import { getSupplier, createSupplier, updateSupplier } from '../api/supplier';
import { formatCNPJ, isValidCNPJ } from '../utils/cnpjUtils';

// Interface para o formulário com CNPJ
interface SupplierFormData {
  name: string;
  cnpj: string;        // ✅ NOVO CAMPO
  contact: string;
  phone: string;
  email: string;
  observations: string;
}

// Interfaces para API calls
interface CreateSupplierData {
  name: string;
  cnpj: string;        // ✅ NOVO CAMPO
  contact: string;
  phone: string;
  email: string;
  observations: string;
}

interface UpdateSupplierData {
  name?: string;
  cnpj?: string;       // ✅ NOVO CAMPO
  contact?: string;
  phone?: string;
  email?: string;
  observations?: string;
}

const SupplierFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    cnpj: '',           // ✅ NOVO CAMPO
    contact: '',
    phone: '',
    email: '',
    observations: ''
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing) {
      loadSupplier();
    }
  }, [id]);

  const loadSupplier = async () => {
    try {
      setLoadingData(true);
      const response = await getSupplier(Number(id));
      const supplier = response.data;
      
      setFormData({
        name: supplier.name || '',
        cnpj: supplier.cnpj || '',        // ✅ CARREGAR CNPJ
        contact: supplier.contact || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        observations: supplier.observations || ''
      });
    } catch (error) {
      console.error('Erro ao carregar fornecedor:', error);
      alert('Erro ao carregar dados do fornecedor');
      navigate('/suppliers');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Nome obrigatório
    if (!formData.name.trim()) {
      newErrors.name = 'Nome da empresa é obrigatório';
    }

    // Contato obrigatório
    if (!formData.contact.trim()) {
      newErrors.contact = 'Nome do contato é obrigatório';
    }

    // ✅ VALIDAÇÃO DE CNPJ
    if (formData.cnpj.trim()) {
      if (!isValidCNPJ(formData.cnpj)) {
        newErrors.cnpj = 'CNPJ inválido';
      }
    }

    // Validação de email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email deve ter um formato válido';
    }

    // Validação de telefone
    if (formData.phone && !/^[\d\s\-\(\)\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Telefone deve conter apenas números e caracteres válidos';
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
        const updateData: UpdateSupplierData = {
          name: formData.name.trim(),
          cnpj: formData.cnpj.trim(),         // ✅ INCLUIR CNPJ
          contact: formData.contact.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          observations: formData.observations.trim()
        };
        await updateSupplier(Number(id), updateData);
        alert('Fornecedor atualizado com sucesso!');
      } else {
        const createData: CreateSupplierData = {
          name: formData.name.trim(),
          cnpj: formData.cnpj.trim(),         // ✅ INCLUIR CNPJ
          contact: formData.contact.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          observations: formData.observations.trim()
        };
        await createSupplier(createData);
        alert('Fornecedor criado com sucesso!');
      }
      
      navigate('/suppliers');
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor:', error);
      
      if (error.response?.data?.error) {
        alert(`Erro: ${error.response.data.error}`);
      } else {
        alert('Erro ao salvar fornecedor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SupplierFormData, value: string) => {
    // ✅ FORMATAÇÃO AUTOMÁTICA DO CNPJ
    if (field === 'cnpj') {
      value = formatCNPJ(value);
    }
    
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
          to="/suppliers"
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Atualize as informações do fornecedor' : 'Adicione um novo fornecedor ao sistema'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Informações do Fornecedor</h2>
              <p className="text-sm text-gray-600">Preencha os dados do fornecedor</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome da Empresa */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Empresa *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Empresa ABC Ltda, Distribuidora XYZ"
              />
              {errors.name && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.name}
                </div>
              )}
            </div>

            {/* ✅ CAMPO CNPJ */}
            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                CNPJ
              </label>
              <input
                type="text"
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cnpj ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="00.000.000/0000-00"
                maxLength={18} // Comprimento máximo com formatação
              />
              {errors.cnpj && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.cnpj}
                </div>
              )}
              {formData.cnpj && !errors.cnpj && isValidCNPJ(formData.cnpj) && (
                <div className="flex items-center mt-1 text-sm text-green-600">
                  <FileText size={14} className="mr-1" />
                  CNPJ válido
                </div>
              )}
            </div>

            {/* Nome do Contato */}
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Contato *
              </label>
              <input
                type="text"
                id="contact"
                value={formData.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contact ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: João Silva, Maria Santos"
              />
              {errors.contact && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.contact}
                </div>
              )}
            </div>

            {/* Email e Telefone - Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="contato@empresa.com"
                />
                {errors.email && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="(11) 99999-9999"
                />
                {errors.phone && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Observações */}
            <div>
              <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => handleChange('observations', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Informações adicionais sobre o fornecedor, condições comerciais, especialidades..."
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/suppliers')}
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
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Fornecedor')}
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
            <p className="font-medium mb-1">Dicas para cadastro de fornecedores:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Use o nome oficial da empresa</li>
              <li>O CNPJ é opcional, mas recomendado para pessoa jurídica</li>
              <li>Adicione um contato principal para facilitar a comunicação</li>
              <li>Inclua informações relevantes nas observações</li>
              <li>Mantenha os dados sempre atualizados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierFormPage;