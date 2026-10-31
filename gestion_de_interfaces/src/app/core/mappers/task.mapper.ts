import { Subtask, Task, TaskPriority, TaskStatus } from '../models/task.model';
import { formatDueDate, normalizeDueDate } from '../utils/date-format';

export interface SupabaseTaskRow {
  readonly id: string;
  readonly created_by_user_id: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly due_date?: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly assigned_user_id: string | null;
  readonly assigned_user_name: string | null;
  readonly assigned_user_email: string | null;
  readonly subtasks: unknown;
  readonly tags: unknown;
  readonly estimated_hours: number | string;
  readonly logged_hours: number | string;
}

type SupabaseTaskWrite = {
  -readonly [Key in keyof SupabaseTaskRow]?: SupabaseTaskRow[Key];
};

export class TaskMapper {
  static toDomain(row: SupabaseTaskRow): Task {
    const subtasks = this.readSubtasks(row.subtasks);
    const assignedUserName = row.assigned_user_name?.trim() || 'Sin asignar';

    return {
      id: row.id,
      createdByUserId: row.created_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      dueDate: normalizeDueDate(row.due_date),
      title: row.title,
      description: row.description ?? '',
      status: this.readStatus(row.status),
      priority: this.readPriority(row.priority),
      assignedUserId: row.assigned_user_id ?? undefined,
      assignedUserName,
      assignedUserEmail: row.assigned_user_email ?? undefined,
      assignedUserInitials: this.initials(assignedUserName),
      dueLabel: formatDueDate(row.due_date),
      tags: this.readTags(row.tags),
      subtasks,
      subtasksCompleted: subtasks.filter((subtask) => subtask.completed).length,
      subtasksTotal: subtasks.length,
      estimatedHours: this.readHours(row.estimated_hours, 'estimated_hours'),
      loggedHours: this.readHours(row.logged_hours, 'logged_hours'),
    };
  }

  static toSupabase(task: Partial<Task>): SupabaseTaskWrite {
    const row: SupabaseTaskWrite = {};

    if (task.createdByUserId !== undefined) row.created_by_user_id = task.createdByUserId;
    if (task.dueDate !== undefined) row.due_date = task.dueDate;
    if (task.title !== undefined) row.title = task.title;
    if (task.description !== undefined) row.description = task.description;
    if (task.status !== undefined) row.status = task.status;
    if (task.priority !== undefined) row.priority = task.priority;
    if (task.assignedUserId !== undefined) row.assigned_user_id = task.assignedUserId;
    if (task.assignedUserName !== undefined) row.assigned_user_name = task.assignedUserName;
    if (task.assignedUserEmail !== undefined) row.assigned_user_email = task.assignedUserEmail;
    if (task.subtasks !== undefined) row.subtasks = [...task.subtasks];
    if (task.tags !== undefined) row.tags = [...task.tags];
    if (task.estimatedHours !== undefined) row.estimated_hours = task.estimatedHours;
    if (task.loggedHours !== undefined) row.logged_hours = task.loggedHours;

    return row;
  }

  private static readSubtasks(value: unknown): Subtask[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.flatMap((item: unknown, index: number) => {
      if (typeof item !== 'object' || item === null) {
        return [];
      }

      const candidate = item as Record<string, unknown>;
      if (typeof candidate['title'] !== 'string') {
        return [];
      }

      return [{
        id: typeof candidate['id'] === 'string' ? candidate['id'] : `subtask-${index + 1}`,
        title: candidate['title'],
        completed:
          candidate['completed'] === true ||
          candidate['is_completed'] === true ||
          candidate['status'] === 'COMPLETED',
      }];
    });
  }

  private static readTags(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.flatMap((tag: unknown) => {
      if (typeof tag === 'string') {
        return [tag];
      }
      if (typeof tag !== 'object' || tag === null) {
        return [];
      }

      const candidate = tag as Record<string, unknown>;
      const label = candidate['label'] ?? candidate['name'] ?? candidate['title'];
      return typeof label === 'string' ? [label] : [];
    });
  }

  private static readHours(value: number | string, column: string): number {
    const hours = Number(value);
    if (!Number.isFinite(hours) || hours < 0) {
      throw new Error(`La columna ${column} contiene un valor de horas no válido.`);
    }
    return hours;
  }

  private static readStatus(value: TaskStatus): TaskStatus {
    if (value === 'TODO' || value === 'IN_PROGRESS' || value === 'COMPLETED') {
      return value;
    }
    throw new Error(`La tarea contiene un estado no admitido: ${String(value)}.`);
  }

  private static readPriority(value: TaskPriority): TaskPriority {
    if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH') {
      return value;
    }
    throw new Error(`La tarea contiene una prioridad no admitida: ${String(value)}.`);
  }

  private static initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toLocaleUpperCase('es'))
      .join('');
  }

}
