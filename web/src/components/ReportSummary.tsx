// src/components/ReportSummary.tsx
import React from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Package,
  Building,
  User,
  Activity
} from 'lucide-react';
import type { RequestsReportCharts, RequestsReportSummary } from '../types/reports';

interface ReportSummaryProps {
  summary: RequestsReportSummary;
  charts: RequestsReportCharts;
}

const ReportSummary: React.FC<ReportSummaryProps> = ({ summary, charts }) => {
  const mainMetrics = [
    {
      title: 'Total de Requisições',
      value: summary.totalRequests,
      icon: FileText,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      textColor: 'text-white'
    },
    {
      title: 'Pendentes',
      value: summary.pendingRequests,
      icon: Clock,
      color: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
      textColor: 'text-white'
    },
    {
      title: 'Aprovadas',
      value: summary.approvedRequests,
      icon: CheckCircle,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      textColor: 'text-white'
    },
    {
      title: 'Concluídas',
      value: summary.completedRequests,
      icon: CheckCircle,
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      textColor: 'text-white'
    }
  ];

  const secondaryMetrics = [
    {
      title: 'Rejeitadas',
      value: summary.rejectedRequests,
      icon: XCircle,
      color: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-gray-900'
    },
    {
      title: 'Urgentes',
      value: summary.urgentRequests,
      icon: AlertTriangle,
      color: 'bg-orange-50',
      iconColor: 'text-orange-600',
      textColor: 'text-gray-900'
    },
    {
      title: 'Tempo Médio (dias)',
      value: Math.round(summary.averageProcessDays * 10) / 10,
      icon: TrendingUp,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-gray-900'
    },
    {
      title: 'Total de Itens',
      value: summary.totalItems,
      icon: Package,
      color: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      textColor: 'text-gray-900'
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <Activity className="mr-3 text-blue-600" size={24} />
        Resumo Geral
      </h2>
      
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className={`${metric.color} p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-3xl font-bold ${metric.textColor}`}>{metric.value}</p>
                  <p className={`text-sm ${metric.textColor} opacity-90 mt-1`}>{metric.title}</p>
                </div>
                <Icon className={metric.textColor} size={32} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {secondaryMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className={`${metric.color} p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${metric.textColor}`}>{metric.value}</p>
                  <p className="text-sm text-gray-600 mt-1">{metric.title}</p>
                </div>
                <Icon className={metric.iconColor} size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribuições em Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Distribuição por Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="mr-2 text-blue-600" size={20} />
            Distribuição por Status
          </h3>
          <div className="space-y-3">
            {charts.statusDistribution.map((item, index) => {
              const percentage = ((item.value / summary.totalRequests) * 100).toFixed(1);
              const statusColors = {
                pending: 'bg-yellow-500',
                approved: 'bg-green-500',
                rejected: 'bg-red-500',
                completed: 'bg-blue-500'
              };
              const bgColor = statusColors[item.label as keyof typeof statusColors] || 'bg-gray-500';
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${bgColor} mr-3`}></div>
                    <span className="font-medium text-gray-900 capitalize">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{percentage}%</span>
                    <span className="font-bold text-gray-900">{item.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ranking por Setor */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="mr-2 text-green-600" size={20} />
            Top Setores
          </h3>
          <div className="space-y-3">
            {charts.sectorRanking.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <span className="font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-center mb-3">
            <Building className="text-blue-600 mr-3" size={24} />
            <span className="font-semibold text-gray-900 text-lg">Setor Mais Ativo</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{summary.mostActiveSector || 'N/A'}</p>
          <p className="text-sm text-blue-600 mt-1">Maior volume de requisições</p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
          <div className="flex items-center mb-3">
            <User className="text-green-600 mr-3" size={24} />
            <span className="font-semibold text-gray-900 text-lg">Solicitante Mais Ativo</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{summary.mostActiveRequester || 'N/A'}</p>
          <p className="text-sm text-green-600 mt-1">Maior número de solicitações</p>
        </div>
      </div>
    </div>
  );
};

export default ReportSummary;