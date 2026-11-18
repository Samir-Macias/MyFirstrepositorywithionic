import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

/**
 * Interceptor HTTP que centraliza el manejo de errores
 * Proporciona:
 * - Logging consistente de errores
 * - Retry automático para errores temporales (5xx)
 * - Transformación de errores para mejor UX
 */
@Injectable()
export class ErrorHandlingInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      // Reintentar automáticamente en caso de error 5xx
      retry({
        count: 2,
        delay: 1000
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.getErrorMessage(error);
        
        // Log centralizado
        console.error('[HTTP Error]', {
          status: error.status,
          message: errorMessage,
          url: request.url,
          method: request.method,
          timestamp: new Date().toISOString()
        });

        // Transformar error para mejor manejo en componentes
        return throwError(() => ({
          status: error.status,
          message: errorMessage,
          originalError: error,
          timestamp: Date.now()
        }));
      })
    );
  }

  /**
   * Genera mensaje de error personalizado según tipo de error
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      // Error en el cliente/red
      return `Error de red: ${error.error.message}`;
    }

    // Error del servidor
    switch (error.status) {
      case 400:
        return 'Solicitud inválida. Por favor, verifica los datos ingresados.';
      case 401:
        return 'No estás autenticado. Por favor, inicia sesión.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no existe.';
      case 409:
        return 'Conflicto: el recurso ya existe o hay cambios concurrentes.';
      case 429:
        return 'Demasiadas solicitudes. Por favor, espera antes de reintentar.';
      case 500:
        return 'Error interno del servidor. Intenta nuevamente.';
      case 503:
        return 'Servicio no disponible. Por favor, intenta más tarde.';
      default:
        return error.error?.message || `Error HTTP ${error.status}: ${error.statusText}`;
    }
  }
}
