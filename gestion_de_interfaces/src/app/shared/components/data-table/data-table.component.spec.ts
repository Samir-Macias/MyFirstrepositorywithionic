import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task } from '../../../core/models/task.model';
import { DataTableComponent } from './data-table.component';

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    fixture.componentRef.setInput('tasks', sampleTasks());
    fixture.componentRef.setInput('currentUserId', 'user-1');
    fixture.detectChanges();
  });

  it('searches tasks and filters by status and priority', () => {
    const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'informe';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Informe de ventas');
    expect(fixture.nativeElement.textContent).not.toContain('Diseñar portada');

    search.value = '';
    search.dispatchEvent(new Event('input'));
    const priority = fixture.nativeElement.querySelectorAll('select')[1] as HTMLSelectElement;
    priority.value = 'HIGH';
    priority.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Informe de ventas');
    expect(fixture.nativeElement.textContent).not.toContain('Diseñar portada');
  });

  it('emits status, edit, and owner-only delete actions', () => {
    const component = fixture.componentInstance;
    const statusChange = vi.fn();
    const edit = vi.fn();
    const remove = vi.fn();
    component.statusChange.subscribe(statusChange);
    component.editRequested.subscribe(edit);
    component.deleteRequested.subscribe(remove);

    const status = fixture.nativeElement.querySelector('.data-table__status') as HTMLSelectElement;
    status.value = 'COMPLETED';
    status.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(statusChange).toHaveBeenCalledWith({
      taskId: 'task-1',
      status: 'COMPLETED',
    });

    const buttons = fixture.nativeElement.querySelectorAll('.data-table__actions button');
    (buttons[0] as HTMLButtonElement).click();
    (buttons[1] as HTMLButtonElement).click();
    expect(edit).toHaveBeenCalledWith(sampleTasks()[0]);
    expect(remove).toHaveBeenCalledWith(sampleTasks()[0]);

    fixture.componentRef.setInput('currentUserId', 'other-user');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.data-table__delete')).toHaveLength(0);
  });
});

function sampleTasks(): Task[] {
  return [
    {
      id: 'task-1',
      createdByUserId: 'user-1',
      createdAt: '2026-10-29T10:00:00Z',
      title: 'Informe de ventas',
      description: 'Preparar el resumen semanal.',
      status: 'TODO',
      priority: 'HIGH',
      tags: ['Comercial'],
      subtasks: [],
      estimatedHours: 3,
      loggedHours: 1,
    },
    {
      id: 'task-2',
      createdByUserId: 'other-user',
      createdAt: '2026-10-29T10:00:00Z',
      title: 'Diseñar portada',
      description: 'Ajustar la portada del informe.',
      status: 'COMPLETED',
      priority: 'LOW',
      tags: ['Diseño'],
      subtasks: [],
      estimatedHours: 2,
      loggedHours: 2,
    },
  ];
}
