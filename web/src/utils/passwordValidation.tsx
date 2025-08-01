
import type { PasswordValidation } from '../types/profile';

export const validatePassword = (password: string): PasswordValidation => {
  const feedback: string[] = [];
  let score = 0;

  // Verificações básicas
  if (password.length < 6) {
    feedback.push('Deve ter pelo menos 6 caracteres');
    return { isValid: false, score: 0, feedback };
  }

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Senhas muito comuns
  const weakPasswords = ['123456', 'password', '123123', 'admin', 'qwerty', '111111', 'abc123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    feedback.push('Senha muito comum e insegura');
    return { isValid: false, score: 0, feedback };
  }

  // Feedback baseado na pontuação
  if (score < 2) {
    feedback.push('Senha muito fraca');
  } else if (score < 3) {
    feedback.push('Senha fraca - adicione números e caracteres especiais');
  } else if (score < 4) {
    feedback.push('Senha moderada');
  } else {
    feedback.push('Senha forte');
  }

  // Sugestões específicas
  if (!/[A-Z]/.test(password)) {
    feedback.push('Adicione letras maiúsculas');
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('Adicione números');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Adicione caracteres especiais (!@#$%...)');
  }

  return {
    isValid: score >= 2,
    score: Math.min(score, 4),
    feedback,
  };
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'bg-red-500';
    case 2:
      return 'bg-yellow-500';
    case 3:
      return 'bg-blue-500';
    case 4:
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};

export const getPasswordStrengthText = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'Muito fraca';
    case 2:
      return 'Fraca';
    case 3:
      return 'Moderada';
    case 4:
      return 'Forte';
    default:
      return 'Sem avaliação';
  }
};