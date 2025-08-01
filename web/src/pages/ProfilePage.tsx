import React, { useState, useEffect, useContext } from 'react';
import { ArrowLeft, User, Lock, Save, Eye, EyeOff, Shield, Mail, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { profileApi } from '../api/profile';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { validatePassword } from '../utils/passwordValidation';
import type { UserProfile, UpdateProfileData, ChangePasswordData } from '../types/profile';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useContext(AuthContext);
  
  // Estados gerais
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados do formulário de perfil
  const [profileForm, setProfileForm] = useState<UpdateProfileData>({
    name: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Estados do formulário de senha
  const [passwordForm, setPasswordForm] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Validação de senha
  const passwordValidation = validatePassword(passwordForm.newPassword);

  // Carregar dados do perfil
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileApi.getProfile();
      setProfile(response.data);
      setProfileForm({ name: response.data.Name });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar perfil
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileForm.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    try {
      setProfileSaving(true);
      setError(null);
      setProfileSuccess(null);

      const response = await profileApi.updateProfile(profileForm);
      setProfile(response.data);
      setProfileSuccess('Perfil atualizado com sucesso!');

      // Atualizar contexto de autenticação se necessário
      if (updateUser) {
        updateUser({ ...user!, name: response.data.Name });
      }

      // Limpar mensagem após 3 segundos
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setProfileSaving(false);
    }
  };

  // Alterar senha
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!passwordForm.currentPassword) {
      setError('Senha atual é obrigatória');
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Nova senha não atende aos critérios de segurança');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Nova senha e confirmação não coincidem');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError('Nova senha deve ser diferente da atual');
      return;
    }

    try {
      setPasswordSaving(true);
      setError(null);
      setPasswordSuccess(null);

      await profileApi.changePassword(passwordForm);
      
      // Limpar formulário
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setPasswordSuccess('Senha alterada com sucesso!');

      // Limpar mensagem após 3 segundos
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setPasswordSaving(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Erro ao carregar perfil
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Tente recarregar a página ou faça login novamente.
        </p>
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
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie suas informações pessoais e configurações de segurança
          </p>
        </div>
      </div>

      {/* Mensagens de erro/sucesso globais */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Usuário (Sidebar) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Informações da Conta
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                  profile.Role === 'admin' ? 'bg-red-500' : 'bg-blue-500'
                }`}>
                  {profile.Role === 'admin' ? (
                    <Shield size={32} />
                  ) : (
                    <User size={32} />
                  )}
                </div>
              </div>

              {/* Nome */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">{profile.Name}</h3>
                <p className="text-sm text-gray-500 capitalize">
                  {profile.Role === 'admin' ? 'Administrador' : 'Solicitante'}
                </p>
              </div>

              {/* Informações */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-3">
                  <Mail size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{profile.Email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Building size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Setor</p>
                    <p className="text-sm text-gray-600">{profile.Sector.Name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Membro desde</p>
                    <p className="text-sm text-gray-600">
                      {new Date(profile.CreatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulários */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Pessoais */}
          <div className="bg-white shadow-sm rounded-lg border">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-2">
              <User size={20} className="text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Informações Pessoais
              </h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="px-6 py-4 space-y-4">
              {profileSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  {profileSuccess}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>

              {/* Campos não editáveis */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.Email}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  O email não pode ser alterado. Entre em contato com o administrador se necessário.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Setor
                </label>
                <input
                  type="text"
                  value={profile.Sector.Name}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  O setor é definido pelo administrador do sistema.
                </p>
              </div>

              <div className="pt-4 border-t">
                <button
                  type="submit"
                  disabled={profileSaving || profileForm.name === profile.Name}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Alterar Senha */}
          <div className="bg-white shadow-sm rounded-lg border">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-2">
              <Lock size={20} className="text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Alterar Senha
              </h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="px-6 py-4 space-y-4">
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Senha Atual
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite sua senha atual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nova Senha
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite a nova senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                <PasswordStrengthIndicator 
                  validation={passwordValidation} 
                  password={passwordForm.newPassword} 
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Nova Senha
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="Confirme a nova senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">As senhas não coincidem</p>
                )}
              </div>

              <div className="pt-4 border-t">
                <button
                  type="submit"
                  disabled={
                    passwordSaving || 
                    !passwordValidation.isValid || 
                    passwordForm.newPassword !== passwordForm.confirmPassword ||
                    !passwordForm.currentPassword
                  }
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="mr-2" />
                      Alterar Senha
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;