import { computed, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { Task, TaskStatusFilter } from '../core/models/task.model';
import { AuthService } from '../core/auth/auth.service';
import { ActivityEntry } from '../core/models/task-row.model';
import { TaskDataService } from '../core/tasks/task-data.service';
import { StatCardComponent } from '../shared/components/stat-card/stat-card.component';
import { TaskCardComponent } from '../shared/components/task-card/task-card.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  imports: [IonContent, StatCardComponent, TaskCardComponent],
})
export class HomePage implements OnInit, OnDestroy {
  private readonly taskData = inject(TaskDataService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly searchTerm = signal('');
  readonly activeFilter = signal<TaskStatusFilter>('ALL');
  readonly tasks = signal<Task[]>([]);
  readonly activity = signal<ActivityEntry[]>([]);
  readonly isLoadingTasks = signal(true);
  readonly pageError = signal('');
  private unsubscribeRealtime: (() => void) | null = null;
  private destroyed = false;

  async ngOnInit(): Promise<void> {
    await this.refreshTasks();

    try {
      const unsubscribe = await this.taskData.subscribeToChanges(
        () => void this.refreshTasks(),
        (error) => this.pageError.set(error.message),
      );
      if (this.destroyed) {
        unsubscribe();
      } else {
        this.unsubscribeRealtime = unsubscribe;
      }
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'No se pudo iniciar la actualización en tiempo real.',
      );
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.unsubscribeRealtime?.();
  }

  userName(): string {
    const user = this.auth.currentUser();
    const name = user?.user_metadata['full_name'];
    return typeof name === 'string' && name.trim()
      ? name
      : user?.email ?? 'Usuario';
  }

  userInitials(): string {
    return this.userName()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toLocaleUpperCase('es'))
      .join('');
  }

  async signOut(): Promise<void> {
    this.pageError.set('');
    try {
      await this.auth.signOut();
      await this.router.navigateByUrl('/auth');
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'No se pudo cerrar la sesión.',
      );
    }
  }

  private async refreshTasks(): Promise<void> {
    this.isLoadingTasks.set(true);
    this.pageError.set('');
    const [tasksResult, activityResult] = await Promise.allSettled([
      this.taskData.loadTasks(),
      this.taskData.loadActivity(),
    ]);

    const errors: string[] = [];
    if (tasksResult.status === 'fulfilled') {
      this.tasks.set(tasksResult.value);
    } else {
      errors.push(
        tasksResult.reason instanceof Error
          ? tasksResult.reason.message
          : 'No se pudieron cargar las tareas.',
      );
    }

    if (activityResult.status === 'fulfilled') {
      this.activity.set(activityResult.value);
    } else {
      errors.push(
        activityResult.reason instanceof Error
          ? activityResult.reason.message
          : 'No se pudo cargar la actividad.',
      );
    }

    this.pageError.set(errors.join(' · '));
    this.isLoadingTasks.set(false);
  }

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

  readonly loggedHours = computed(() =>
    this.tasks().reduce((total, task) => total + task.loggedHours, 0),
  );

  readonly estimatedHours = computed(() =>
    this.tasks().reduce((total, task) => total + task.estimatedHours, 0),
  );

  formatHours(value: number): string {
    return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value)} h`;
  }

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

  async toggleTaskCompletion(taskId: string): Promise<void> {
    const task = this.tasks().find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    const status = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    this.pageError.set('');
    try {
      await this.taskData.setStatus(taskId, status);
      this.tasks.update((tasks) =>
        tasks.map((item) => (item.id === taskId ? { ...item, status } : item)),
      );
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'No se pudo actualizar la tarea.',
      );
    }
  }
}
