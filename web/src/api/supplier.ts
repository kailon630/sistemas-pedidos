// src/api/supplier.ts - VERSÃO FINAL LIMPA
import api from './client';

// Interface CORRIGIDA para corresponder ao backend real (camelCase)
export interface Supplier {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  name: string;
  contact: string;
  phone: string;
  email: string;
  observations: string;
}

// Para criar fornecedor (camelCase conforme esperado pelo backend)
export interface CreateSupplierData {
  name: string;
  contact: string;
  phone: string;
  email: string;
  observations: string;
}

// Para atualizar fornecedor (camelCase conforme esperado pelo backend)
export interface UpdateSupplierData {
  name?: string;
  contact?: string;
  phone?: string;
  email?: string;
  observations?: string;
}

// Listar fornecedores
export const getSuppliers = () => 
  api.get<Supplier[]>('/suppliers');

// Buscar fornecedor por ID
export const getSupplier = (id: number) => 
  api.get<Supplier>(`/suppliers/${id}`);

// Criar novo fornecedor
export const createSupplier = (data: CreateSupplierData) => 
  api.post<Supplier>('/suppliers', data);

// Atualizar fornecedor
export const updateSupplier = (id: number, data: UpdateSupplierData) => 
  api.patch<Supplier>(`/suppliers/${id}`, data);

// Deletar fornecedor
export const deleteSupplier = (id: number) => 
  api.delete<void>(`/suppliers/${id}`);