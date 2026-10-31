import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AppRole, AuthService } from '../core/auth/auth.service';
import { Task } from '../core/models/task.model';
import { TaskDataService } from '../core/tasks/task-data.service';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let roles: WritableSignal<AppRole[]>;
  let taskData: {
    loadTasks: ReturnType<typeof vi.fn>;
    loadActivity: ReturnType<typeof vi.fn>;
    setStatus: ReturnType<typeof vi.fn>;
    createTask: ReturnType<typeof vi.fn>;
    updateTask: ReturnType<typeof vi.fn>;
    deleteTask: ReturnType<typeof vi.fn>;
    subscribeToChanges: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    localStorage.removeItem('taskflow-theme');
    document.documentElement.removeAttribute('data-theme');
    const user = {
      id: 'user-1',
      email: 'lucia@example.test',
      user_metadata: { full_name: 'Lucía Martín' },
    };
    roles = signal<AppRole[]>(['USER']);
    taskData = {
      loadTasks: vi.fn().mockResolvedValue(sampleTasks()),
      loadActivity: vi.fn().mockResolvedValue([]),
      setStatus: vi.fn().mockResolvedValue(undefined),
      createTask: vi.fn().mockImplementation(async (input) => ({
        ...sampleTasks()[0],
        id: 'task-new',
        title: input.title,
      })),
      updateTask: vi.fn().mockImplementation(async (taskId, input) => ({
        ...sampleTasks()[0],
        id: taskId,
        title: input.title,
      })),
      deleteTask: vi.fn().mockResolvedValue(undefined),
      subscribeToChanges: vi.fn().mockResolvedValue(() => undefined),
    };

    await TestBed.configureTestingModule({
      providers: [
        { provide: TaskDataService, useValue: taskData },
        {
          provide: AuthService,
          useValue: { currentUser: signal(user), roles, signOut: vi.fn() },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('taskflow-theme');
    document.documentElement.removeAttribute('data-theme');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the calendar for workspace users and adds team management for corporate admins', () => {
    expect(component.navItems().map((item) => item.path)).toContain('/workspace/calendar');
    const navigation = fixture.nativeElement.querySelector('.sidebar__nav') as HTMLElement;
    expect(navigation.textContent).toContain('Calendario');

    roles.set(['CORP_ADMIN']);
    fixture.detectChanges();

    expect(component.navItems().map((item) => item.path)).toContain(
      '/workspace/team-management',
    );
    expect(navigation.textContent).toContain('Gestión de Equipo');
  });

  it('limits the super admin navigation to the global panel', () => {
    roles.set(['SUPER_ADMIN']);

    expect(component.navItems()).toEqual([
      { label: 'Panel Global', path: '/admin/super-panel', icon: 'shield' },
    ]);
  });

  it('filters tasks by status', () => {
    component.setFilter('TODO');

    expect(component.visibleTasks().length).toBe(2);
    expect(component.visibleTasks().every((task) => task.status === 'TODO')).toBe(true);
  });

  it('persists a task status change before updating the dashboard', async () => {
    await component.toggleTaskCompletion('task-1');
    fixture.detectChanges();

    expect(taskData.setStatus).toHaveBeenCalledWith('task-1', 'COMPLETED');
    expect(component.tasks().find((task) => task.id === 'task-1')?.status).toBe('COMPLETED');
    expect(component.completedCount()).toBe(2);
    expect(component.inProgressCount()).toBe(0);
    expect(component.statusArcLength(component.todoCount())).toBe('138.23 276.46');
  });

  it('creates a task and adds it to the dashboard after Supabase confirms it', async () => {
    component.openCreateTask();
    component.taskForm.title = 'Nueva tarea';
    component.taskForm.description = 'Descripción';
    component.taskForm.tags = 'Equipo, Diseño';
    await component.saveTask();

    expect(taskData.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Nueva tarea',
        tags: ['Equipo', ' Diseño'],
      }),
      expect.objectContaining({ id: 'user-1' }),
    );
    expect(component.tasks()[0]).toEqual(expect.objectContaining({ id: 'task-new' }));
    expect(component.isTaskFormOpen()).toBe(false);
  });

  it('keeps the task form open and displays a persistence error', async () => {
    component.openCreateTask();
    component.taskForm.title = 'No guardar';
    taskData.createTask.mockRejectedValue(new Error('Permiso RLS denegado'));

    await component.saveTask();

    expect(component.isTaskFormOpen()).toBe(true);
    expect(component.taskFormError()).toBe('Permiso RLS denegado');
    expect(component.tasks()).toHaveLength(4);
  });

  it('updates task details and clears the active search and status filter', async () => {
    component.openEditTask(sampleTasks()[0]);
    component.taskForm.title = 'Propuesta actualizada';
    await component.saveTask();

    expect(taskData.updateTask).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({ title: 'Propuesta actualizada' }),
    );
    expect(component.tasks()[0].title).toBe('Propuesta actualizada');

    component.searchTerm.set('sin coincidencia');
    component.setFilter('COMPLETED');
    component.clearTaskFilters();
    expect(component.visibleTasks()).toHaveLength(4);
  });

  it('keeps task status unchanged and reports a persistence error', async () => {
    taskData.setStatus.mockRejectedValue(new Error('Permiso RLS denegado'));

    await component.toggleTaskCompletion('task-1');

    expect(component.tasks().find((task) => task.id === 'task-1')?.status).toBe('IN_PROGRESS');
    expect(component.pageError()).toBe('Permiso RLS denegado');
  });

  it('searches task title, description, and tags', () => {
    const search = fixture.nativeElement.querySelector('#task-search') as HTMLInputElement;
    search.value = 'documentación';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(component.visibleTasks().map((task) => task.id)).toEqual(['task-3']);
  });

  it('shows no tasks when the search does not match', () => {
    const search = fixture.nativeElement.querySelector('#task-search') as HTMLInputElement;
    search.value = 'sin resultados';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No hay tareas que coincidan con esta búsqueda.',
    );
  });

  it('uses the same status counts in the dashboard and chart data', () => {
    expect(component.totalTaskCount()).toBe(4);
    expect(component.todoCount()).toBe(2);
    expect(component.inProgressCount()).toBe(1);
    expect(component.completedCount()).toBe(1);
  });

  it('calculates recorded and estimated hours from live tasks', () => {
    expect(component.loggedHours()).toBe(24.5);
    expect(component.estimatedHours()).toBe(32);
    expect(component.formatHours(component.loggedHours())).toBe('24,5 h');
  });

  it('calculates weekly chart totals from task creation dates', () => {
    const now = new Date();
    component.tasks.set([
      { ...sampleTasks()[0], createdAt: now.toISOString() },
      { ...sampleTasks()[1], createdAt: now.toISOString() },
    ]);

    expect(component.weeklyChart().total).toBe(2);
    expect(component.weeklyChart().points.reduce((total, point) => total + point.count, 0)).toBe(2);
    expect(component.weeklyChart().linePath).toContain('M28');
  });

  it('toggles and persists the night theme', () => {
    component.toggleTheme();
    fixture.detectChanges();

    expect(component.isDarkMode()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('taskflow-theme')).toBe('dark');
    expect(fixture.nativeElement.querySelector('.theme-toggle')?.getAttribute('aria-pressed')).toBe(
      'true',
    );

    component.toggleTheme();
    fixture.detectChanges();
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem('taskflow-theme')).toBe('light');
  });

  it('renders the weekly chart and both Chart.js dashboard charts', () => {
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('.progress-panel__line')).not.toBeNull();
    expect(page.querySelector('[aria-label="Gráfico de dona de tareas por estado"]')).not.toBeNull();
    expect(page.querySelector('[aria-label="Gráfico de barras de horas estimadas y registradas"]')).not.toBeNull();
  });

  it('keeps accessible chart summaries in sync when there are no tasks', () => {
    component.tasks.set([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      '0 por hacer · 0 en curso · 0 completadas',
    );
    expect(fixture.nativeElement.textContent).toContain('0 h estimadas · 0 h registradas');
  });
});

