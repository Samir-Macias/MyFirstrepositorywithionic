import { computed, Component, signal } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Task, TaskStatusFilter } from '../core/models/task.model';
import { StatCardComponent } from '../shared/components/stat-card/stat-card.component';
import { TaskCardComponent } from '../shared/components/task-card/task-card.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  imports: [IonContent, StatCardComponent, TaskCardComponent],
})
export class HomePage {
  readonly searchTerm = signal('');
  readonly activeFilter = signal<TaskStatusFilter>('ALL');
  readonly tasks = signal<Task[]>([
    {
      id: 'task-1',
      title: 'Preparar propuesta para el cliente',
      description: 'Revisar el briefing y cerrar el primer borrador.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignedUserName: 'Lucía Martín',
      assignedUserInitials: 'LM',
      dueLabel: 'Hoy',
      tags: ['Diseño', 'Cliente'],
      subtasksCompleted: 2,
      subtasksTotal: 4,
    },
    {
      id: 'task-2',
      title: 'Revisión de métricas del sprint',
      description: 'Compartir los resultados en la reunión de equipo.',
      status: 'TODO',
      priority: 'MEDIUM',
      assignedUserName: 'Diego Ruiz',
      assignedUserInitials: 'DR',
      dueLabel: 'Mañana',
      tags: ['Equipo'],
      subtasksCompleted: 0,
      subtasksTotal: 3,
    },
    {
      id: 'task-3',
      title: 'Actualizar documentación del producto',
      description: 'Añadir los últimos cambios del flujo de registro.',
      status: 'TODO',
      priority: 'LOW',
      assignedUserName: 'Marta Gil',
      assignedUserInitials: 'MG',
      dueLabel: '28 oct',
      tags: ['Documentación'],
      subtasksCompleted: 1,
      subtasksTotal: 3,
    },
    {
      id: 'task-4',
      title: 'Preparar recursos para la presentación',
      description: 'Organizar capturas y materiales para la demo.',
      status: 'COMPLETED',
      priority: 'LOW',
      assignedUserName: 'Pablo León',
      assignedUserInitials: 'PL',
      dueLabel: 'Ayer',
      tags: ['Producto'],
      subtasksCompleted: 3,
      subtasksTotal: 3,
    },
  ]);

  readonly visibleTasks = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase('es');
    const status = this.activeFilter();

    return this.tasks().filter((task) => {
      const matchesStatus = status === 'ALL' || task.status === status;
      const matchesSearch =
        query.length === 0 ||
        `${task.title} ${task.description} ${task.tags.join(' ')}`
          .toLocaleLowerCase('es')
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  });

  readonly completedCount = computed(
    () => this.tasks().filter((task) => task.status === 'COMPLETED').length,
  );

  readonly inProgressCount = computed(
    () => this.tasks().filter((task) => task.status === 'IN_PROGRESS').length,
  );

  readonly todoCount = computed(
    () => this.tasks().filter((task) => task.status === 'TODO').length,
  );

  readonly pendingCount = computed(
    () => this.tasks().filter((task) => task.status !== 'COMPLETED').length,
  );

  readonly totalTaskCount = computed(() => this.tasks().length);

  readonly chartTaskTotal = computed(() => Math.max(this.totalTaskCount(), 1));

  statusArcLength(count: number): string {
    return `${(count * 276.46) / this.chartTaskTotal()} 276.46`;
  }

  statusArcOffset(countsBefore: number): number {
    return (-countsBefore * 276.46) / this.chartTaskTotal();
  }

  setFilter(filter: TaskStatusFilter): void {
    this.activeFilter.set(filter);
  }

  updateSearch(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.searchTerm.set(input.value);
    }
  }

  toggleTaskCompletion(taskId: string): void {
    this.tasks.update((tasks) =>
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED',
            }
          : task,
      ),
    );
  }
}
