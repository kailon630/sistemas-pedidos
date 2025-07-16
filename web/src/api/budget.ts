// src/api/budget.ts - CORRIGIDO com Supplier em camelCase
import api from './client';

// ✅ Interface CORRIGIDA para corresponder ao backend Go
export interface ItemBudget {
  // Campos principais do GORM (PascalCase - padrão GORM)
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  
  // ✅ Campos customizados (camelCase - conforme json tags do Go)
  purchaseRequestId: number;
  requestItemId: number;
  supplierId: number;
  unitPrice: number;
  
  // Relacionamentos (quando preload)
  PurchaseRequest?: {
    ID: number;
    CreatedAt: string;
    Status: string;
    Observations: string;
  };
  
  RequestItem?: {
    ID: number;
    ProductID: number;
    Quantity: number;
    Status: string;
    Product: {
      ID: number;
      Name: string;
      Description: string;
      Unit: string;
    };
  };

  // ✅ CORRIGIDO: Supplier vem em camelCase (conforme debug)
  Supplier?: {
    id: number;           // camelCase
    createdAt: string;    // camelCase
    updatedAt: string;    // camelCase
    deletedAt: string | null; // camelCase
    name: string;         // camelCase
    contact: string;      // camelCase
    phone: string;        // camelCase
    email: string;        // camelCase
    observations: string; // camelCase
  };
}

// Para criar orçamento (minúsculas conforme backend)
export interface CreateItemBudgetData {
  supplierId: number;
  unitPrice: number;
}

// Para atualizar orçamento (apenas preço)
export interface UpdateBudgetData {
  unitPrice: number;
}

// Criar orçamento para um item específico
export const createItemBudget = (requestId: number, itemId: number, data: CreateItemBudgetData) => 
  api.post<ItemBudget>(`/requests/${requestId}/items/${itemId}/budgets`, data);

// Listar todos os orçamentos de uma requisição
export const getRequestBudgets = (requestId: number) => 
  api.get<ItemBudget[]>(`/requests/${requestId}/budgets`);

// Atualizar preço de um orçamento
export const updateBudget = (budgetId: number, data: UpdateBudgetData) => 
  api.patch<ItemBudget>(`/budgets/${budgetId}`, data);

// Deletar orçamento
export const deleteBudget = (budgetId: number) => 
  api.delete<void>(`/budgets/${budgetId}`);

// Buscar orçamento específico
export const getBudget = (budgetId: number) => 
  api.get<ItemBudget>(`/budgets/${budgetId}`);