import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { Task } from '../../../core/models/task.model';
import { TaskDataService } from '../../../core/tasks/task-data.service';
import { TaskEditorComponent } from './task-editor.component';

@Component({ standalone: true, template: '' })
class WorkspaceStubComponent {}

describe('TaskEditorComponent', () => {
  let fixture: ComponentFixture<TaskEditorComponent>;
  let component: TaskEditorComponent;
  let taskData: {
    loadTasks: ReturnType<typeof vi.fn>;
    createTask: ReturnType<typeof vi.fn>;
    updateTask: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    taskData = {
      loadTasks: vi.fn().mockResolvedValue([sampleTask()]),
      createTask: vi.fn().mockResolvedValue(sampleTask()),
      updateTask: vi.fn().mockResolvedValue(sampleTask()),
    };
    await TestBed.configureTestingModule({
      imports: [TaskEditorComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: TaskDataService, useValue: taskData },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1', user_metadata: {}, email: 'user@example.test' }),
          },
        },
        provideRouter([{ path: 'workspace', component: WorkspaceStubComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps new task forms clean until edited and asks before discarding changes', () => {
    expect(component.canDeactivate()).toBe(true);

    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.taskForm.controls.title.setValue('Cambio sin guardar');
    component.taskForm.markAsDirty();

    expect(component.canDeactivate()).toBe(false);
    expect(confirm).toHaveBeenCalledWith(
      'Hay cambios sin guardar. ¿Quieres salir sin guardarlos?',
    );
    confirm.mockRestore();
  });

  it('creates a task, marks the form clean, and navigates to the workspace', async () => {
    component.taskForm.controls.title.setValue('Nueva tarea');

    await component.saveTask();
    await fixture.whenStable();

    expect(taskData.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Nueva tarea', dueDate: null }),
      expect.objectContaining({ id: 'user-1' }),
    );
    expect(component.taskForm.pristine).toBe(true);
  });
});

function sampleTask(): Task {
  return {
    id: 'task-1',
    createdByUserId: 'user-1',
    createdAt: '2026-10-29T09:00:00Z',
    title: 'Preparar informe',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    tags: [],
    subtasks: [],
    estimatedHours: 0,
    loggedHours: 0,
  };
}
