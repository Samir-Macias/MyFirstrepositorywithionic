export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Subtask {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
}

export interface Task {
  readonly id: string;
  readonly organizationId?: string;           // Identificador de la corporación / equipo (Multi-Tenant)
  readonly createdByUserId: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly dueDate?: string | null;

  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;

  // Asignación de usuarios
  readonly assignedUserId?: string;             // ID del usuario asignado (imprescindible para RLS y filtros)
  readonly assignedUserName?: string;
  readonly assignedUserEmail?: string;
  readonly assignedUserInitials?: string;       // Helper visual para el avatar

  // Vistas y etiquetas de interfaz
  readonly dueLabel?: string;                   // Texto amigable ("Hoy", "10 Oct") generado para las tarjetas

  // Listas complejas (maqueadas contra JSONB en Supabase)
  readonly tags: readonly string[];
  readonly subtasks: readonly Subtask[];        // Array de subtareas reales para poder marcarlas en el editor
  readonly subtasksCompleted?: number;         // Opcional: Contador derivado para tarjetas
  readonly subtasksTotal?: number;             // Opcional: Contador derivado para tarjetas

  // Métricas de tiempo
  readonly estimatedHours: number;
  readonly loggedHours: number;
}

export type TaskStatusFilter = 'ALL' | TaskStatus;

// DTOs auxiliares para creación y edición en formularios
export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTaskInput = Partial<CreateTaskInput> & { readonly id: string };