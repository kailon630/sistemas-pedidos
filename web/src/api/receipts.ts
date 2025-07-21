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

// ✅ CORREÇÃO: Interface ajustada para datas em formato correto
export interface CreateReceiptData {
  quantityReceived: number;
  invoiceNumber: string;
  invoiceDate?: string | null; // ISO string completa ou null
  lotNumber?: string;
  expirationDate?: string | null; // ISO string completa ou null
  supplierId?: number | null;
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

// ✅ FUNÇÃO AUXILIAR: Converter data do input para formato RFC3339
const formatDateForBackend = (dateString: string | null): string | null => {
  if (!dateString || dateString.trim() === '') {
    return null;
  }
  
  try {
    // Se já está no formato ISO completo, retorna como está
    if (dateString.includes('T')) {
      return dateString;
    }
    
    // Se está no formato YYYY-MM-DD (input date), converte para ISO
    const date = new Date(dateString + 'T00:00:00.000Z');
    return date.toISOString();
  } catch (error) {
    console.error('❌ Erro ao formatar data:', dateString, error);
    return null;
  }
};

export const createReceipt = (
  requestId: number,
  itemId: number,
  data: CreateReceiptData
) => {
  // ✅ CORREÇÃO PRINCIPAL: Formatar datas corretamente para o backend
  const cleanData = {
    quantityReceived: Number(data.quantityReceived),
    invoiceNumber: data.invoiceNumber.trim(),
    invoiceDate: formatDateForBackend(data.invoiceDate ?? null), // ✅ Formato RFC3339
    lotNumber: data.lotNumber?.trim() || "",
    expirationDate: formatDateForBackend(data.expirationDate ?? null), // ✅ Formato RFC3339
    supplierId: data.supplierId || null,
    notes: data.notes?.trim() || "",
    receiptCondition: data.receiptCondition || "good",
    qualityChecked: Boolean(data.qualityChecked),
    qualityNotes: data.qualityNotes?.trim() || "",
    rejectedQuantity: Number(data.rejectedQuantity) || 0
  };

  console.log('📤 Dados formatados para backend:', cleanData);
  console.log('📅 Datas formatadas:', {
    invoiceDate: cleanData.invoiceDate,
    expirationDate: cleanData.expirationDate
  });
  
  return api.post<ItemReceipt>(`/requests/${requestId}/items/${itemId}/receipts`, cleanData);
};

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