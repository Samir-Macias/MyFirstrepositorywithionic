import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Observable, from, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { SupabaseClientService } from '../supabase/supabase-client.service';

/**
 * Base service genérico para operaciones CRUD contra Supabase.
 * Elimina duplicación de código entre diferentes servicios (ClientsService, TasksService, etc.)
 * 
 * @template T - Tipo del modelo de datos
 */
@Injectable({ providedIn: 'root' })
export class BaseSupabaseService<T extends { id: string }> {
  protected supabaseClient: SupabaseClientService;
  protected tableName: string = '';
  protected cacheExpiry = 5 * 60 * 1000; // 5 minutos por defecto
  
  private cache = new Map<string, { data: any; timestamp: number }>();
  protected loading$ = new BehaviorSubject<boolean>(false);
  protected error$ = new BehaviorSubject<string | null>(null);

  constructor(supabaseClient: SupabaseClientService, tableName: string) {
    this.supabaseClient = supabaseClient;
    this.tableName = tableName;
  }

  /**
   * Obtiene todos los registros de la tabla
   * Implementa caching automático con invalidación temporal
   */
  getAll(
    orderBy: string = 'created_at',
    ascending: boolean = false,
    limit?: number
  ): Observable<T[]> {
    const cacheKey = `all_${orderBy}_${ascending}_${limit}`;
    
    // Retornar del cache si está disponible y no ha expirado
    if (this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }

    this.loading$.next(true);
    
    return from(this.supabaseClient.getClient()).pipe(
      map((client) => {
        let query = client.from(this.tableName).select('*');
        
        if (limit) {
          query = query.limit(limit);
        }
        
        return query.order(orderBy, { ascending });
      }),
      (query$) => query$.pipe(
        map((query) => query),
        (innerQuery$) => innerQuery$.pipe(
          (finalQuery$) => from(finalQuery$)
        )
      ),
      map(async (query) => await query),
      map(async (promise) => {
        const { data, error } = await promise;
        if (error) throw new Error(`Error fetching ${this.tableName}: ${error.message}`);
        return (data as T[]) || [];
      }),
      (promise$) => from(promise$),
      tap((data) => {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        this.loading$.next(false);
      }),
      catchError((error) => {
        this.error$.next(error.message);
        this.loading$.next(false);
        throw error;
      })
    );
  }

  /**
   * Obtiene un registro por ID
   */
  getById(id: string): Observable<T> {
    const cacheKey = `item_${id}`;
    
    if (this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }

    this.loading$.next(true);

    return from(this.supabaseClient.getClient()).pipe(
      map((client) =>
        client.from(this.tableName).select('*').eq('id', id).single()
      ),
      (query$) => from(query$),
      map(async (promise) => {
        const { data, error } = await promise;
        if (error) throw new Error(`Error fetching ${this.tableName} by ID: ${error.message}`);
        return data as T;
      }),
      (promise$) => from(promise$),
      tap((data) => {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        this.loading$.next(false);
      }),
      catchError((error) => {
        this.error$.next(error.message);
        this.loading$.next(false);
        throw error;
      })
    );
  }

  /**
   * Crea un nuevo registro
   */
  create(item: Omit<T, 'id'>): Observable<T> {
    this.loading$.next(true);

    return from(this.supabaseClient.getClient()).pipe(
      map((client) =>
        client
          .from(this.tableName)
          .insert([item])
          .select('*')
          .single()
      ),
      (query$) => from(query$),
      map(async (promise) => {
        const { data, error } = await promise;
        if (error) throw new Error(`Error creating ${this.tableName}: ${error.message}`);
        return data as T;
      }),
      (promise$) => from(promise$),
      tap(() => {
        this.invalidateCache();
        this.loading$.next(false);
      }),
      catchError((error) => {
        this.error$.next(error.message);
        this.loading$.next(false);
        throw error;
      })
    );
  }

  /**
   * Actualiza un registro existente
   * Excluye campos de auditoría (created_at, id)
   */
  update(id: string, changes: Partial<Omit<T, 'id' | 'created_at'>>): Observable<T> {
    this.loading$.next(true);

    return from(this.supabaseClient.getClient()).pipe(
      map((client) =>
        client
          .from(this.tableName)
          .update(changes)
          .eq('id', id)
          .select('*')
          .maybeSingle()
      ),
      (query$) => from(query$),
      map(async (promise) => {
        const { data, error } = await promise;
        if (error) throw new Error(`Error updating ${this.tableName}: ${error.message}`);
        if (!data) throw new Error(`No record found with ID: ${id}`);
        return data as T;
      }),
      (promise$) => from(promise$),
      tap(() => {
        this.invalidateCache();
        this.loading$.next(false);
      }),
      catchError((error) => {
        this.error$.next(error.message);
        this.loading$.next(false);
        throw error;
      })
    );
  }

  /**
   * Elimina un registro (soft delete con updated_at)
   */
  delete(id: string): Observable<void> {
    this.loading$.next(true);

    return from(this.supabaseClient.getClient()).pipe(
      map((client) =>
        client.from(this.tableName).delete().eq('id', id)
      ),
      (query$) => from(query$),
      map(async (promise) => {
        const { error } = await promise;
        if (error) throw new Error(`Error deleting from ${this.tableName}: ${error.message}`);
      }),
      (promise$) => from(promise$),
      tap(() => {
        this.invalidateCache();
        this.loading$.next(false);
      }),
      catchError((error) => {
        this.error$.next(error.message);
        this.loading$.next(false);
        throw error;
      })
    );
  }

  /**
   * Realiza una búsqueda/filtrado con paginación
   */
  search(
    filters: Record<string, any>,
    page: number = 0,
    pageSize: number = 20,
    orderBy: string = 'created_at'
  ): Observable<{ data: T[]; total: number }> {
    this.loading$.next(true);

    return from(this.supabaseClient.getClient()).pipe(
      map((client) => {
        let query = client.from(this.tableName).select('*', { count: 'exact' });
        
        // Aplicar filtros
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        // Aplicar paginación
        const from_index = page * pageSize;
        const to_index = from_index + pageSize - 1;
        query = query.range(from_index, to_index);

        return query.order(orderBy, { ascending: false });
      }),
      (query$) => from(query$),
      map(async (promise) => {
        const { data, error, count } = await promise;
        if (error) throw new Error(`Error searching ${this.tableName}: ${error.message}`);
        return { data: (data as T[]) || [], total: count || 0 };
      }),
      (promise$) => from(promise$),
      tap(() => this.loading$.next(false)),
      catchError((error) => {
        this.error$.next(error.message);
        this.loading$.next(false);
        throw error;
      })
    );
  }

  /**
   * Valida si el cache está válido (no ha expirado)
   */
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheExpiry;
  }

  /**
   * Invalida todo el cache
   */
  invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Invalida cache específico
   */
  invalidateCacheKey(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Observable para seguimiento de loading state
   */
  isLoading$ = this.loading$.asObservable();

  /**
   * Observable para seguimiento de errores
   */
  errors$ = this.error$.asObservable();
}
