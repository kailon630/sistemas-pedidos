// src/api/admin.ts
import type { PurchaseRequest, ReviewItemData, ReviewRequestData } from '../types/admin';
import api from './client';

export const getPurchaseRequests = () => 
  api.get<PurchaseRequest[]>('/requests');

export const getPurchaseRequest = (id: number) => 
  api.get<PurchaseRequest>(`/requests/${id}`);

export const reviewRequest = (id: number, data: ReviewRequestData) => 
  api.patch<PurchaseRequest>(`/requests/${id}/review`, data);

export const reviewRequestItem = (requestId: number, itemId: number, data: ReviewItemData) => 
  api.patch<RequestInit>(`/requests/${requestId}/items/${itemId}/review`, data);

export const updateRequest = (id: number, data: Partial<PurchaseRequest>) =>
  api.patch<PurchaseRequest>(`/requests/${id}`, data);

export const completeRequest = (
  id: number,
  completionNotes?: string
) => api.post<PurchaseRequest>(`/requests/${id}/complete`, { completionNotes });

export const reopenRequest = (id: number) =>
  api.post<PurchaseRequest>(`/requests/${id}/reopen`);