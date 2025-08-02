// src/api/requesters.ts - Versão Corrigida
import api from './client';

export interface Requester {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Name: string;
  Email: string;
  Role: 'admin' | 'requester';
  SectorID: number;
  Sector: {
    ID: number;
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt: string | null;
    Name: string;
  };
  stats?: {
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
  };
}

export interface CreateRequesterData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'requester';  // ✅ Agora permite admin também
  sectorId: number;
}

export interface UpdateRequesterData {
  name?: string;
  email?: string;
  password?: string;
  sectorId?: number;
}

export interface CreateRequesterResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  sector: {
    ID: number;
    Name: string;
  };
}

// ✅ FUNÇÕES API ATUALIZADAS - usando /users (como está no backend)
export const getRequesters = () => api.get<Requester[]>('/users');  // Lista todos os usuários
export const getRequester = (id: number) => api.get<Requester>(`/users/${id}`);
export const createRequester = (data: CreateRequesterData) => api.post<CreateRequesterResponse>('/users', data);
export const updateRequester = (id: number, data: UpdateRequesterData) => api.put<Requester>(`/users/${id}`, data);
export const deleteRequester = (id: number) => api.delete<void>(`/users/${id}`);
export const promoteToAdmin = (id: number) => api.patch<Requester>(`/users/${id}/promote`);