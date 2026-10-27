import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
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

  it('toggles a task between completed and pending', () => {
    const completionButton = fixture.nativeElement.querySelector(
      '.task-card__check',
    ) as HTMLButtonElement;
    completionButton.click();
    fixture.detectChanges();

    expect(component.tasks().find((task) => task.id === 'task-1')?.status).toBe('COMPLETED');
    expect(component.completedCount()).toBe(2);
    expect(component.inProgressCount()).toBe(0);
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
