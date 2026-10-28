import { Component, input, output } from '@angular/core';
import { Task } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  readonly canDelete = input(false);
  readonly completionToggled = output<string>();
  readonly editRequested = output<Task>();
  readonly deleteRequested = output<Task>();
}
