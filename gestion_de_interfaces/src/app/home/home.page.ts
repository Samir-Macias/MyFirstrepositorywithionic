import { computed, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { Task, TaskPriority, TaskStatus, TaskStatusFilter } from '../core/models/task.model';
import { AuthService } from '../core/auth/auth.service';
import { ActivityEntry } from '../core/models/task-row.model';
import { TaskDataService, TaskInput } from '../core/tasks/task-data.service';
import { ReportExportService } from '../core/services/report-export.service';
import { DashboardChartsComponent } from '../shared/components/dashboard-charts/dashboard-charts.component';
import { DataTableComponent, TaskStatusChange } from '../shared/components/data-table/data-table.component';
import { StatCardComponent } from '../shared/components/stat-card/stat-card.component';

interface TaskFormState {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string;
  estimatedHours: number;
  loggedHours: number;
  dueDate: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  imports: [
    FormsModule,
    IonContent,
    RouterLink,
    DashboardChartsComponent,
    DataTableComponent,
    StatCardComponent,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  private readonly taskData = inject(TaskDataService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly reportExport = inject(ReportExportService);
  readonly searchTerm = signal('');
  readonly activeFilter = signal<TaskStatusFilter>('ALL');
  readonly tasks = signal<Task[]>([]);
  readonly activity = signal<ActivityEntry[]>([]);
  readonly isLoadingTasks = signal(true);
  readonly pageError = signal('');
  readonly isDarkMode = signal(false);
  readonly isTaskFormOpen = signal(false);
  readonly isSavingTask = signal(false);
  readonly taskFormError = signal('');
  readonly editingTaskId = signal<string | null>(null);
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? null);
  readonly navItems = computed(() => {
    const roles = this.auth.roles();

    if (roles.includes('SUPER_ADMIN')) {
      return [{ label: 'Panel Global', path: '/admin/super-panel', icon: 'shield' }];
    }

    return [
      { label: 'Cuadro de Mando', path: '/workspace', icon: 'dashboard' },
      { label: 'Calendario', path: '/workspace/calendar', icon: 'calendar' },
      ...(roles.includes('CORP_ADMIN')
        ? [
            { label: 'Gestión de Equipo', path: '/workspace/team-management', icon: 'people' },
            { label: 'Actividad', path: '/workspace/activity-feed', icon: 'activity' },
          ]
        : []),
    ];
  });
  readonly editingTaskCanDelete = computed(() => {
    const task = this.tasks().find((item) => item.id === this.editingTaskId());
    return task?.createdByUserId === this.currentUserId();
  });
  readonly todayLabel = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date()).toLocaleUpperCase('es');
  taskForm: TaskFormState = this.emptyTaskForm();
  private unsubscribeRealtime: (() => void) | null = null;
  private destroyed = false;

  async ngOnInit(): Promise<void> {
    this.isDarkMode.set(localStorage.getItem('taskflow-theme') === 'dark');
    this.applyTheme();
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

  readonly weeklyChart = computed(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const dayFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
    const counts = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() + index);
      return {
        date,
        label: dayFormatter.format(date).replace('.', ''),
        count: 0,
      };
    });

    for (const task of this.tasks()) {
      const createdAt = new Date(task.createdAt);
      if (!Number.isFinite(createdAt.getTime())) {
        continue;
      }
      const taskDay = new Date(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        createdAt.getDate(),
      );
      if (taskDay > today) {
        continue;
      }
      const dayIndex = Math.round((taskDay.getTime() - firstDay.getTime()) / 86_400_000);
      if (dayIndex >= 0 && dayIndex < counts.length) {
        counts[dayIndex].count += 1;
      }
    }

    const maxCount = Math.max(...counts.map((item) => item.count), 1);
    const points = counts.map((day, index) => ({
      ...day,
      x: 28 + index * 38,
      y: 108 - (day.count / maxCount) * 78,
    }));
    const linePath = points.map((point, index) =>
      `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`,
    ).join(' ');

    return {
      points,
      linePath,
      areaPath: `${linePath} L256 108 L28 108 Z`,
      total: counts.reduce((total, day) => total + day.count, 0),
      description: `Tareas creadas durante los últimos siete días: ${counts
        .map((day) => `${day.label} ${day.count}`)
        .join(', ')}`,
    };
  });

  formatHours(value: number): string {
    return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value)} h`;
  }

  toggleTheme(): void {
    const isDark = !this.isDarkMode();
    this.isDarkMode.set(isDark);
    this.applyTheme();
    localStorage.setItem('taskflow-theme', isDark ? 'dark' : 'light');
  }

  private applyTheme(): void {
    document.documentElement.dataset['theme'] = this.isDarkMode() ? 'dark' : 'light';
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
      await this.refreshActivity();
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'No se pudo actualizar la tarea.',
      );
    }
  }

  async changeTaskStatus(change: TaskStatusChange): Promise<void> {
    this.pageError.set('');
    try {
      await this.taskData.setStatus(change.taskId, change.status);
      this.tasks.update((tasks) =>
        tasks.map((task) =>
          task.id === change.taskId ? { ...task, status: change.status } : task,
        ),
      );
      await this.refreshActivity();
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'No se pudo actualizar el estado de la tarea.',
      );
    }
  }

  exportTasksCsv(): void {
    try {
      this.reportExport.exportCsv(this.tasks());
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'No se pudo generar el informe CSV.',
      );
    }
  }

  exportTasksPdf(): void {
    try {
      this.reportExport.exportPdf(this.tasks());
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'No se pudo generar el informe PDF.',
      );
    }
  }

  openCreateTask(): void {
    this.taskForm = this.emptyTaskForm();
    this.editingTaskId.set(null);
    this.taskFormError.set('');
    this.isTaskFormOpen.set(true);
  }

  openEditTask(task: Task): void {
    this.taskForm = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      tags: task.tags.join(', '),
      estimatedHours: task.estimatedHours,
      loggedHours: task.loggedHours,
      dueDate: task.dueDate ?? '',
    };
    this.editingTaskId.set(task.id);
    this.taskFormError.set('');
    this.isTaskFormOpen.set(true);
  }

  async openTaskEditor(task?: Task): Promise<void> {
    await this.router.navigate(['/workspace/task-editor', ...(task ? [task.id] : [])]);
  }

  closeTaskForm(): void {
    if (!this.isSavingTask()) {
      this.isTaskFormOpen.set(false);
    }
  }

  async saveTask(): Promise<void> {
    if (this.isSavingTask()) {
      return;
    }

    this.isSavingTask.set(true);
    this.taskFormError.set('');
    const input: TaskInput = {
      title: this.taskForm.title,
      description: this.taskForm.description,
      status: this.taskForm.status,
      priority: this.taskForm.priority,
      tags: this.taskForm.tags.split(','),
      estimatedHours: Number(this.taskForm.estimatedHours),
      loggedHours: Number(this.taskForm.loggedHours),
      dueDate: this.taskForm.dueDate || null,
    };

    try {
      const taskId = this.editingTaskId();
      let savedTask: Task;
      if (taskId) {
        savedTask = await this.taskData.updateTask(taskId, input);
        this.tasks.update((tasks) => tasks.map((task) => (task.id === taskId ? savedTask : task)));
      } else {
        const user = this.auth.currentUser();
        if (!user) {
          throw new Error('Tu sesión ha caducado. Inicia sesión de nuevo para crear tareas.');
        }
        savedTask = await this.taskData.createTask(input, user);
        this.tasks.update((tasks) => [savedTask, ...tasks]);
      }

      this.isTaskFormOpen.set(false);
      void this.refreshActivity();
    } catch (error) {
      this.taskFormError.set(
        error instanceof Error ? error.message : 'No se pudo guardar la tarea.',
      );
    } finally {
      this.isSavingTask.set(false);
    }
  }

  async deleteTask(task: Task): Promise<void> {
    if (!window.confirm(`¿Eliminar la tarea «${task.title}»? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.pageError.set('');
    try {
      await this.taskData.deleteTask(task.id);
      this.tasks.update((tasks) => tasks.filter((item) => item.id !== task.id));
      if (this.editingTaskId() === task.id) {
        this.isTaskFormOpen.set(false);
      }
      await this.refreshActivity();
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'No se pudo eliminar la tarea.',
      );
    }
  }

  async deleteEditingTask(): Promise<void> {
    const task = this.tasks().find((item) => item.id === this.editingTaskId());
    if (task) {
      await this.deleteTask(task);
    }
  }

  clearTaskFilters(): void {
    this.searchTerm.set('');
    this.activeFilter.set('ALL');
  }

  private async refreshActivity(): Promise<void> {
    try {
      this.activity.set(await this.taskData.loadActivity());
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'No se pudo cargar la actividad.',
      );
    }
  }

  private emptyTaskForm(): TaskFormState {
    return {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      tags: '',
      estimatedHours: 0,
      loggedHours: 0,
      dueDate: '',
    };
  }
}
