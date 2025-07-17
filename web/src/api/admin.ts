// src/api/admin.ts
import type { PurchaseRequest, ReviewItemData, ReviewRequestData } from '../types/admin';
import api from './client';

// Interfaces para dados brutos do backend (PascalCase)
interface RawUser {
  ID: number;
  Name: string;
  Email: string;
  Role: string;
  SectorID: number;
  Sector: {
    ID: number;
    Name: string;
  };
}

interface RawProduct {
  ID: number;
  Name: string;
  Description: string;
  Unit: string;
  SectorID: number;
  Sector: {
    ID: number;
    Name: string;
  };
  Status: string;
}

interface RawRequestItem {
  ID: number;
  ProductID: number;
  Product: RawProduct;
  Quantity: number;
  Status: string;
  Deadline?: string;
  AdminNotes?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

interface RawPurchaseRequest {
  ID: number;
  RequesterID: number;
  Requester: RawUser;
  SectorID: number;
  Sector: {
    ID: number;
    Name: string;
  };
  Status: string;
  Observations?: string;
  AdminNotes?: string;
  ReviewedBy?: number;
  ReviewedAt?: string;
  CompletionNotes?: string;
  CompletedBy?: number;
  CompletedAt?: string;
  Items?: RawRequestItem[];
  CreatedAt: string;
  UpdatedAt: string;
}

// Função auxiliar para normalizar o status
const normalizeStatus = (status: string | undefined): 'available' | 'discontinued' =>
  status === 'discontinued' ? 'discontinued' : 'available';

// Funções de normalização
function normalizeRequestItem(raw: RawRequestItem): PurchaseRequest['items'][0] {
  return {
    ID: raw.ID,
    productId: raw.ProductID,
    product: {
      ID: raw.Product.ID,
      name: raw.Product.Name,
      description: raw.Product.Description,
      unit: raw.Product.Unit,
      sectorId: raw.Product.SectorID,
      sector: {
        ID: raw.Product.Sector.ID,
        name: raw.Product.Sector.Name,
      },
      status: normalizeStatus(raw.Product.Status), // ← Aqui você aplica a função
      createdAt: raw.CreatedAt,
      updatedAt: raw.UpdatedAt,
    },
    quantity: raw.Quantity,
    status: raw.Status as 'pending' | 'approved' | 'rejected',
    deadline: raw.Deadline,
    adminNotes: raw.AdminNotes,
    createdAt: raw.CreatedAt,
    updatedAt: raw.UpdatedAt,
  };
}

function normalizePurchaseRequest(raw: RawPurchaseRequest): PurchaseRequest {
  return {
    ID: raw.ID,
    requesterId: raw.RequesterID,
    requester: {
      ID: raw.Requester.ID,
      name: raw.Requester.Name,
      email: raw.Requester.Email,
      role: raw.Requester.Role as 'admin' | 'requester',
      sectorId: raw.Requester.SectorID,
      sector: {
        ID: raw.Requester.Sector.ID,
        name: raw.Requester.Sector.Name,
      },
    },
    sectorId: raw.SectorID,
    sector: {
      ID: raw.Sector.ID,
      name: raw.Sector.Name,
    },
    status: raw.Status as 'pending' | 'approved' | 'partial' | 'rejected' | 'completed',
    observations: raw.Observations,
    adminNotes: raw.AdminNotes,
    reviewedBy: raw.ReviewedBy,
    reviewedAt: raw.ReviewedAt,
    completionNotes: raw.CompletionNotes,
    completedBy: raw.CompletedBy,
    completedAt: raw.CompletedAt,
    items: raw.Items?.map(normalizeRequestItem) || [],
    createdAt: raw.CreatedAt,
    updatedAt: raw.UpdatedAt,
  };
}

export const getPurchaseRequests = async () => {
  const response = await api.get<RawPurchaseRequest[]>('/requests');
  return {
    ...response,
    data: response.data.map(normalizePurchaseRequest),
  };
};

export const getPurchaseRequest = async (id: number) => {
  const response = await api.get<RawPurchaseRequest>(`/requests/${id}`);
  return {
    ...response,
    data: normalizePurchaseRequest(response.data),
  };
};

export const reviewRequest = async (id: number, data: ReviewRequestData) => {
  const response = await api.patch<RawPurchaseRequest>(`/requests/${id}/review`, data);
  return {
    ...response,
    data: normalizePurchaseRequest(response.data),
  };
};

export const reviewRequestItem = async (requestId: number, itemId: number, data: ReviewItemData) => {
  const response = await api.patch<RawRequestItem>(`/requests/${requestId}/items/${itemId}/review`, data);
  return {
    ...response,
    data: normalizeRequestItem(response.data),
  };
};

export const updateRequest = async (id: number, data: Partial<PurchaseRequest>) => {
  const response = await api.patch<RawPurchaseRequest>(`/requests/${id}`, data);
  return {
    ...response,
    data: normalizePurchaseRequest(response.data),
  };
};

export const completeRequest = async (id: number, completionNotes?: string) => {
  const response = await api.post<RawPurchaseRequest>(`/requests/${id}/complete`, { completionNotes });
  return {
    ...response,
    data: normalizePurchaseRequest(response.data),
  };
};

export const reopenRequest = async (id: number) => {
  const response = await api.post<RawPurchaseRequest>(`/requests/${id}/reopen`);
  return {
    ...response,
    data: normalizePurchaseRequest(response.data),
  };
};