// src/utils/dateUtils.ts
export const formatDateForAPI = (dateString: string): string | undefined => {
  if (!dateString) return undefined;
  
  // Cria um objeto Date e define o horário para meio-dia UTC (evita problemas de timezone)
  const date = new Date(dateString + 'T12:00:00.000Z');
  
  // Retorna no formato ISO string (RFC3339)
  return date.toISOString();
};

export const formatDateFromAPI = (dateString: string): string => {
  if (!dateString) return '';
  
  // Cria objeto Date e extrai apenas a parte da data
  const date = new Date(dateString);
  
  // Retorna no formato YYYY-MM-DD para inputs HTML
  return date.toISOString().split('T')[0];
};

export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Retorna no formato brasileiro DD/MM/YYYY
  return date.toLocaleDateString('pt-BR');
};
