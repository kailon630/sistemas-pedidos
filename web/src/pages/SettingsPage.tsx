import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building, Settings as SettingsIcon, Save, Upload, X, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import settingsApi from '../api/settings';
import type { CompanySettings, SystemSettings, UpdateCompanySettingsData, UpdateSystemSettingsData } from '../types/settings';

const SettingsPage: React.FC = () => {
  // Estados gerais
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'company' | 'system'>('company');

  // Estados da empresa
  const [, setCompanySettings] = useState<CompanySettings | null>(null);
  const [companyForm, setCompanyForm] = useState<UpdateCompanySettingsData>({
    companyName: '',
    cnpj: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });
  const [companySaving, setCompanySaving] = useState(false);
  const [companySuccess, setCompanySuccess] = useState<string | null>(null);

  // Estados do sistema
  const [, setSystemSettings] = useState<SystemSettings | null>(null);
  const [systemForm, setSystemForm] = useState<UpdateSystemSettingsData>({
    minPasswordLength: 6,
    requireUppercase: false,
    requireLowercase: true,
    requireNumbers: false,
    requireSpecialChars: false,
    passwordExpirationDays: 0,
    sessionTimeoutMinutes: 60,
    backupEnabled: false,
    backupFrequency: 'daily',
    backupRetention: 30,
    logRetentionDays: 90,
    auditLogEnabled: true,
  });
  const [systemSaving, setSystemSaving] = useState(false);
  const [systemSuccess, setSystemSuccess] = useState<string | null>(null);

  // ✅ Estados do logo melhorados
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // ✅ Função melhorada de carregamento
  const loadSettings = async () => {
    try {
      setLoading(true);
      const [companyResponse, systemResponse] = await Promise.all([
        settingsApi.getCompanySettings(),
        settingsApi.getSystemSettings(),
      ]);

      setCompanySettings(companyResponse.data);
      setCompanyForm({
        companyName: companyResponse.data.CompanyName,
        cnpj: companyResponse.data.CNPJ,
        address: companyResponse.data.Address,
        phone: companyResponse.data.Phone,
        email: companyResponse.data.Email,
        website: companyResponse.data.Website,
      });

      setSystemSettings(systemResponse.data);
      setSystemForm({
        minPasswordLength: systemResponse.data.MinPasswordLength,
        requireUppercase: systemResponse.data.RequireUppercase,
        requireLowercase: systemResponse.data.RequireLowercase,
        requireNumbers: systemResponse.data.RequireNumbers,
        requireSpecialChars: systemResponse.data.RequireSpecialChars,
        passwordExpirationDays: systemResponse.data.PasswordExpirationDays,
        sessionTimeoutMinutes: systemResponse.data.SessionTimeoutMinutes,
        backupEnabled: systemResponse.data.BackupEnabled,
        backupFrequency: systemResponse.data.BackupFrequency,
        backupRetention: systemResponse.data.BackupRetention,
        logRetentionDays: systemResponse.data.LogRetentionDays,
        auditLogEnabled: systemResponse.data.AuditLogEnabled,
      });

      // ✅ Carregar preview do logo com tratamento de erro
      if (companyResponse.data.LogoPath) {
        const logoUrl = `${settingsApi.getCompanyLogoUrl()}?t=${Date.now()}`;
        setLogoPreview(logoUrl);
        setLogoError(false);
      } else {
        setLogoPreview(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCompanySaving(true);
      setError(null);
      setCompanySuccess(null);

      const response = await settingsApi.updateCompanySettings(companyForm);
      setCompanySettings(response.data);
      setCompanySuccess('Configurações da empresa salvas com sucesso!');
      
      setTimeout(() => setCompanySuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar configurações da empresa');
    } finally {
      setCompanySaving(false);
    }
  };

  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSystemSaving(true);
      setError(null);
      setSystemSuccess(null);

      const response = await settingsApi.updateSystemSettings(systemForm);
      setSystemSettings(response.data);
      setSystemSuccess('Configurações do sistema salvas com sucesso!');
      
      setTimeout(() => setSystemSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar configurações do sistema');
    } finally {
      setSystemSaving(false);
    }
  };

  // ✅ Funções para controle do logo
  const handleLogoError = () => {
    console.warn('Erro ao carregar logo da empresa');
    setLogoError(true);
    setLogoPreview(null);
  };

  // ✅ Função melhorada de upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset estados
    setLogoError(false);

    // ✅ Validações melhoradas no frontend
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 5MB');
      return;
    }

    try {
      setLogoUploading(true);
      setError(null);

      // ✅ Upload melhorado
      await settingsApi.uploadCompanyLogo(file);
      
      // ✅ Preview local imediato
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setLogoError(false);
      };
      reader.readAsDataURL(file);

      // ✅ Recarregar configurações para garantir sincronização
      setTimeout(async () => {
        try {
          const settingsResponse = await settingsApi.getCompanySettings();
          setCompanySettings(settingsResponse.data);
          
          // Forçar reload da URL do logo com timestamp para quebrar cache
          const logoUrl = `${settingsApi.getCompanyLogoUrl()}?t=${Date.now()}`;
          setLogoPreview(logoUrl);
        } catch (err) {
          console.warn('Erro ao recarregar configurações:', err);
        }
      }, 500);

      setCompanySuccess('Logo atualizado com sucesso!');
      setTimeout(() => setCompanySuccess(null), 3000);
      
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setError(err.response?.data?.error || 'Erro ao fazer upload do logo');
      setLogoError(true);
    } finally {
      setLogoUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/"
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft size={20} />
        </Link>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie as configurações da empresa e do sistema
          </p>
        </div>
      </div>

      {/* Mensagens de erro globais */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle size={16} className="mr-2" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('company')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'company'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building size={18} />
                <span>Empresa</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('system')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'system'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <SettingsIcon size={18} />
                <span>Sistema</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Empresa */}
          {activeTab === 'company' && (
            <form onSubmit={handleCompanySubmit} className="space-y-6">
              {companySuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  {companySuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
                  
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      value={companyForm.companyName}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, companyName: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      id="cnpj"
                      value={companyForm.cnpj}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, cnpj: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Endereço
                    </label>
                    <textarea
                      id="address"
                      rows={3}
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Endereço completo..."
                    />
                  </div>
                </div>

                {/* Contato e Logo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Contato e Identidade</h3>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Telefone
                    </label>
                    <input
                      type="text"
                      id="phone"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(00) 0000-0000"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="contato@empresa.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      value={companyForm.website}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, website: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://www.empresa.com"
                    />
                  </div>

                  {/* ✅ Logo Upload Melhorado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo da Empresa
                    </label>
                    
                    <div className="space-y-4">
                      {/* ✅ Preview melhorado com fallback */}
                      {logoPreview && !logoError && (
                        <div className="flex items-center justify-center p-4 border border-gray-300 rounded-md bg-gray-50">
                          <img
                            src={logoPreview}
                            alt="Logo da empresa"
                            className="max-h-20 max-w-40 object-contain"
                            onError={handleLogoError}
                          />
                        </div>
                      )}
                      
                      {/* ✅ Estado de erro */}
                      {logoError && (
                        <div className="flex items-center justify-center p-4 border border-red-300 rounded-md bg-red-50">
                          <div className="text-center text-red-600">
                            <AlertTriangle size={24} className="mx-auto mb-2" />
                            <p className="text-sm">Erro ao carregar logo</p>
                          </div>
                        </div>
                      )}
                      
                      {/* ✅ Upload area melhorada */}
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="logo-upload"
                          className={`flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${
                            logoUploading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center pt-2 pb-3">
                            {logoUploading ? (
                              <>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-gray-500 mt-1">Enviando...</p>
                              </>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 mb-1 text-gray-500" />
                                <p className="text-sm text-gray-500">
                                  Clique para {logoPreview ? 'alterar' : 'enviar'} logo
                                </p>
                              </>
                            )}
                            <p className="text-xs text-gray-500">JPG, PNG, GIF ou WebP (máx. 5MB)</p>
                          </div>
                          <input
                            id="logo-upload"
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleLogoUpload}
                            disabled={logoUploading}
                          />
                        </label>
                      </div>
                    </div>

                    {/* ✅ Informações sobre uso do logo */}
                    <div className="mt-2 text-xs text-gray-600">
                      <p className="font-medium">O logo será exibido em:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Navbar (cabeçalho do sistema)</li>
                        <li>Página de login</li>
                        <li>Relatórios gerados (Excel/PDF)</li>
                        <li>Emails automáticos do sistema</li>
                      </ul>
                      {logoError && (
                        <p className="text-red-600 mt-2">
                          ⚠️ Se o erro persistir, tente recarregar a página ou contacte o suporte.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <button
                  type="submit"
                  disabled={companySaving}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {companySaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Salvar Configurações da Empresa
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab Sistema */}
          {activeTab === 'system' && (
            <form onSubmit={handleSystemSubmit} className="space-y-6">
              {systemSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  {systemSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Política de Senhas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Política de Senhas</h3>
                  
                  <div>
                    <label htmlFor="minPasswordLength" className="block text-sm font-medium text-gray-700">
                      Comprimento Mínimo
                    </label>
                    <input
                      type="number"
                      id="minPasswordLength"
                      min="4"
                      max="50"
                      value={systemForm.minPasswordLength}
                      onChange={(e) => setSystemForm(prev => ({ ...prev, minPasswordLength: parseInt(e.target.value) }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemForm.requireUppercase}
                        onChange={(e) => setSystemForm(prev => ({ ...prev, requireUppercase: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Exigir letras maiúsculas</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemForm.requireLowercase}
                        onChange={(e) => setSystemForm(prev => ({ ...prev, requireLowercase: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Exigir letras minúsculas</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemForm.requireNumbers}
                        onChange={(e) => setSystemForm(prev => ({ ...prev, requireNumbers: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Exigir números</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemForm.requireSpecialChars}
                        onChange={(e) => setSystemForm(prev => ({ ...prev, requireSpecialChars: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Exigir caracteres especiais</span>
                    </label>
                  </div>

                  <div>
                    <label htmlFor="passwordExpirationDays" className="block text-sm font-medium text-gray-700">
                      Expiração da Senha (dias)
                    </label>
                    <input
                      type="number"
                      id="passwordExpirationDays"
                      min="0"
                      value={systemForm.passwordExpirationDays}
                      onChange={(e) => setSystemForm(prev => ({ ...prev, passwordExpirationDays: parseInt(e.target.value) }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">0 = nunca expira</p>
                  </div>

                  <div>
                    <label htmlFor="sessionTimeoutMinutes" className="block text-sm font-medium text-gray-700">
                      Timeout de Sessão (minutos)
                    </label>
                    <input
                      type="number"
                      id="sessionTimeoutMinutes"
                      min="5"
                      max="1440"
                      value={systemForm.sessionTimeoutMinutes}
                      onChange={(e) => setSystemForm(prev => ({ ...prev, sessionTimeoutMinutes: parseInt(e.target.value) }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Backup e Logs */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Backup e Logs</h3>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemForm.backupEnabled}
                        onChange={(e) => setSystemForm(prev => ({ ...prev, backupEnabled: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Backup Automático</span>
                    </label>
                  </div>

                  {systemForm.backupEnabled && (
                    <>
                      <div>
                        <label htmlFor="backupFrequency" className="block text-sm font-medium text-gray-700">
                          Frequência do Backup
                        </label>
                        <select
                          id="backupFrequency"
                          value={systemForm.backupFrequency}
                          onChange={(e) => setSystemForm(prev => ({ ...prev, backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="daily">Diário</option>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensal</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="backupRetention" className="block text-sm font-medium text-gray-700">
                          Retenção de Backup (dias)
                        </label>
                        <input
                          type="number"
                          id="backupRetention"
                          min="1"
                          value={systemForm.backupRetention}
                          onChange={(e) => setSystemForm(prev => ({ ...prev, backupRetention: parseInt(e.target.value) }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemForm.auditLogEnabled}
                        onChange={(e) => setSystemForm(prev => ({ ...prev, auditLogEnabled: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Log de Auditoria</span>
                    </label>
                  </div>

                  <div>
                    <label htmlFor="logRetentionDays" className="block text-sm font-medium text-gray-700">
                      Retenção de Logs (dias)
                    </label>
                    <input
                      type="number"
                      id="logRetentionDays"
                      min="1"
                      value={systemForm.logRetentionDays}
                      onChange={(e) => setSystemForm(prev => ({ ...prev, logRetentionDays: parseInt(e.target.value) }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Importante
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Alterações nas configurações de sistema podem afetar todos os usuários. Backup e logs consomem espaço de armazenamento.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <button
                  type="submit"
                  disabled={systemSaving}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {systemSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Salvar Configurações do Sistema
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;