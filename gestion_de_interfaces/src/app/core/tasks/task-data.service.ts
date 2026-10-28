import { inject, Injectable } from '@angular/core';
import { RealtimeChannel, User } from '@supabase/supabase-js';
import { Subtask, Task, TaskPriority, TaskStatus } from '../models/task.model';
import { ActivityEntry, ActivityLogRow, TaskRow } from '../models/task-row.model';
import { SupabaseClientService } from '../supabase/supabase-client.service';

export interface TaskInput {
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly tags: readonly string[];
  readonly estimatedHours: number;
  readonly loggedHours: number;
}

@Injectable({ providedIn: 'root' })
export class TaskDataService {
  private readonly supabase = inject(SupabaseClientService);

  async loadTasks(): Promise<Task[]> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`No se pudieron cargar las tareas: ${error.message}`);
    }

    return (data as TaskRow[]).map((row) => this.toTask(row));
  }

  async createTask(input: TaskInput, user: Pick<User, 'id' | 'email' | 'user_metadata'>): Promise<Task> {
    const client = await this.supabase.getClient();
    const userName = this.userDisplayName(user);
    const { data, error } = await client
      .from('tasks')
      .insert({
        title: this.readTitle(input.title),
        description: input.description.trim() || null,
        status: input.status,
        priority: input.priority,
        assigned_user_id: user.id,
        assigned_user_name: userName,
        assigned_user_email: user.email ?? null,
        created_by_user_id: user.id,
        subtasks: [],
        tags: this.readTags(input.tags),
        estimated_hours: this.readHours(input.estimatedHours, 'estimated_hours'),
        logged_hours: this.readHours(input.loggedHours, 'logged_hours'),
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`No se pudo crear la tarea: ${error.message}`);
    }

    return this.toTask(data as TaskRow);
  }

  async updateTask(taskId: string, input: TaskInput): Promise<Task> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('tasks')
      .update({
        title: this.readTitle(input.title),
        description: input.description.trim() || null,
        status: input.status,
        priority: input.priority,
        tags: this.readTags(input.tags),
        estimated_hours: this.readHours(input.estimatedHours, 'estimated_hours'),
        logged_hours: this.readHours(input.loggedHours, 'logged_hours'),
      })
      .eq('id', taskId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo guardar la tarea: ${error.message}`);
    }
    if (!data) {
      throw new Error('No se actualizó ninguna tarea. Comprueba los permisos RLS.');
    }

    return this.toTask(data as TaskRow);
  }

  async deleteTask(taskId: string): Promise<void> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo eliminar la tarea: ${error.message}`);
    }
    if (!data) {
      throw new Error('No se eliminó ninguna tarea. Comprueba que seas su creador.');
    }
  }

  async loadActivity(): Promise<ActivityEntry[]> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new Error(`No se pudo cargar la actividad: ${error.message}`);
    }

    return (data as ActivityLogRow[]).map((row) => this.toActivityEntry(row));
  }

  async setStatus(taskId: string, status: TaskStatus): Promise<void> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('tasks')
      .update({ status })
      .eq('id', taskId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo actualizar la tarea: ${error.message}`);
    }
    if (!data) {
      throw new Error('No se actualizó ninguna tarea. Comprueba los permisos RLS.');
    }
  }

  async subscribeToChanges(
    onChange: () => void,
    onError: (error: Error) => void,
  ): Promise<() => void> {
    const client = await this.supabase.getClient();
    const channel: RealtimeChannel = client
      .channel('public-tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => onChange(),
      )
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onError(new Error(error?.message ?? `La suscripción Realtime terminó con estado ${status}.`));
        }
      });

    return () => {
      void client.removeChannel(channel).catch((error: unknown) => {
        console.error('No se pudo cerrar el canal Realtime de tareas.', error);
      });
    };
  }

  private toTask(row: TaskRow): Task {
    const tags = this.readArray(row.tags)
      .map((tag) => this.readLabel(tag))
      .filter((tag): tag is string => tag !== null);
    const subtasks = this.readSubtasks(row.subtasks);
    const completedSubtasks = subtasks.filter((subtask) => this.isCompleted(subtask)).length;
    const assignedUserName = row.assigned_user_name?.trim() || 'Sin asignar';

    return {
      id: row.id,
      createdByUserId: row.created_by_user_id,
      createdAt: row.created_at,
      title: row.title,
      description: row.description ?? '',
      status: this.readStatus(row.status),
      priority: this.readPriority(row.priority),
      assignedUserName,
      assignedUserInitials: this.initials(assignedUserName),
      dueLabel: 'Sin fecha límite',
      tags,
      subtasks,
      subtasksCompleted: completedSubtasks,
      subtasksTotal: subtasks.length,
      estimatedHours: this.readHours(row.estimated_hours, 'estimated_hours'),
      loggedHours: this.readHours(row.logged_hours, 'logged_hours'),
    };
  }

  private toActivityEntry(row: ActivityLogRow): ActivityEntry {
    const userName = row.user_email?.split('@')[0] || 'Usuario';
    const details =
      typeof row.details === 'object' && row.details !== null
        ? (row.details as Record<string, unknown>)
        : {};
    const taskTitle =
      typeof details['title'] === 'string' ? ` «${details['title']}»` : '';
    const description =
      row.action === 'TASK_CREATED'
        ? `creó la tarea${taskTitle}`
        : row.action === 'TASK_UPDATED'
          ? 'actualizó una tarea'
          : row.action === 'TASK_DELETED'
            ? `eliminó la tarea${taskTitle}`
            : `realizó la acción ${row.action}`;

    return {
      id: row.id,
      initials: this.initials(userName),
      userName,
      description,
      timeLabel: this.relativeTime(row.created_at),
    };
  }

  private readArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private readSubtasks(value: unknown): Subtask[] {
    return this.readArray(value).flatMap((subtask, index) => {
      if (typeof subtask === 'string') {
        return [{ id: `subtask-${index + 1}`, title: subtask, completed: false }];
      }
      if (typeof subtask !== 'object' || subtask === null) {
        return [];
      }

      const object = subtask as Record<string, unknown>;
      if (typeof object['title'] !== 'string') {
        return [];
      }

      return [{
        id: typeof object['id'] === 'string' ? object['id'] : `subtask-${index + 1}`,
        title: object['title'],
        completed: this.isCompleted(object),
      }];
    });
  }

  private readLabel(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value !== 'object' || value === null) {
      return null;
    }

    const object = value as Record<string, unknown>;
    const label = object['label'] ?? object['name'] ?? object['title'];
    return typeof label === 'string' ? label : null;
  }

  private isCompleted(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const object = value as Record<string, unknown>;
    return (
      object['completed'] === true ||
      object['is_completed'] === true ||
      object['status'] === 'COMPLETED'
    );
  }

  private readHours(value: number, column: string): number {
    const hours = Number(value);
    if (!Number.isFinite(hours) || hours < 0) {
      throw new Error(`La columna ${column} contiene un valor de horas no válido.`);
    }
    return hours;
  }

  private readTitle(value: string): string {
    const title = value.trim();
    if (!title) {
      throw new Error('El título de la tarea es obligatorio.');
    }
    return title;
  }

  private readTags(tags: readonly string[]): string[] {
    return tags.map((tag) => tag.trim()).filter(Boolean);
  }

  private userDisplayName(
    user: Pick<User, 'id' | 'email' | 'user_metadata'>,
  ): string {
    const fullName = user.user_metadata['full_name'];
    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName.trim();
    }
    return user.email ?? 'Usuario';
  }

  private readStatus(status: TaskStatus): TaskStatus {
    if (status === 'TODO' || status === 'IN_PROGRESS' || status === 'COMPLETED') {
      return status;
    }
    throw new Error(`La tarea contiene un estado no admitido: ${String(status)}.`);
  }

  private readPriority(priority: TaskPriority): TaskPriority {
    if (priority === 'LOW' || priority === 'MEDIUM' || priority === 'HIGH') {
      return priority;
    }
    throw new Error(`La tarea contiene una prioridad no admitida: ${String(priority)}.`);
  }

  private initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toLocaleUpperCase('es'))
      .join('');
  }

  private relativeTime(value: string): string {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) {
      return 'fecha desconocida';
    }

    const minutes = Math.round((timestamp - Date.now()) / 60_000);
    if (Math.abs(minutes) < 1) {
      return 'ahora';
    }
    if (Math.abs(minutes) < 60) {
      return new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(minutes, 'minute');
    }

    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) {
      return new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(hours, 'hour');
    }

    const days = Math.round(hours / 24);
    return new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(days, 'day');
  }
}
