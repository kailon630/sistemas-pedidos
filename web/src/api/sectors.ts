// src/api/sectors.ts
import api from './client';

// Interface para corresponder ao backend Go
export interface Sector {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Name: string;
}

// Para criar setor (minúsculas conforme esperado pelo backend)
export interface CreateSectorData {
  name: string;
}

// Para atualizar setor (minúsculas conforme esperado pelo backend)
export interface UpdateSectorData {
  name: string;
}

// Listar setores (GET /sectors)
export const getSectors = () => 
  api.get<Sector[]>('/sectors');

// Buscar setor por ID (GET /sectors/:id)
export const getSector = (id: number) => 
  api.get<Sector>(`/sectors/${id}`);

// Criar novo setor (POST /sectors)
export const createSector = (data: CreateSectorData) => 
  api.post<Sector>('/sectors', data);

// Atualizar setor (PATCH /sectors/:id)
export const updateSector = (id: number, data: UpdateSectorData) => 
  api.patch<Sector>(`/sectors/${id}`, data);

// Deletar setor (DELETE /sectors/:id)
export const deleteSector = (id: number) => 
  api.delete<void>(`/sectors/${id}`);