// src/api/requesters.ts
import api from './client';

// Interface para corresponder ao backend Go (User com role "requester")
export interface Requester {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Name: string;
  Email: string;
  Role: string; // sempre "requester"
  SectorID: number;
  Sector: {
    ID: number;
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt: string | null;
    Name: string;
  };
}

// Para criar solicitante (minúsculas conforme esperado pelo backend)
export interface CreateRequesterData {
  name: string;
  email: string;
  password: string;
  sectorId: number;
}

// Resposta da criação (backend remove senha e retorna dados básicos)
export interface CreateRequesterResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  sector: {
    ID: number;
    Name: string;
  };
}

// Listar solicitantes (GET /requesters) - retorna apenas users com role "requester"
export const getRequesters = () => 
  api.get<Requester[]>('/requesters');

// Buscar solicitante por ID (GET /requesters/:id)
export const getRequester = (id: number) => 
  api.get<Requester>(`/requesters/${id}`);

// Criar novo solicitante (POST /requesters)
export const createRequester = (data: CreateRequesterData) => 
  api.post<CreateRequesterResponse>('/requesters', data);

