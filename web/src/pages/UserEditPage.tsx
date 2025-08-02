// src/pages/UserEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, ArrowLeft, User, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import { getRequester, updateRequester, type UpdateRequesterData, type Requester } from '../api/requesters';
import { getSectors, type Sector } from '../api/sectors';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  sectorId: number | '';
}

const UserEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    sectorId: ''
  });

  const [originalUser, setOriginalUser] = useState<Requester | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (id) {
      loadUserData();
      loadSectors();
    }
  }, [id]);

  const loadUserData = async () => {
    try {
      setLoadingData(true);
      const response = await getRequester(Number(id));
      const userData = response.data;
      
      setOriginalUser(userData);
      setFormData({
        name: userData.Name,
        email: userData.Email,
        password: '',
        sectorId: userData.SectorID
      });
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      alert('Erro ao carregar dados do usuário');
      navigate('/requesters');
    } finally {
      setLoadingData(false);
    }
  };

  const loadSectors = async () => {
    try {
      const response = await getSectors();
      setSectors(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      setSectors([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email deve ter um formato válido';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Nova senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.sectorId) {
      newErrors.sectorId = 'Setor é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !originalUser) return;

    try {
      setLoading(true);
      
      const updateData: UpdateRequesterData = {};
      
      // Apenas enviar campos que foram alterados
      if (formData.name !== originalUser.Name) {
        updateData.name = formData.name.trim();
      }
      
      if (formData.email !== originalUser.Email) {
        updateData.email = formData.email.trim().toLowerCase();
      }
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      if (Number(formData.sectorId) !== originalUser.SectorID) {
        updateData.sectorId = Number(formData.sectorId);
      }

      // Se não há alterações
      if (Object.keys(updateData).length === 0) {
        alert('Nenhuma alteração foi detectada');
        return;
      }

      await updateRequester(Number(id), updateData);
      alert('Usuário atualizado com sucesso!');
      navigate('/requesters');
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      
      if (error.response?.data?.error) {
        const errorMsg = error.response.data.error;
        if (errorMsg.includes('email')) {
          setErrors({ email: 'Este email já está em uso' });
        } else {
          alert(`Erro: ${errorMsg}`);
        }
      } else {
        alert('Erro ao atualizar usuário. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UserFormData, value: string | number) => {
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

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!originalUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/requesters"
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Usuário</h1>
          <p className="text-gray-600">
            Edite os dados de {originalUser.Name}
          </p>
        </div>
      </div>

      {/* Current User Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${originalUser.Role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
            {originalUser.Role === 'admin' ? (
              <Shield className={`h-6 w-6 text-purple-600`} />
            ) : (
              <User className={`h-6 w-6 text-blue-600`} />
            )}
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">{originalUser.Name}</p>
            <p className="text-sm text-gray-500">
              {originalUser.Role === 'admin' ? 'Administrador' : 'Solicitante'} • {originalUser.Sector.Name}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nome completo do usuário"
              />
              {errors.name && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.name}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="usuario@empresa.com"
              />
              {errors.email && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.email}
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
                onChange={(e) => handleChange('sectorId', Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sectorId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o setor</option>
                {sectors.map(sector => (
                  <option key={sector.ID} value={sector.ID}>{sector.Name}</option>
                ))}
              </select>
              {errors.sectorId && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.sectorId}
                </div>
              )}
            </div>

            {/* Nova Senha (Opcional) */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha (deixe em branco para manter a atual)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Deixe em branco para manter a senha atual"
                />
                {formData.password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
              {errors.password && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.password}
                </div>
              )}
            </div>

            {/* Role Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="text-yellow-600 mr-3 mt-0.5" size={16} />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Sobre o papel (role):</p>
                  <p className="text-yellow-700">
                    Este usuário é atualmente um <strong>{originalUser.Role === 'admin' ? 'Administrador' : 'Solicitante'}</strong>. 
                    Para alterar o papel, use a função de promoção na lista de usuários.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/requesters')}
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
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserEditPage;