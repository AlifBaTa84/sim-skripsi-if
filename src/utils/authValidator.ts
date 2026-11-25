/**
 * SISTEM INFORMASI MANAJEMEN SIDANG SKRIPSI (SIM-SIDANG)
 * Validasi Otentikasi & Generator Captcha
 */

import { PasswordValidationResult } from '../types';

/**
 * Validasi aturan password:
 * - Minimal 8 karakter
 * - Mengkombinasikan huruf besar (A-Z)
 * - Mengkombinasikan huruf kecil (a-z)
 * - Mengkombinasikan simbol (!@#$%^&*...)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  // Simbol: karakter selain huruf dan angka
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const errors: string[] = [];
  if (!hasMinLength) errors.push('Password minimal 8 karakter');
  if (!hasUppercase) errors.push('Wajib memuat setidaknya 1 huruf besar (A-Z)');
  if (!hasLowercase) errors.push('Wajib memuat setidaknya 1 huruf kecil (a-z)');
  if (!hasSymbol) errors.push('Wajib memuat setidaknya 1 simbol unik (!@#$%^&* dll)');

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasSymbol;

  return {
    isValid,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasSymbol,
    errors,
  };
}

/**
 * Karakter acak yang mudah dibedakan (menghilangkan I, l, 1, 0, O)
 */
const CAPTCHA_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';

/**
 * Menghasilkan teks CAPTCHA 5 karakter
 */
export function generateCaptchaText(length = 5): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CAPTCHA_CHARS.length);
    result += CAPTCHA_CHARS.charAt(randomIndex);
  }
  return result;
}

/**
 * Memvalidasi teks CAPTCHA
 */
export function validateCaptcha(userInput: string, expectedText: string): boolean {
  if (!userInput || !expectedText) return false;
  // Perbandingan case-insensitive agar nyaman bagi pengguna namun tetap aman
  return userInput.trim().toLowerCase() === expectedText.trim().toLowerCase();
}

