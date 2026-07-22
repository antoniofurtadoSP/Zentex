import { User } from './types';

/**
 * Returns an appropriate avatar URL based on the user's avatar or selected gender (female, neutral, male).
 * Always prioritizes custom uploaded or set user.avatar string.
 */
export function getAvatarUrl(user: User | null | undefined): string {
  if (!user) {
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  }
  
  // If the user has a custom avatar set (base64, blob, or custom URL), prioritize it directly
  if (user.avatar && user.avatar.trim().length > 0) {
    return user.avatar;
  }

  let gender = user.gender;

  // If gender is missing, dynamically detect based on user's name
  if (!gender) {
    const nameLower = (user.name || '').toLowerCase();
    
    if (nameLower.includes('antonio') || nameLower.includes('claudio') || nameLower.includes('lucas') || nameLower.includes('roberto') || nameLower.includes('josé') || nameLower.includes('joão') || nameLower.includes('carlos') || nameLower.includes('silva') || nameLower.includes('santos')) {
      gender = 'male';
    } else if (nameLower.includes('mariana') || nameLower.includes('maria') || nameLower.includes('ana') || nameLower.includes('julia') || nameLower.includes('fernanda') || nameLower.includes('costa')) {
      gender = 'female';
    } else {
      gender = 'neutral';
    }
  }

  if (gender === 'female') {
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';
  } else if (gender === 'neutral') {
    return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80';
  } else {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
  }
}

/**
 * Valida se um número de CPF é matematicamente válido usando o algoritmo de dígitos verificadores (Módulo 11 da Receita Federal).
 */
export function isValidCPF(cpf: string | undefined | null): boolean {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false; // Rejeita sequências repetidas como 111.111.111-11

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(10, 11))) return false;

  return true;
}

/**
 * Valida se um número de CNPJ é matematicamente válido.
 */
export function isValidCNPJ(cnpj: string | undefined | null): boolean {
  if (!cnpj) return false;
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Formata um CPF para o padrão 000.000.000-00
 */
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '').slice(0, 11);
  return clean
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