function sampleTasks(): Task[] {
  return [
    {
      id: 'task-1',
      createdByUserId: 'user-1',
      createdAt: '2026-10-27T10:00:00Z',
      title: 'Preparar propuesta para el cliente',
      description: 'Revisar el briefing y cerrar el primer borrador.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignedUserName: 'Lucía Martín',
      assignedUserInitials: 'LM',
      dueLabel: 'Sin fecha límite',
      tags: ['Diseño', 'Cliente'],
      subtasks: [],
      subtasksCompleted: 2,
      subtasksTotal: 4,
      estimatedHours: 8,
      loggedHours: 6.5,
    },
    {
      id: 'task-2',
      createdByUserId: 'user-1',
      createdAt: '2026-10-27T10:00:00Z',
      title: 'Revisión de métricas del sprint',
      description: 'Compartir los resultados en la reunión de equipo.',
      status: 'TODO',
      priority: 'MEDIUM',
      assignedUserName: 'Diego Ruiz',
      assignedUserInitials: 'DR',
      dueLabel: 'Sin fecha límite',
      tags: ['Equipo'],
      subtasks: [],
      subtasksCompleted: 0,
      subtasksTotal: 3,
      estimatedHours: 8,
      loggedHours: 5,
    },
    {
      id: 'task-3',
      createdByUserId: 'user-1',
      createdAt: '2026-10-27T10:00:00Z',
      title: 'Actualizar documentación del producto',
      description: 'Añadir los últimos cambios del flujo de registro.',
      status: 'TODO',
      priority: 'LOW',
      assignedUserName: 'Marta Gil',
      assignedUserInitials: 'MG',
      dueLabel: 'Sin fecha límite',
      tags: ['Documentación'],
      subtasks: [],
      subtasksCompleted: 1,
      subtasksTotal: 3,
      estimatedHours: 8,
      loggedHours: 7,
    },
    {
      id: 'task-4',
      createdByUserId: 'user-1',
      createdAt: '2026-10-27T10:00:00Z',
      title: 'Preparar recursos para la presentación',
      description: 'Organizar capturas y materiales para la demo.',
      status: 'COMPLETED',
      priority: 'LOW',
      assignedUserName: 'Pablo León',
      assignedUserInitials: 'PL',
      dueLabel: 'Sin fecha límite',
      tags: ['Producto'],
      subtasks: [],
      subtasksCompleted: 3,
      subtasksTotal: 3,
      estimatedHours: 8,
      loggedHours: 6,
    },
  ];
}
