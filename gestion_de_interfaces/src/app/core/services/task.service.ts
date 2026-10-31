import { Injectable, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Task, CreateTaskInput, UpdateTaskInput } from '../models/task.model';
import { TaskMapper, SupabaseTaskRow } from '../mappers/task.mapper';
import { SupabaseClientService } from '../supabase/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly _tasks = signal<Task[]>([]);
  readonly tasks = this._tasks.asReadonly();

  private realtimeChannel: RealtimeChannel | null = null;

  async loadTasks(): Promise<Task[]> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`No se pudieron cargar las tareas: ${error.message}`);
    }

    const tasks = ((data ?? []) as SupabaseTaskRow[]).map((row) => TaskMapper.toDomain(row));
    this._tasks.set(tasks);
    return tasks;
  }

  async getTasksByMonth(year: number, month: number): Promise<Task[]> {
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
      throw new Error('El año o el mes indicado no es válido.');
    }

    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${month === 11 ? year + 1 : year}-${String((month + 1) % 12 + 1).padStart(2, '0')}-01`;
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .gte('due_date', startDate)
      .lt('due_date', endDate)
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(`No se pudieron cargar las tareas programadas en el mes: ${error.message}`);
    }

    return ((data ?? []) as SupabaseTaskRow[]).map((row) => TaskMapper.toDomain(row));
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('tasks')
      .insert(TaskMapper.toSupabase(input))
      .select('*')
      .single();

    if (error) {
      throw new Error(`No se pudo crear la tarea: ${error.message}`);
    }
    if (!data) {
      throw new Error('Supabase no devolvió la tarea recién creada.');
    }

    const newTask = TaskMapper.toDomain(data as SupabaseTaskRow);
    this._tasks.update((current) => [newTask, ...current]);
    return newTask;
  }

  async updateTask(id: string, changes: UpdateTaskInput): Promise<Task> {
    const client = await this.supabase.getClient();
    const { id: _inputId, ...taskChanges } = changes;
    const { data, error } = await client
      .from('tasks')
      .update(TaskMapper.toSupabase(taskChanges))
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo actualizar la tarea: ${error.message}`);
    }
    if (!data) {
      throw new Error('No se actualizó ninguna tarea. Comprueba los permisos RLS.');
    }

    const updatedTask = TaskMapper.toDomain(data as SupabaseTaskRow);
    this._tasks.update((current) =>
      current.map((task) => (task.id === id ? updatedTask : task)),
    );
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('tasks')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo eliminar la tarea: ${error.message}`);
    }
    if (!data) {
      throw new Error('No se eliminó ninguna tarea. Comprueba que seas su creador.');
    }

    this._tasks.update((current) => current.filter((task) => task.id !== id));
  }

  subscribeToRealtimeChanges(onError?: (error: Error) => void): void {
    if (this.realtimeChannel) {
      this.unsubscribeRealtime();
    }

    void this.supabase
      .getClient()
      .then((client) => {
        this.realtimeChannel = client
          .channel('public-tasks-channel')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tasks' },
            () => {
              void this.loadTasks().catch((error: unknown) => {
                this.reportRealtimeError(error, onError);
              });
            },
          )
          .subscribe((status, error) => {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              this.reportRealtimeError(
                new Error(error?.message ?? `La suscripción Realtime terminó con estado ${status}.`),
                onError,
              );
            }
          });
      })
      .catch((error: unknown) => this.reportRealtimeError(error, onError));
  }

  unsubscribeRealtime(): void {
    if (!this.realtimeChannel) {
      return;
    }

    const channel = this.realtimeChannel;
    this.realtimeChannel = null;
    void this.supabase
      .getClient()
      .then((client) => client.removeChannel(channel))
      .catch((error: unknown) => {
        console.error('No se pudo cerrar el canal Realtime de tareas.', error);
      });
  }

  private reportRealtimeError(
    error: unknown,
    onError?: (error: Error) => void,
  ): void {
    const normalizedError =
      error instanceof Error ? error : new Error('Error inesperado en Realtime de tareas.');

    if (onError) {
      onError(normalizedError);
    } else {
      console.error('No se pudo sincronizar las tareas en tiempo real.', normalizedError);
    }
  }
}
