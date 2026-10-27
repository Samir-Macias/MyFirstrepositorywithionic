import { Component, input, output } from '@angular/core';
import { TaskStatusFilter } from '../../../core/models/task.model';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly detail = input.required<string>();
  readonly tone = input<'violet' | 'blue' | 'green' | 'orange'>('violet');
  readonly filter = input<TaskStatusFilter>('ALL');
  readonly filterSelected = output<TaskStatusFilter>();
}
