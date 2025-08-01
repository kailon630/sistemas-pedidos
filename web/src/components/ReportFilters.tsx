// src/components/ReportFilters.tsx
import React from 'react';
import { Filter, Download, RefreshCw } from 'lucide-react';
import type { ReportFiltersData, Sector, User } from '../types/reports';

interface ReportFiltersProps {
  filters: ReportFiltersData;
  onFiltersChange: (filters: ReportFiltersData) => void;
  onApplyFilters: () => void;
  onExport: () => void;
  onReset: () => void;
  sectors: Sector[];
  requesters: User[];
  loading: boolean;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onExport,
  onReset,
  sectors,
  requesters,
  loading
}) => {
  const handleInputChange = (field: keyof ReportFiltersData, value: string | boolean) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="mr-2 text-blue-600" size={20} />
          Filtros do Relatório
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Limpar
          </button>
          <button
            onClick={onExport}
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors flex items-center"
          >
            <Download size={16} className="mr-2" />
            Exportar
          </button>
          <button
            onClick={onApplyFilters}
            disabled={loading}
            className="px-6 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Gerando...' : 'Aplicar Filtros'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Data Início */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Início
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Data Fim */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Fim
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Setor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Setor
          </label>
          <select
            value={filters.sectorId || ''}
            onChange={(e) => handleInputChange('sectorId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Todos os setores</option>
            {sectors.map((sector) => (
              <option key={sector.ID} value={sector.ID.toString()}>
                {sector.Name}
              </option>
            ))}
          </select>
        </div>

        {/* Solicitante */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Solicitante
          </label>
          <select
            value={filters.requesterId || ''}
            onChange={(e) => handleInputChange('requesterId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Todos os solicitantes</option>
            {requesters.map((requester) => (
              <option key={requester.ID} value={requester.ID.toString()}>
                {requester.Name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
            <option value="completed">Concluído</option>
          </select>
        </div>

        {/* Prioridade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prioridade
          </label>
          <select
            value={filters.priority || ''}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Todas as prioridades</option>
            <option value="low">Baixa</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>

        {/* Incluir Itens */}
        <div className="flex items-center mt-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.includeItems || false}
              onChange={(e) => handleInputChange('includeItems', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 font-medium">Incluir detalhes dos itens</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;