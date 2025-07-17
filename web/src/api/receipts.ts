// src/api/receipts.ts - API helpers for item receipts
import api from './client';

export interface ItemReceipt {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;

  requestItemId: number;
  quantityReceived: number;
  receivedBy: number;
  receiver?: {
    ID: number;
    Name: string;
  };
  invoiceNumber: string;
  invoiceDate?: string;
  lotNumber?: string;
  expirationDate?: string;
  supplierId?: number;
  supplier?: {
    id: number;
    name: string;
  } | null;
  notes?: string;
  attachmentPath?: string;
  receiptCondition: string;
  qualityChecked: boolean;
  qualityNotes?: string;
  rejectedQuantity: number;
}

export interface CreateReceiptData {
  quantityReceived: number;
  invoiceNumber: string;
  invoiceDate?: string;
  lotNumber?: string;
  expirationDate?: string;
  supplierId?: number;
  notes?: string;
  receiptCondition?: 'good' | 'damaged' | 'partial_damage';
  qualityChecked?: boolean;
  qualityNotes?: string;
  rejectedQuantity?: number;
}

export interface ReceivingStatus {
  itemId: number;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityPending: number;
  status: 'pending' | 'partial' | 'complete' | 'over_delivered';
  lastReceivedAt?: string;
}

export const createReceipt = (
  requestId: number,
  itemId: number,
  data: CreateReceiptData
) => api.post<ItemReceipt>(`/requests/${requestId}/items/${itemId}/receipts`, data);

export const listItemReceipts = (
  requestId: number,
  itemId: number
) => api.get<ItemReceipt[]>(`/requests/${requestId}/items/${itemId}/receipts`);

export const getReceivingStatus = (requestId: number) =>
  api.get<{ summary: { totalItems: number; completeItems: number; partialItems: number; pendingItems: number }; items: ReceivingStatus[] }>(
    `/requests/${requestId}/receipts/status`
  );

export const getRequestReceiptsSummary = (requestId: number) =>
  api.get(`/requests/${requestId}/receipts/summary`);

export const uploadReceiptInvoice = (receiptId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/receipts/${receiptId}/invoice`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadReceiptInvoice = (receiptId: number) =>
  api.get(`/receipts/${receiptId}/invoice`, { responseType: 'blob' });
