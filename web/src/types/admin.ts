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
  status: 'pending' | 'approved' | 'rejected';
  deadline?: string;
  adminNotes?: string;
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

export interface PurchaseRequest {
  ID: number;
  requesterId: number;
  requester: User;
  sectorId: number;
  sector: {
    ID: number;
    name: string;
  };
  status: 'pending' | 'approved' | 'partial' | 'rejected';
  observations?: string;
  adminNotes?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  items: RequestItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRequestData {
  status: 'approved' | 'partial' | 'rejected';
  adminNotes?: string;
}

export interface ReviewItemData {
  status: 'approved' | 'rejected';
  adminNotes?: string;
}