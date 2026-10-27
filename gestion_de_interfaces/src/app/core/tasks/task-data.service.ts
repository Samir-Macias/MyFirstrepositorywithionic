import { inject, Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Task, TaskPriority, TaskStatus } from '../models/task.model';
import { ActivityEntry, ActivityLogRow, TaskRow } from '../models/task-row.model';
import { SupabaseClientService } from '../supabase/supabase-client.service';

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
    const subtasks = this.readArray(row.subtasks);
    const completedSubtasks = subtasks.filter((subtask) => this.isCompleted(subtask)).length;
    const assignedUserName = row.assigned_user_name?.trim() || 'Sin asignar';

    return {
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      status: this.readStatus(row.status),
      priority: this.readPriority(row.priority),
      assignedUserName,
      assignedUserInitials: this.initials(assignedUserName),
      dueLabel: 'Sin fecha límite',
      tags,
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
