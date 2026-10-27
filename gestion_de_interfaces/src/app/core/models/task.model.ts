export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly assignedUserName: string;
  readonly assignedUserInitials: string;
  readonly dueLabel: string;
  readonly tags: readonly string[];
  readonly subtasksCompleted: number;
  readonly subtasksTotal: number;
}

export type TaskStatusFilter = 'ALL' | TaskStatus;
