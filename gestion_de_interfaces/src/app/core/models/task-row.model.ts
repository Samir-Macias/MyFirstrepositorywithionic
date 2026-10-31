import { TaskPriority, TaskStatus } from './task.model';

export interface TaskRow {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly assigned_user_id: string | null;
  readonly assigned_user_name: string | null;
  readonly assigned_user_email: string | null;
  readonly created_by_user_id: string;
  readonly subtasks: unknown;
  readonly tags: unknown;
  readonly estimated_hours: number;
  readonly logged_hours: number;
  readonly created_at: string;
  readonly updated_at: string;
  readonly due_date?: string | null;
}

export interface ActivityLogRow {
  readonly id: string;
  readonly action: string;
  readonly user_id: string | null;
  readonly user_email: string | null;
  readonly task_id: string | null;
  readonly details: unknown;
  readonly created_at: string;
}

export interface ActivityEntry {
  readonly id: string;
  readonly initials: string;
  readonly userName: string;
  readonly description: string;
  readonly timeLabel: string;
}
