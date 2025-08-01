// src/components/RequestsTable.tsx
import React from 'react';
import { Eye, Calendar, User, Building, FileText } from 'lucide-react';
import type { RequestReportItem } from '../types/reports';

interface RequestsTableProps {
  requests: RequestReportItem[];
  onViewDetails: (id: number) => void;
}

const RequestsTable: React.FC<RequestsTableProps> = ({ requests, onViewDetails }) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pendente' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Aprovado' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejeitado' },
      completed: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Concluído' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status };

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Baixa' },
      normal: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Normal' },
      high: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Alta' },
      urgent: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Urgente' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || 
                  { color: 'bg-gray-100 text-gray-800 border-gray-200', label: priority };

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="mr-2 text-blue-600" size={20} />
          Requisições Encontradas
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Solicitante
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Setor
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Prioridade
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Criado em
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Itens
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Dias Proc.
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request, index) => (
              <tr key={request.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  #{request.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {request.requesterName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {request.requesterEmail}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Building size={16} className="text-gray-400 mr-2" />
                    {request.sectorName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(request.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getPriorityBadge(request.priority)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    {formatDate(request.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {request.totalItems} {request.totalItems === 1 ? 'item' : 'itens'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {request.processDays ? `${request.processDays} dias` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onViewDetails(request.id)}
                    className="text-blue-600 hover:text-blue-800 flex items-center transition-colors hover:bg-blue-50 px-2 py-1 rounded-md"
                  >
                    <Eye size={16} className="mr-1" />
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {requests.length === 0 && (
        <div className="text-center py-16">
          <FileText className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma requisição encontrada</h3>
          <p className="mt-2 text-sm text-gray-500">
            Tente ajustar os filtros para encontrar requisições.
          </p>
        </div>
      )}
    </div>
  );
};

export default RequestsTable;