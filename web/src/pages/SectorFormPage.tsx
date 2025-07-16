// src/pages/SectorFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, ArrowLeft, Building, AlertCircle } from 'lucide-react';
import api from '../api/client';

// Interface para o formulário
interface SectorFormData {
  name: string;
}

// Interface para corresponder ao backend Go
interface Sector {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Name: string;
}

// Interface para criação (minúscula conforme backend)
interface CreateSectorData {
  name: string;
}

// Interface para atualização (minúscula conforme backend)
interface UpdateSectorData {
  name: string;
}

const SectorFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState<SectorFormData>({
    name: ''
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing) {
      loadSector();
    }
  }, [id]);

  const loadSector = async () => {
    try {
      setLoadingData(true);
      const response = await api.get<Sector>(`/sectors/${id}`);
      const sector = response.data;
      
      setFormData({
        name: sector.Name || ''
      });
    } catch (error) {
      console.error('Erro ao carregar setor:', error);
      alert('Erro ao carregar dados do setor');
      navigate('/sectors');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do setor é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres';
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
        const updateData: UpdateSectorData = {
          name: formData.name.trim()
        };
        await api.patch(`/sectors/${id}`, updateData);
        alert('Setor atualizado com sucesso!');
      } else {
        const createData: CreateSectorData = {
          name: formData.name.trim()
        };
        await api.post('/sectors', createData);
        alert('Setor criado com sucesso!');
      }
      
      navigate('/sectors');
    } catch (error: any) {
      console.error('Erro ao salvar setor:', error);
      
      if (error.response?.data?.error) {
        alert(`Erro: ${error.response.data.error}`);
      } else if (error.response?.status === 500) {
        alert('Erro: Este nome de setor já existe. Escolha um nome diferente.');
      } else {
        alert('Erro ao salvar setor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value
    }));
    
    // Remove erro quando usuário começa a digitar
    if (errors.name) {
      setErrors(prev => ({
        ...prev,
        name: ''
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
          to="/sectors"
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Setor' : 'Novo Setor'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Atualize as informações do setor' : 'Adicione um novo setor à organização'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Informações do Setor</h2>
              <p className="text-sm text-gray-600">Defina o nome do setor</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome do Setor */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Setor *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Recursos Humanos, Tecnologia da Informação, Financeiro"
                maxLength={100}
              />
              {errors.name && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.name}
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.name.length}/100 caracteres
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/sectors')}
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
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Setor')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="space-y-4">
        {/* Dicas */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="text-blue-600 mr-3 mt-0.5" size={16} />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Dicas para nomeação de setores:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Use nomes descritivos e padronizados</li>
                <li>Evite abreviações que possam gerar confusão</li>
                <li>Mantenha consistência na nomenclatura</li>
                <li>Considere a hierarquia organizacional</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Exemplos */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-800">
            <p className="font-medium mb-2">Exemplos de nomes de setores:</p>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <span>• Recursos Humanos</span>
              <span>• Tecnologia da Informação</span>
              <span>• Financeiro</span>
              <span>• Marketing</span>
              <span>• Operações</span>
              <span>• Vendas</span>
              <span>• Jurídico</span>
              <span>• Compras</span>
            </div>
          </div>
        </div>

        {/* Aviso sobre exclusão */}
        {isEditing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="text-yellow-600 mr-3 mt-0.5" size={16} />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">⚠️ Atenção:</p>
                <p>
                  Este setor pode ter usuários e produtos vinculados. 
                  Alterações no nome serão refletidas em todo o sistema.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectorFormPage;