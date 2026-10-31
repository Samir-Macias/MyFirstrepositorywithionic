import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';

registerLocaleData(localeEs);

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements OnInit {
  private readonly taskService = inject(TaskService);

  readonly weekDays: readonly string[] = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  readonly currentDate = signal<Date>(new Date());
  readonly selectedDate = signal<Date>(new Date());
  readonly monthlyTasks = signal<Task[]>([]);
  readonly isLoading = signal(false);
  readonly loadError = signal('');

  readonly selectedDayTasks = computed(() => {
    const selected = this.selectedDate();
    return this.monthlyTasks().filter((task) => this.taskMatchesDate(task, selected));
  });

  readonly calendarGrid = computed<CalendarDay[]>(() => {
    const current = this.currentDate();
    const year = current.getFullYear();
    const month = current.getMonth();
    const tasks = this.monthlyTasks();
    const today = new Date();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const days: CalendarDay[] = [];

    for (let offset = startDayIndex; offset > 0; offset--) {
      const date = new Date(year, month, 1 - offset);
      days.push({ date, dayNumber: date.getDate(), isCurrentMonth: false, isToday: false, tasks: [] });
    }

    for (let day = 1; day <= lastDayOfMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, today),
        tasks: tasks.filter((task) => this.taskMatchesDate(task, date)),
      });
    }

    for (let day = 1; days.length < 42; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, dayNumber: day, isCurrentMonth: false, isToday: false, tasks: [] });
    }

    return days;
  });

  async ngOnInit(): Promise<void> {
    await this.fetchMonthTasks();
  }

  async previousMonth(): Promise<void> {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    await this.fetchMonthTasks();
  }

  async nextMonth(): Promise<void> {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    await this.fetchMonthTasks();
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
  }

  isSameDay(dateA: Date, dateB: Date): boolean {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  }

  private taskMatchesDate(task: Task, date: Date): boolean {
    if (!task.dueDate) {
      return false;
    }

    const taskDate = this.parseTaskDate(task.dueDate);
    return taskDate !== null && this.isSameDay(taskDate, date);
  }

  private parseTaskDate(value: string): Date | null {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = dateOnly
      ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
      : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private async fetchMonthTasks(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');
    try {
      const current = this.currentDate();
      this.monthlyTasks.set(
        await this.taskService.getTasksByMonth(current.getFullYear(), current.getMonth()),
      );
    } catch (error) {
      this.loadError.set(
        error instanceof Error ? error.message : 'No se pudieron cargar las tareas del calendario.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
