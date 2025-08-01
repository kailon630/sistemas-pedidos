// Função para formatar CNPJ no frontend
export const formatCNPJ = (value: string): string => {
  // Remove tudo que não é dígito
  const cnpj = value.replace(/\D/g, '');
  
  // Aplica a máscara conforme o usuário digita
  if (cnpj.length <= 2) return cnpj;
  if (cnpj.length <= 5) return cnpj.replace(/(\d{2})(\d{0,3})/, '$1.$2');
  if (cnpj.length <= 8) return cnpj.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
  if (cnpj.length <= 12) return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
};

// Função para validar CNPJ no frontend
export const isValidCNPJ = (cnpj: string): boolean => {
  // Remove caracteres não numéricos
  const numbers = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (numbers.length !== 14) return false;
  
  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Algoritmo de validação
  const digits = numbers.split('').map(Number);
  
  // Primeiro dígito verificador
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  if (digits[12] !== firstDigit) return false;
  
  // Segundo dígito verificador
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  return digits[13] === secondDigit;
};

// Função para remover formatação do CNPJ (apenas números)
export const cleanCNPJ = (cnpj: string): string => {
  return cnpj.replace(/\D/g, '');
};

// Função para verificar se o CNPJ está formatado
export const isFormattedCNPJ = (cnpj: string): boolean => {
  return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj);
};
