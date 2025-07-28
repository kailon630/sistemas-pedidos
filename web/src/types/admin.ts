// src/types/admin.ts
export interface Product {
  ID: number;
  name: string;
  description: string;
  unit: string;
  sectorId: number;
  sector: {
    ID: number;
    name: string;
  };
  status: 'available' | 'discontinued';
  createdAt: string;
  updatedAt: string;
}

export interface RequestItem {
  ID: number;
  productId: number;
  product: Product;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  deadline?: string;
  adminNotes?: string;
  suspensionReason?: string; // ✅ NOVO CAMPO
  createdAt: string;
  updatedAt: string;
}

export interface User {
  ID: number;
  name: string;
  email: string;
  role: 'admin' | 'requester';
  sectorId: number;
  sector: {
    ID: number;
    name: string;
  };
}

export type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low';

export interface PriorityInfo {
  priority: PriorityLevel;
  priorityBy?: number;
  priorityAt?: string;
  priorityNotes?: string;
}

export interface PurchaseRequest {
  ID: number;
  requesterId: number;
  requester: User;
  sectorId: number;
  sector: {
    ID: number;
    name: string;
  };
  status: 'pending' | 'approved' | 'partial' | 'rejected' | 'completed';
  observations?: string;
  adminNotes?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  completionNotes?: string;
  completedBy?: number;
  completedAt?: string;
  // ✅ NOVOS CAMPOS DE PRIORIDADE
  priority?: PriorityLevel;
  priorityBy?: number;
  priorityAt?: string;
  priorityNotes?: string;
  items: RequestItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SetPriorityData {
  priority: PriorityLevel;
  notes?: string;
}

export interface ReviewRequestData {
  status: 'approved' | 'partial' | 'rejected';
  adminNotes?: string;
}

export interface ReviewItemData {
  status: 'approved' | 'rejected' | 'suspended';
  adminNotes?: string;
  suspensionReason?: string;
}