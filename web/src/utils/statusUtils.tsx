//src/utils/statusUtils.ts:

import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'approved': return 'text-green-600 bg-green-100 border-green-200';
    case 'rejected': return 'text-red-600 bg-red-100 border-red-200';
    case 'suspended': return 'text-orange-600 bg-orange-100 border-orange-200'; // ✅ NOVO
    case 'partial': return 'text-purple-600 bg-purple-100 border-purple-200';
    case 'completed': return 'text-blue-600 bg-blue-100 border-blue-200';
    default: return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return <Clock size={16} />;
    case 'approved': return <CheckCircle size={16} />;
    case 'rejected': return <XCircle size={16} />;
    case 'suspended': return <AlertTriangle size={16} />; 
    case 'partial': return <AlertTriangle size={16} />;
    case 'completed': return <CheckCircle size={16} />;
    default: return <Clock size={16} />;
  }
};

export const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'Pendente';
    case 'approved': return 'Aprovado';
    case 'rejected': return 'Rejeitado';
    case 'suspended': return 'Suspenso'; // ✅ NOVO
    case 'partial': return 'Parcial';
    case 'completed': return 'Concluído';
    default: return status;
  }
};

// ✅ NOVA FUNÇÃO: Verificar se item pode ser recebido
export const canItemBeReceived = (item: { status: string }): boolean => {
  return item.status?.toLowerCase() === 'approved';
};