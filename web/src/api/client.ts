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

export const getSuppliers = () => api.get<Supplier[]>('/suppliers');
export const getSupplier  = (id: number) => api.get<Supplier>(`/suppliers/${id}`);
export const createSupplier = (data: Omit<Supplier, 'ID'>) => api.post<Supplier>('/suppliers', data);
export const updateSupplier = (id: number, data: Partial<Supplier>) => api.patch<Supplier>(`/suppliers/${id}`, data);
export const deleteSupplier = (id: number) => api.delete<void>(`/suppliers/${id}`);
