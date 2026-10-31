import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Task, TaskPriority, TaskStatus } from '../../../core/models/task.model';
import { TaskDataService, TaskInput } from '../../../core/tasks/task-data.service';
import { ComponentCanDeactivate } from '../../../core/auth/pending-changes.guard';

@Component({
  selector: 'app-task-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './task-editor.component.html',
  styleUrl: './task-editor.component.scss',
})
export class TaskEditorComponent implements OnInit, ComponentCanDeactivate {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskData = inject(TaskDataService);
  private readonly auth = inject(AuthService);

  private taskId: string | null = null;
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly isEditing = signal(false);

  readonly taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', Validators.maxLength(2000)],
    status: ['TODO' as TaskStatus, Validators.required],
    priority: ['MEDIUM' as TaskPriority, Validators.required],
    dueDate: [''],
    tags: [''],
    estimatedHours: [0, [Validators.required, Validators.min(0)]],
    loggedHours: [0, [Validators.required, Validators.min(0)]],
  });

  async ngOnInit(): Promise<void> {
    this.taskId = this.route.snapshot.paramMap.get('id');
    this.isEditing.set(this.taskId !== null);
    if (this.taskId) {
      await this.loadTask(this.taskId);
    }
  }

  canDeactivate(): boolean {
    return (
      !this.taskForm.dirty ||
      this.isSaving() ||
      window.confirm('Hay cambios sin guardar. ¿Quieres salir sin guardarlos?')
    );
  }

  async saveTask(): Promise<void> {
    if (this.taskForm.invalid || this.isSaving()) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    const form = this.taskForm.getRawValue();
    const input: TaskInput = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      tags: form.tags.split(','),
      estimatedHours: Number(form.estimatedHours),
      loggedHours: Number(form.loggedHours),
    };

    try {
      if (this.taskId) {
        await this.taskData.updateTask(this.taskId, input);
      } else {
        const user = this.auth.currentUser();
        if (!user) {
          throw new Error('Tu sesión ha caducado. Inicia sesión de nuevo para crear tareas.');
        }
        await this.taskData.createTask(input, user);
      }

      this.taskForm.markAsPristine();
      await this.router.navigateByUrl('/workspace');
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudo guardar la tarea.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  private async loadTask(taskId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const tasks = await this.taskData.loadTasks();
      const task = tasks.find((item) => item.id === taskId);
      if (!task) {
        throw new Error('No se encontró la tarea o no tienes permiso para editarla.');
      }
      this.patchTask(task);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudo cargar la tarea.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private patchTask(task: Task): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ?? '',
      tags: task.tags.join(', '),
      estimatedHours: task.estimatedHours,
      loggedHours: task.loggedHours,
    });
    this.taskForm.markAsPristine();
  }
}
