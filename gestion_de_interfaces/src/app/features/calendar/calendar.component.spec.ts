import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { CalendarComponent } from './calendar.component';

describe('CalendarComponent', () => {
  let fixture: ComponentFixture<CalendarComponent>;
  let component: CalendarComponent;
  let getTasksByMonth: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getTasksByMonth = vi.fn().mockResolvedValue([sampleTask()]);
    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [
        { provide: TaskService, useValue: { getTasksByMonth } },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    component.currentDate.set(new Date(2026, 9, 1));
    component.selectedDate.set(new Date(2026, 9, 10));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads the selected month and renders the 42-day grid with matching tasks', () => {
    expect(getTasksByMonth).toHaveBeenCalledWith(2026, 9);
    expect(component.calendarGrid()).toHaveLength(42);
    expect(component.selectedDayTasks().map((task) => task.id)).toEqual(['task-1']);
    expect(fixture.nativeElement.textContent).toContain('Preparar informe');
  });

  it('shows an explicit error when the month cannot be loaded', async () => {
    getTasksByMonth.mockRejectedValueOnce(new Error('No hay conexión'));
    await component.nextMonth();
    fixture.detectChanges();

    expect(component.loadError()).toBe('No hay conexión');
    expect(fixture.nativeElement.textContent).toContain('No hay conexión');
  });
});

function sampleTask(): Task {
  return {
    id: 'task-1',
    createdByUserId: 'user-1',
    createdAt: '2026-10-01T10:00:00.000Z',
    dueDate: '2026-10-10',
    title: 'Preparar informe',
    description: 'Revisar el informe final',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignedUserName: 'Lucía Martín',
    tags: [],
    subtasks: [],
    estimatedHours: 2,
    loggedHours: 0,
  };
}
