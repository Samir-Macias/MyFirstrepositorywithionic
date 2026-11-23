import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GitHubSyncStatus } from '../../../core/models/github.models';
import { GithubIntegrationService } from '../../../core/services/github-integration.service';

@Component({
  selector: 'app-github-sync-status-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sync-status-container" [attr.aria-label]="'GitHub sync status: ' + (statusText$ | async)">
      <div
        class="status-badge"
        [ngStyle]="{ backgroundColor: statusColor$ | async }"
        [attr.aria-live]="'polite'"
      >
        <ng-container [ngSwitch]="syncStatus$ | async">
          <span *ngSwitchCase="'synced'" class="status-icon" aria-hidden="true">✓</span>
          <span *ngSwitchCase="'syncing'" class="status-icon spinner" aria-hidden="true">⟳</span>
          <span *ngSwitchCase="'error'" class="status-icon" aria-hidden="true">!</span>
          <span *ngSwitchDefault class="status-icon" aria-hidden="true">○</span>
        </ng-container>
      </div>
      <span class="status-text">{{ statusText$ | async }}</span>
    </div>
  `,
  styles: `
    .sync-status-container {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      padding: 4px 0;
    }

    .status-badge {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .status-icon {
      display: inline-block;
    }

    .status-icon.spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .status-text {
      color: #374151;
      font-weight: 500;
    }
  `,
})
export class GithubSyncStatusIndicatorComponent implements OnInit {
  @Input() taskId!: string;

  syncStatus$!: Observable<GitHubSyncStatus>;
  statusColor$!: Observable<string>;
  statusText$!: Observable<string>;

  constructor(private githubService: GithubIntegrationService) {}

  ngOnInit(): void {
    if (!this.taskId) {
      throw new Error('taskId es requerido para GithubSyncStatusIndicatorComponent');
    }

    this.syncStatus$ = this.githubService.getSyncStatus$(this.taskId);

    this.statusColor$ = this.syncStatus$.pipe(
      map((status) => this.githubService.getStatusColor(status))
    );

    this.statusText$ = this.syncStatus$.pipe(
      map((status) => this.githubService.getStatusText(status))
    );
  }
}
