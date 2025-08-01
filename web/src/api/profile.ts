import api from './client';
import type { UserProfile, UpdateProfileData, ChangePasswordData } from '../types/profile';

export const profileApi = {
  // Buscar dados do perfil
  getProfile: () => 
    api.get<UserProfile>('/profile'),

  // Atualizar informações básicas
  updateProfile: (data: UpdateProfileData) => 
    api.put<UserProfile>('/profile', data),

  // Alterar senha
  changePassword: (data: ChangePasswordData) => 
    api.patch<{ message: string }>('/profile/password', data),
};