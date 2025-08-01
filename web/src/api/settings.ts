import api from './client';
import type { 
  CompanySettings, 
  SystemSettings, 
  UpdateCompanySettingsData, 
  UpdateSystemSettingsData 
} from '../types/settings';

const settingsApi = {
  // Configurações da empresa
  getCompanySettings: () => 
    api.get<CompanySettings>('/settings/company'),

  updateCompanySettings: (data: UpdateCompanySettingsData) => 
    api.put<CompanySettings>('/settings/company', data),

  uploadCompanyLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post<{ message: string; filename: string; path: string }>('/settings/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getCompanyLogoUrl: () => `${import.meta.env.VITE_API_URL || '/api/v1'}/settings/company/logo`,

  // Configurações do sistema
  getSystemSettings: () => 
    api.get<SystemSettings>('/settings/system'),

  updateSystemSettings: (data: UpdateSystemSettingsData) => 
    api.put<SystemSettings>('/settings/system', data),
};
export default settingsApi
