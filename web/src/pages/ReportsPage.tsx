// src/pages/ReportsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, AlertCircle } from 'lucide-react';

// Importações dos componentes
import ReportFilters from '../components/ReportFilters';
import ReportSummary from '../components/ReportSummary';
import RequestsTable from '../components/RequestsTable';
import Pagination from '../components/Pagination';

// Importações dos tipos e funções API
import type {
  ReportFiltersData,
  RequestsReportData,
  Sector,
  User
} from '../types/reports';

import {
  getRequestsReport,
  exportRequestsReport,
  getSectors,
  getRequesters
} from '../api/reports';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<RequestsReportData | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [requesters, setRequesters] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ReportFiltersData>({
    page: '1',
    pageSize: '20',
    includeItems: false
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
    generateReport();
  }, []);

  const loadInitialData = async () => {
    try {
      const [sectorsResponse, requestersResponse] = await Promise.all([
        getSectors(),
        getRequesters()
      ]);

      setSectors(sectorsResponse.data);
      setRequesters(requestersResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getRequestsReport(filters);
      setReportData(response.data);
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      setError(error?.response?.data?.error || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: ReportFiltersData) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: '1' }));
    generateReport();
  };

  const handleResetFilters = () => {
    const resetFilters: ReportFiltersData = {
      page: '1',
      pageSize: '20',
      includeItems: false
    };
    setFilters(resetFilters);
    setTimeout(() => {
      generateReport();
    }, 100);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await exportRequestsReport(filters);

      // Criar link para download
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `relatorio_requisicoes_${new Date()
          .toISOString()
          .split('T')[0]}.json`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page: page.toString() }));
    setTimeout(() => {
      generateReport();
    }, 100);
  };

  const handleViewDetails = (id: number) => {
    navigate(`/requests/${id}`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-4 text-blue-600" size={32} />
            Relatórios de Requisições
          </h1>
          <p className="mt-2 text-gray-600">
            Análise completa e detalhada das requisições de compra do sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <ReportFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
        onExport={handleExport}
        onReset={handleResetFilters}
        sectors={sectors}
        requesters={requesters}
        loading={loading}
      />

      {/* Conteúdo */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">
                Erro ao carregar relatório
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && !reportData && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Gerando relatório...</p>
            <p className="text-sm text-gray-500">Isso pode levar alguns momentos</p>
          </div>
        </div>
      )}

      {reportData && !loading && (
        <>
          {/* Resumo */}
          <ReportSummary summary={reportData.summary} charts={reportData.charts} />

          {/* Tabela de Requisições */}
          <RequestsTable
            requests={reportData.requests}
            onViewDetails={handleViewDetails}
          />

          {/* Paginação */}
          <Pagination
            pagination={reportData.pagination}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ReportsPage;
