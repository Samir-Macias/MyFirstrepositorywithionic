import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AuthService } from '../core/auth/auth.service';
import { Task } from '../core/models/task.model';
import { TaskDataService } from '../core/tasks/task-data.service';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let taskData: {
    loadTasks: ReturnType<typeof vi.fn>;
    loadActivity: ReturnType<typeof vi.fn>;
    setStatus: ReturnType<typeof vi.fn>;
    subscribeToChanges: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    taskData = {
      loadTasks: vi.fn().mockResolvedValue(sampleTasks()),
      loadActivity: vi.fn().mockResolvedValue([]),
      setStatus: vi.fn().mockResolvedValue(undefined),
      subscribeToChanges: vi.fn().mockResolvedValue(() => undefined),
    };

    await TestBed.configureTestingModule({
      providers: [
        { provide: TaskDataService, useValue: taskData },
        { provide: AuthService, useValue: { currentUser: signal(null), signOut: vi.fn() } },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

  it('renders the line and doughnut charts without bar-chart markup', () => {
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('.progress-panel__line')).not.toBeNull();
    expect(page.querySelector('.completion-chart__segments')).not.toBeNull();
    expect(page.querySelector('.progress-panel__bars')).toBeNull();
  });

  it('keeps the doughnut chart valid when there are no tasks', () => {
    component.tasks.set([]);
    fixture.detectChanges();

    expect(component.chartTaskTotal()).toBe(1);
    expect(component.statusArcLength(component.todoCount())).toBe('0 276.46');
    expect(fixture.nativeElement.textContent).toContain('0tareas');
  });
});

function sampleTasks(): Task[] {
  return [
    {
      id: 'task-1',
      title: 'Preparar propuesta para el cliente',
      description: 'Revisar el briefing y cerrar el primer borrador.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignedUserName: 'Lucía Martín',
      assignedUserInitials: 'LM',
      dueLabel: 'Sin fecha límite',
      tags: ['Diseño', 'Cliente'],
      subtasksCompleted: 2,
      subtasksTotal: 4,
      estimatedHours: 8,
      loggedHours: 6.5,
    },
    {
      id: 'task-2',
      title: 'Revisión de métricas del sprint',
      description: 'Compartir los resultados en la reunión de equipo.',
      status: 'TODO',
      priority: 'MEDIUM',
      assignedUserName: 'Diego Ruiz',
      assignedUserInitials: 'DR',
      dueLabel: 'Sin fecha límite',
      tags: ['Equipo'],
      subtasksCompleted: 0,
      subtasksTotal: 3,
      estimatedHours: 8,
      loggedHours: 5,
    },
    {
      id: 'task-3',
      title: 'Actualizar documentación del producto',
      description: 'Añadir los últimos cambios del flujo de registro.',
      status: 'TODO',
      priority: 'LOW',
      assignedUserName: 'Marta Gil',
      assignedUserInitials: 'MG',
      dueLabel: 'Sin fecha límite',
      tags: ['Documentación'],
      subtasksCompleted: 1,
      subtasksTotal: 3,
      estimatedHours: 8,
      loggedHours: 7,
    },
    {
      id: 'task-4',
      title: 'Preparar recursos para la presentación',
      description: 'Organizar capturas y materiales para la demo.',
      status: 'COMPLETED',
      priority: 'LOW',
      assignedUserName: 'Pablo León',
      assignedUserInitials: 'PL',
      dueLabel: 'Sin fecha límite',
      tags: ['Producto'],
      subtasksCompleted: 3,
      subtasksTotal: 3,
      estimatedHours: 8,
      loggedHours: 6,
    },
  ];
}
