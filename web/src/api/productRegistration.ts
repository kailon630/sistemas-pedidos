import api from './client';
import type { 
  ProductRegistrationRequest, 
  CreateProductRegistrationData, 
  ProcessProductRegistrationData,
  ProductRegistrationStats 
} from '../types/productRegistration';

export const productRegistrationApi = {
  // Listar solicitações (admin vê todas, usuário vê suas)
  list: (status?: string) => {
    const params = status ? { status } : {};
    return api.get<ProductRegistrationRequest[]>('/product-requests', { params });
  },

  // Criar nova solicitação (usuário comum)
  create: (data: CreateProductRegistrationData) => 
    api.post<ProductRegistrationRequest>('/product-requests', data),

  // Buscar solicitação por ID
  getById: (id: number) => 
    api.get<ProductRegistrationRequest>(`/product-requests/${id}`),

  // Atualizar solicitação (apenas pendentes)
  update: (id: number, data: CreateProductRegistrationData) => 
    api.patch<ProductRegistrationRequest>(`/product-requests/${id}`, data),

  // Deletar solicitação (apenas pendentes)
  delete: (id: number) => 
    api.delete<void>(`/product-requests/${id}`),

  // Processar solicitação (admin aprova/rejeita)
  process: (id: number, data: ProcessProductRegistrationData) => 
    api.patch<ProductRegistrationRequest>(`/product-requests/${id}/process`, data),

  // Estatísticas (apenas admin)
  getStats: () => 
    api.get<ProductRegistrationStats>('/product-requests/stats'),
};