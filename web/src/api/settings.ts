// src/api/settings.ts - Versão melhorada
import api from './client';
import type { 
  CompanySettings, 
  SystemSettings, 
  UpdateCompanySettingsData, 
  UpdateSystemSettingsData 
} from '../types/settings';

interface UploadResponse {
  message: string;
  filename: string;
  originalName: string;
  size: number;
  url: string;
  settings: CompanySettings;
}

const settingsApi = {
  // ✅ Configurações da empresa
  getCompanySettings: () => 
    api.get<CompanySettings>('/settings/company'),

  updateCompanySettings: (data: UpdateCompanySettingsData) => 
    api.put<CompanySettings>('/settings/company', data),

  // ✅ Upload de logo melhorado
  uploadCompanyLogo: async (file: File): Promise<{ data: UploadResponse }> => {
    // Validações no frontend antes de enviar
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Arquivo muito grande. Máximo 5MB');
    }

    const formData = new FormData();
    formData.append('logo', file);
    
    return api.post<UploadResponse>('/settings/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 segundos para upload
    });
  },

  // ✅ URL do logo com cache busting
  getCompanyLogoUrl: (cacheBust: boolean = false) => {
    const baseUrl = `${import.meta.env.VITE_API_URL || '/api/v1'}/settings/company/logo`;
    return cacheBust ? `${baseUrl}?t=${Date.now()}` : baseUrl;
  },

  // ✅ Verificar se logo existe
  checkLogoExists: async (): Promise<boolean> => {
    try {
      const response = await fetch(settingsApi.getCompanyLogoUrl(), {
        method: 'HEAD', // Só verifica headers, não baixa o arquivo
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // ✅ Configurações do sistema
  getSystemSettings: () => 
    api.get<SystemSettings>('/settings/system'),

  updateSystemSettings: (data: UpdateSystemSettingsData) => 
    api.put<SystemSettings>('/settings/system', data),

  // ✅ Validar configurações antes de enviar
  validateCompanySettings: (data: UpdateCompanySettingsData): string[] => {
    const errors: string[] = [];
    
    if (!data.companyName.trim()) {
      errors.push('Nome da empresa é obrigatório');
    }
    
    if (data.cnpj && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(data.cnpj)) {
      errors.push('CNPJ deve estar no formato 00.000.000/0000-00');
    }
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email deve ter um formato válido');
    }
    
    if (data.website && !/^https?:\/\/.+/.test(data.website)) {
      errors.push('Website deve começar com http:// ou https://');
    }
    
    return errors;
  },

  validateSystemSettings: (data: UpdateSystemSettingsData): string[] => {
    const errors: string[] = [];
    
    if (data.minPasswordLength < 4 || data.minPasswordLength > 50) {
      errors.push('Comprimento mínimo da senha deve estar entre 4 e 50 caracteres');
    }
    
    if (data.sessionTimeoutMinutes < 5 || data.sessionTimeoutMinutes > 1440) {
      errors.push('Timeout de sessão deve estar entre 5 e 1440 minutos');
    }
    
    if (data.backupEnabled && data.backupRetention < 1) {
      errors.push('Retenção de backup deve ser pelo menos 1 dia');
    }
    
    if (data.logRetentionDays < 1) {
      errors.push('Retenção de logs deve ser pelo menos 1 dia');
    }
    
    return errors;
  },

  // ✅ Reset para configurações padrão
  resetToDefaults: {
    company: (): UpdateCompanySettingsData => ({
      companyName: 'PedidoCompras',
      cnpj: '',
      address: '',
      phone: '',
      email: '',
      website: '',
    }),
    
    system: (): UpdateSystemSettingsData => ({
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
    }),
  },
};

export default settingsApi;