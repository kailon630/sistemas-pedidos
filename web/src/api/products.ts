// src/api/products.ts - CORRIGIDO para corresponder ao backend Go
import api from './client';

export interface Product {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Name: string;        // ← CORRIGIDO: maiúsculo
  Description: string; // ← CORRIGIDO: maiúsculo
  Unit: string;        // ← CORRIGIDO: maiúsculo
  SectorID: number;    // ← CORRIGIDO: maiúsculo + ID
  Sector: {            // ← CORRIGIDO: maiúsculo
    ID: number;
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt: string | null;
    Name: string;      // ← CORRIGIDO: maiúsculo
  };
  Status: 'available' | 'discontinued'; // ← CORRIGIDO: maiúsculo
}

export interface CreateProductData {
  name: string;
  description?: string;
  unit: string;
  sectorId: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  unit?: string;
  status?: 'available' | 'discontinued';
}

// Listar produtos (filtrado por setor se não for admin)
export const getProducts = () => 
  api.get<Product[]>('/products');

// Buscar produto por ID
export const getProduct = (id: number) => 
  api.get<Product>(`/products/${id}`);

// Criar novo produto
export const createProduct = (data: CreateProductData) => 
  api.post<Product>('/products', data);

// Atualizar produto
export const updateProduct = (id: number, data: UpdateProductData) => 
  api.patch<Product>(`/products/${id}`, data);

// Deletar produto
export const deleteProduct = (id: number) => 
  api.delete<void>(`/products/${id}`);

// Listar setores (para formulário)
export const getSectors = () => 
  api.get<Array<{ID: number; Name: string}>>('/sectors'); // ← CORRIGIDO: Name maiúsculo