// src/pages/RequesterFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, Users, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { createRequester, type CreateRequesterData } from '../api/requesters';
import { getSectors, type Sector } from '../api/sectors';

// Interface para o formulário
interface RequesterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  sectorId: number | '';
}

const RequesterFormPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RequesterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    sectorId: ''
  });

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadSectors();
  }, []);

  const loadSectors = async () => {
    try {
      setLoadingSectors(true);
      const response = await getSectors();
      setSectors(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      setSectors([]);
    } finally {
      setLoadingSectors(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email deve ter um formato válido';
    }

    // Senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Senha deve conter ao menos: 1 letra minúscula, 1 maiúscula e 1 número';
    }

    // Confirmação de senha
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    // Setor
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
      
      const createData: CreateRequesterData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        sectorId: Number(formData.sectorId)
      };

      await createRequester(createData);
      alert('Solicitante criado com sucesso!');
      navigate('/requesters');
    } catch (error: any) {
      console.error('Erro ao criar solicitante:', error);
      
      if (error.response?.data?.error) {
        const errorMsg = error.response.data.error;
        if (errorMsg.includes('email') || errorMsg.includes('duplicate')) {
          setErrors({ email: 'Este email já está em uso' });
        } else {
          alert(`Erro: ${errorMsg}`);
        }
      } else {
        alert('Erro ao criar solicitante. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof RequesterFormData, value: string | number) => {
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

    // Validação em tempo real para confirmação de senha
    if (field === 'confirmPassword' || field === 'password') {
      if (field === 'confirmPassword' && formData.password !== value) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Senhas não coincidem' }));
      } else if (field === 'password' && formData.confirmPassword && formData.confirmPassword !== value) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Senhas não coincidem' }));
      } else if (field === 'confirmPassword' && formData.password === value) {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const getPasswordStrength = (password: string): { strength: number; text: string; color: string } => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength === 0) return { strength: 0, text: '', color: '' };
    if (strength <= 2) return { strength, text: 'Fraca', color: 'text-red-600' };
    if (strength <= 3) return { strength, text: 'Média', color: 'text-yellow-600' };
    if (strength <= 4) return { strength, text: 'Forte', color: 'text-green-600' };
    return { strength, text: 'Muito Forte', color: 'text-green-700' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (loadingSectors) {
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
          to="/requesters"
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Solicitante</h1>
          <p className="text-gray-600">
            Cadastre um novo usuário solicitante no sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Informações do Solicitante</h2>
              <p className="text-sm text-gray-600">Preencha os dados do novo usuário</p>
            </div>
          </div>

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
                placeholder="Ex: João Silva, Maria Santos"
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

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
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
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Indicador de força da senha */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${passwordStrength.color}`}>
                      {passwordStrength.text}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formData.password.length}/20
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordStrength.strength <= 2 ? 'bg-red-500' :
                        passwordStrength.strength <= 3 ? 'bg-yellow-500' :
                        passwordStrength.strength <= 4 ? 'bg-green-500' : 'bg-green-600'
                      }`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {errors.password && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.password}
                </div>
              )}
            </div>

            {/* Confirmação de Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-500' : 
                    formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' :
                    'border-gray-300'
                  }`}
                  placeholder="Digite a senha novamente"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.confirmPassword}
                </div>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="flex items-center mt-1 text-sm text-green-600">
                  <AlertCircle size={14} className="mr-1" />
                  Senhas coincidem
                </div>
              )}
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
                {loading ? 'Criando...' : 'Criar Solicitante'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="space-y-4">
        {/* Dicas de Segurança */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-600 mr-3 mt-0.5" size={16} />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Dicas de segurança:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>Use senhas com pelo menos 8 caracteres</li>
                <li>Combine letras maiúsculas, minúsculas e números</li>
                <li>Evite informações pessoais óbvias</li>
                <li>Recomende ao usuário alterar a senha no primeiro acesso</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Informações sobre Solicitantes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Users className="text-blue-600 mr-3 mt-0.5" size={16} />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Sobre solicitantes:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Poderão criar requisições de compra para seu setor</li>
                <li>Terão acesso apenas a produtos de seu setor</li>
                <li>Receberão notificações sobre suas requisições</li>
                <li>Não terão acesso ao painel administrativo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequesterFormPage;