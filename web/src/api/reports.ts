// src/api/reports.ts
import type { User } from '../types/reports';
import type { ReportFiltersData, RequestsReportData, Sector } from '../types/reports';
import api from './client';

export const getRequestsReport = (filters: ReportFiltersData) => {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.sectorId) params.append('sectorId', filters.sectorId);
  if (filters.requesterId) params.append('requesterId', filters.requesterId);
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.includeItems) params.append('includeItems', 'true');
  if (filters.page) params.append('page', filters.page);
  if (filters.pageSize) params.append('pageSize', filters.pageSize);

  return api.get<RequestsReportData>(`/reports/requests?${params.toString()}`);
};

export const exportRequestsReport = (filters: ReportFiltersData) => {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.sectorId) params.append('sectorId', filters.sectorId);
  if (filters.requesterId) params.append('requesterId', filters.requesterId);
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.includeItems) params.append('includeItems', 'true');

  return api.get<Blob>(`/reports/requests/export?${params.toString()}`, {
    responseType: 'blob'
  });
};

export const getSectors = () => api.get<Sector[]>('/sectors');
export const getRequesters = () => api.get<User[]>('/requesters');