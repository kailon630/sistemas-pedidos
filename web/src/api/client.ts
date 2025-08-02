// src/api/client.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token && config.headers) config.headers['Authorization'] = `Bearer ${token}`
  return config
})
export default api


export interface Supplier {
  ID: number;
  Name: string;
  Contact?: string;
  Phone?: string;
  Email?: string;
  Notes?: string;
}

export interface User {
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
    Name: string;
  };
  stats?: {
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
  };
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'requester';
  sectorId?: number;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'requester';
  sectorId: number;
}

// Novos endpoints para usuários
export const getUser = (id: number) => api.get<User>(`/users/${id}`);
export const updateUser = (id: number, data: UpdateUserData) => api.put<User>(`/users/${id}`, data);
export const deleteUser = (id: number) => api.delete<void>(`/users/${id}`);
export const promoteToAdmin = (id: number) => api.patch<User>(`/users/${id}/promote`);

export const getSuppliers = () => api.get<Supplier[]>('/suppliers');
export const getSupplier  = (id: number) => api.get<Supplier>(`/suppliers/${id}`);
export const createSupplier = (data: Omit<Supplier, 'ID'>) => api.post<Supplier>('/suppliers', data);
export const updateSupplier = (id: number, data: Partial<Supplier>) => api.patch<Supplier>(`/suppliers/${id}`, data);
export const deleteSupplier = (id: number) => api.delete<void>(`/suppliers/${id}`);
