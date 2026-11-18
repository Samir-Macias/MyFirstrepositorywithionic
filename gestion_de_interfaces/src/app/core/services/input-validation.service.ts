import { Injectable } from '@angular/core';

/**
 * Servicio centralizado para validación de entrada de datos
 * Previene SQL Injection, XSS y otros ataques de inyección
 * 
 * NOTA: Supabase con typed-postgres previene SQL injection automáticamente,
 * pero esta validación añade una capa de seguridad en lógica de negocio
 */
@Injectable({ providedIn: 'root' })
export class InputValidationService {
  
  /**
   * Valida formato de email
   * @param email - Email a validar
   * @returns true si es válido, false en caso contrario
   */
  isValidEmail(email: string): boolean {
    // RFC 5322 simplificado
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) && email.length <= 254;
  }

  /**
   * Valida teléfono en formato E.164 internacional
   * @param phone - Teléfono a validar (puede incluir + y números)
   * @returns true si es válido
   */
  isValidPhone(phone: string): boolean {
    // Formato E.164: +[1-9]{1-3}[0-9]{1,14}
    const regex = /^\+?[1-9]\d{1,14}$/;
    return regex.test(phone.replace(/\s|-/g, ''));
  }

  /**
   * Valida nombre/texto - no vacío y longitud válida
   * @param text - Texto a validar
   * @param minLength - Longitud mínima (default: 2)
   * @param maxLength - Longitud máxima (default: 100)
   * @returns true si es válido
   */
  isValidText(text: string, minLength: number = 2, maxLength: number = 100): boolean {
    const trimmed = text.trim();
    return trimmed.length >= minLength && trimmed.length <= maxLength;
  }

  /**
   * Valida contraseña - mínimo 12 caracteres con complejidad
   * Requiere:
   * - Mínimo 12 caracteres
   * - Al menos una mayúscula
   * - Al menos una minúscula
   * - Al menos un número
   * - Al menos un símbolo especial
   * 
   * @param password - Contraseña a validar
   * @returns { isValid: boolean; errors: string[] }
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 12) {
      errors.push('La contraseña debe tener al menos 12 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una minúscula');
    }
    if (!/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('La contraseña debe contener al menos un símbolo especial (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitiza URL para prevenir open redirect
   * @param url - URL a validar
   * @param allowedOrigins - Orígenes permitidos (default: origin actual)
   * @returns URL sanitizada o null si no es segura
   */
  sanitizeRedirectUrl(url: string, allowedOrigins?: string[]): string | null {
    try {
      const parsedUrl = new URL(url, window.location.href);
      
      const origins = allowedOrigins || [window.location.origin];
      
      // Validar que el origen sea permitido
      if (!origins.includes(parsedUrl.origin)) {
        return null;
      }

      // Validar que la ruta sea segura (sin caracteres especiales peligrosos)
      if (/[\\\u0000-\u001f\u007f]/.test(parsedUrl.pathname)) {
        return null;
      }

      return parsedUrl.href;
    } catch (e) {
      // URL inválida
      return null;
    }
  }

  /**
   * Escapa caracteres especiales para evitar XSS
   * NOTA: Angular sanitiza por defecto, pero esto es un respaldo
   * 
   * @param text - Texto a escapar
   * @returns Texto escapado
   */
  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Valida longitud de string dentro de rango
   * @param text - Texto a validar
   * @param min - Longitud mínima
   * @param max - Longitud máxima
   * @returns true si está dentro del rango
   */
  isValidLength(text: string, min: number, max: number): boolean {
    return text.length >= min && text.length <= max;
  }

  /**
   * Valida que un valor esté en lista de valores permitidos
   * Útil para enums y selects
   * @param value - Valor a validar
   * @param allowedValues - Array de valores permitidos
   * @returns true si el valor está permitido
   */
  isInAllowedValues<T>(value: T, allowedValues: T[]): boolean {
    return allowedValues.includes(value);
  }

  /**
   * Valida formato de UUID v4
   * @param uuid - UUID a validar
   * @returns true si es válido
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Valida JSON válido
   * @param json - String con potencial JSON
   * @returns { isValid: boolean; data?: any; error?: string }
   */
  validateJSON(json: string): { isValid: boolean; data?: any; error?: string } {
    try {
      const data = JSON.parse(json);
      return { isValid: true, data };
    } catch (error) {
      return {
        isValid: false,
        error: `JSON inválido: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }
}
