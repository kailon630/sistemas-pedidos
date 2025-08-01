// src/types/reports.ts
export interface ReportFiltersData {
  startDate?: string;
  endDate?: string;
  sectorId?: string;
  requesterId?: string;
  status?: string;
  priority?: string;
  includeItems?: boolean;
  page?: string;
  pageSize?: string;
}

export interface RequestsReportSummary {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  completedRequests: number;
  urgentRequests: number;
  averageProcessDays: number;
  totalItems: number;
  mostActiveSector: string;
  mostActiveRequester: string;
}

export interface RequestReportItemDetail {
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  deadline?: string;
}

export interface RequestReportItem {
  id: number;
  requesterName: string;
  requesterEmail: string;
  sectorName: string;
  status: string;
  priority: string;
  createdAt: string;
  reviewedAt?: string;
  completedAt?: string;
  processDays?: number;
  totalItems: number;
  observations: string;
  adminNotes: string;
  items?: RequestReportItemDetail[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  extra?: string;
}

export interface RequestsReportCharts {
  statusDistribution: ChartDataPoint[];
  timelineDays: ChartDataPoint[];
  sectorRanking: ChartDataPoint[];
  priorityBreakdown: ChartDataPoint[];
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface RequestsReportData {
  summary: RequestsReportSummary;
  requests: RequestReportItem[];
  charts: RequestsReportCharts;
  pagination: PaginationInfo;
}

export interface Sector {
  ID: number;
  Name: string;
}

export interface User {
  ID: number;
  Name: string;
  Email: string;
}