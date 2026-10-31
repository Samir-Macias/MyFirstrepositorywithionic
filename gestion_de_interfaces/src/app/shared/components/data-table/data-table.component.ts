import { Component, computed, input, output, signal } from '@angular/core';
import { Task, TaskPriority, TaskStatus } from '../../../core/models/task.model';
import { formatDueDate } from '../../../core/utils/date-format';

export interface TaskStatusChange {
  readonly taskId: string;
  readonly status: TaskStatus;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent {
  readonly tasks = input.required<readonly Task[]>();
  readonly currentUserId = input<string | null>(null);
  readonly statusChange = output<TaskStatusChange>();
  readonly editRequested = output<Task>();
  readonly deleteRequested = output<Task>();
  readonly searchTerm = signal('');
  readonly statusFilter = signal<TaskStatus | 'ALL'>('ALL');
  readonly priorityFilter = signal<TaskPriority | 'ALL'>('ALL');

  readonly filteredTasks = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase('es');
    const status = this.statusFilter();
    const priority = this.priorityFilter();

    return this.tasks().filter((task) => {
      const matchesSearch =
        !query ||
        `${task.title} ${task.description} ${task.assignedUserName ?? ''} ${task.tags.join(' ')}`
          .toLocaleLowerCase('es')
          .includes(query);

      return (
        matchesSearch &&
        (status === 'ALL' || task.status === status) &&
        (priority === 'ALL' || task.priority === priority)
      );
    });
  });

  formatDate(date: string | null | undefined): string {
    return formatDueDate(date);
  }

  updateSearch(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.searchTerm.set(target.value);
    }
  }

  updateStatusFilter(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      const value = target.value;
      if (value === 'ALL' || value === 'TODO' || value === 'IN_PROGRESS' || value === 'COMPLETED') {
        this.statusFilter.set(value);
      }
    }
  }

  updatePriorityFilter(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      const value = target.value;
      if (value === 'ALL' || value === 'LOW' || value === 'MEDIUM' || value === 'HIGH') {
        this.priorityFilter.set(value);
      }
    }
  }

  requestStatusChange(task: Task, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const value = target.value;
    if (value === 'TODO' || value === 'IN_PROGRESS' || value === 'COMPLETED') {
      this.statusChange.emit({ taskId: task.id, status: value });
    }
  }
}
