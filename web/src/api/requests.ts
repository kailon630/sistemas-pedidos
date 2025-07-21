import type { AxiosResponse } from 'axios'
import api from './client'

// --- Raw interfaces (PascalCase) recebidos do backend ---
export interface RawSector {
  ID: number
  Name: string
  CreatedAt: string
  UpdatedAt: string
}

export interface RawUser {
  ID: number
  Name: string
  Email: string
  Role: string
  SectorID: number
  Sector: RawSector
  CreatedAt: string
  UpdatedAt: string
}

export interface RawProduct {
  ID: number
  Name: string
  Description: string
  Unit: string
  SectorID: number
  Sector: RawSector
  Status: string
  CreatedAt: string
  UpdatedAt: string
}

export interface RawRequestItem {
  ID: number
  ProductID: number
  Product: RawProduct
  Quantity: number
  Status: 'pending' | 'approved' | 'rejected'
  Deadline?: string
  AdminNotes?: string
  CreatedAt: string
  UpdatedAt: string
}

export interface RawPurchaseRequest {
  ID: number
  RequesterID: number
  Requester: RawUser
  SectorID: number
  Sector: RawSector
  Status: 'pending' | 'approved' | 'completed' | 'partial' | 'rejected'
  Observations?: string
  AdminNotes?: string
  ReviewedBy?: number
  ReviewedAt?: string
  Items?: RawRequestItem[]
  CreatedAt: string
  UpdatedAt: string
}

// --- Interfaces camelCase usadas no front-end ---
export interface RequestItem {
  id: number
  productId: number
  product: {
    id: number
    name: string
    description: string
    unit: string
  }
  quantity: number
  status: 'pending' | 'approved' | 'rejected'
  deadline?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseRequest {
  id: number
  requesterId: number
  requester: {
    id: number
    name: string
    email: string
    role: string
  }
  sectorId: number
  sector: {
    id: number
    name: string
  }
  status: 'pending' | 'approved' | 'completed' | 'partial' | 'rejected'
  observations?: string
  adminNotes?: string
  reviewedBy?: number
  reviewedAt?: string
  items: RequestItem[]
  createdAt: string
  updatedAt: string
}

// --- Payloads de criação/atualização ---
export interface CreateRequestData {
  items: Array<{
    productId: number
    quantity: number
    deadline?: string
  }>
  observations?: string
}

export interface UpdateRequestData {
  observations?: string
}

export interface ReviewRequestData {
  status: 'approved' | 'partial' | 'rejected'
  adminNotes?: string
}

export interface ReviewItemData {
  status: 'approved' | 'rejected'
  adminNotes?: string
}

// --- Helpers de normalização ---
function normalizeRequestItem(raw: RawRequestItem): RequestItem {
  return {
    id: raw.ID,
    productId: raw.ProductID,
    product: {
      id: raw.Product.ID,
      name: raw.Product.Name,
      description: raw.Product.Description,
      unit: raw.Product.Unit,
    },
    quantity: raw.Quantity,
    status: raw.Status,
    deadline: raw.Deadline,
    adminNotes: raw.AdminNotes,
    createdAt: raw.CreatedAt,
    updatedAt: raw.UpdatedAt,
  }
}

function normalizePurchaseRequest(raw: RawPurchaseRequest): PurchaseRequest {
  return {
    id: raw.ID,
    requesterId: raw.RequesterID,
    requester: {
      id: raw.Requester.ID,
      name: raw.Requester.Name,
      email: raw.Requester.Email,
      role: raw.Requester.Role,
    },
    sectorId: raw.SectorID,
    sector: {
      id: raw.Sector.ID,
      name: raw.Sector.Name,
    },
    status: raw.Status,
    observations: raw.Observations,
    adminNotes: raw.AdminNotes,
    reviewedBy: raw.ReviewedBy,
    reviewedAt: raw.ReviewedAt,
    items: raw.Items?.map(normalizeRequestItem) ?? [],
    createdAt: raw.CreatedAt,
    updatedAt: raw.UpdatedAt,
  }
}

// --- Endpoints ---

// Listar todas as requisições (filtrado por usuário se não for admin)
export const getPurchaseRequests = async (): Promise<AxiosResponse<PurchaseRequest[]>> => {
  const res = await api.get<RawPurchaseRequest[]>('/requests')
  const data = res.data.map(normalizePurchaseRequest)
  return { ...res, data }
}

// Buscar requisição por ID
export const getPurchaseRequest = async (
  id: number
): Promise<AxiosResponse<PurchaseRequest>> => {
  const res = await api.get<RawPurchaseRequest>(`/requests/${id}`)
  const data = normalizePurchaseRequest(res.data)
  return { ...res, data }
}

// Criar nova requisição
export const createPurchaseRequest = async (
  payload: CreateRequestData
): Promise<AxiosResponse<PurchaseRequest>> => {
  const res = await api.post<RawPurchaseRequest>('/requests', payload)
  const data = normalizePurchaseRequest(res.data)
  return { ...res, data }
}

// Atualizar requisição (usuário pode alterar observações)
export const updatePurchaseRequest = async (
  id: number,
  payload: UpdateRequestData
): Promise<AxiosResponse<PurchaseRequest>> => {
  const res = await api.patch<RawPurchaseRequest>(`/requests/${id}`, payload)
  const data = normalizePurchaseRequest(res.data)
  return { ...res, data }
}

// Admin: Revisar requisição completa
export const reviewRequest = async (
  id: number,
  payload: ReviewRequestData
): Promise<AxiosResponse<PurchaseRequest>> => {
  const res = await api.patch<RawPurchaseRequest>(`/requests/${id}/review`, payload)
  const data = normalizePurchaseRequest(res.data)
  return { ...res, data }
}

// Admin: Revisar item específico
export const reviewRequestItem = async (
  requestId: number,
  itemId: number,
  payload: ReviewItemData
): Promise<AxiosResponse<RequestItem>> => {
  const res = await api.patch<RawRequestItem>(
    `/requests/${requestId}/items/${itemId}/review`,
    payload
  )
  const data = normalizeRequestItem(res.data)
  return { ...res, data }
}

// Listar itens de uma requisição
export const getRequestItems = async (
  requestId: number
): Promise<AxiosResponse<RequestItem[]>> => {
  const res = await api.get<RawRequestItem[]>(`/requests/${requestId}/items`)
  const data = res.data.map(normalizeRequestItem)
  return { ...res, data }
}

// Adicionar item a uma requisição existente
export const addRequestItem = async (
  requestId: number,
  payload: { productId: number; quantity: number; deadline?: string }
): Promise<AxiosResponse<RequestItem>> => {
  const res = await api.post<RawRequestItem>(
    `/requests/${requestId}/items`,
    payload
  )
  const data = normalizeRequestItem(res.data)
  return { ...res, data }
}

// Atualizar item de requisição
export const updateRequestItem = async (
  requestId: number,
  itemId: number,
  payload: { quantity?: number; deadline?: string }
): Promise<AxiosResponse<RequestItem>> => {
  const res = await api.patch<RawRequestItem>(
    `/requests/${requestId}/items/${itemId}`,
    payload
  )
  const data = normalizeRequestItem(res.data)
  return { ...res, data }
}

// Deletar item de requisição
export const deleteRequestItem = (requestId: number, itemId: number) =>
  api.delete<void>(`/requests/${requestId}/items/${itemId}`)
