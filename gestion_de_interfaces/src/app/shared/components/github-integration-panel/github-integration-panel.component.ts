import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GithubIntegrationService } from '../../../core/services/github-integration.service';
import { GithubSyncStatusIndicatorComponent } from '../github-sync-status-indicator/github-sync-status-indicator.component';
import { PrLinkModalComponent } from '../pr-link-modal/pr-link-modal.component';
import { IssueLinkModalComponent } from '../issue-link-modal/issue-link-modal.component';

@Component({
  selector: 'app-github-integration-panel',
  standalone: true,
  imports: [
    CommonModule,
    GithubSyncStatusIndicatorComponent,
    PrLinkModalComponent,
    IssueLinkModalComponent,
  ],
  template: `
    <div class="github-panel" role="region" aria-label="GitHub Integration">
      <div class="panel-header">
        <div class="panel-title">
          <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <h3 class="title-text">Integración GitHub</h3>
        </div>
        <app-github-sync-status-indicator [taskId]="taskId" />
      </div>

      <div class="panel-content">
        <!-- Si hay PR vinculado -->
        <div *ngIf="linkedPR" class="linked-item pr-item">
          <div class="item-header">
            <span class="item-type">PR</span>
            <span class="item-title">{{ linkedPR.title }}</span>
            <span class="item-state" [ngClass]="linkedPR.merged ? 'merged' : linkedPR.state">
              {{ linkedPR.merged ? 'Merged' : linkedPR.state }}
            </span>
          </div>
          <div class="item-meta">
            <small>#{{ linkedPR.number }}</small>
            <span class="meta-separator">•</span>
            <small>por <strong>{{ linkedPR.user.login }}</strong></small>
            <span class="meta-separator">•</span>
            <small>{{ formatDate(linkedPR.updated_at) }}</small>
          </div>
          <div class="item-actions">
            <a [href]="linkedPR.html_url" target="_blank" class="action-link" title="Ver en GitHub">
              Abrir en GitHub ↗
            </a>
            <button (click)="unlinkPR()" class="action-btn unlink-btn" title="Desvinc ular PR">
              Desvincular
            </button>
          </div>
        </div>

        <!-- Si hay Issue vinculado -->
        <div *ngIf="linkedIssue" class="linked-item issue-item">
          <div class="item-header">
            <span class="item-type">Issue</span>
            <span class="item-title">{{ linkedIssue.title }}</span>
            <span class="item-state" [ngClass]="linkedIssue.state">
              {{ linkedIssue.state }}
            </span>
          </div>
          <div class="item-meta">
            <small>#{{ linkedIssue.number }}</small>
            <span class="meta-separator">•</span>
            <small>por <strong>{{ linkedIssue.user.login }}</strong></small>
            <span class="meta-separator">•</span>
            <small>{{ formatDate(linkedIssue.updated_at) }}</small>
          </div>
          <div class="item-actions">
            <a [href]="linkedIssue.html_url" target="_blank" class="action-link" title="Ver en GitHub">
              Abrir en GitHub ↗
            </a>
            <button (click)="unlinkIssue()" class="action-btn unlink-btn" title="Desvinc ular Issue">
              Desvincular
            </button>
          </div>
        </div>

        <!-- Si nada está vinculado -->
        <div *ngIf="!linkedPR && !linkedIssue" class="empty-state">
          <p class="empty-text">No hay PR ni Issue vinculados a esta tarea</p>
          <p class="empty-subtext">Vincula un PR o Issue de GitHub para sincronizar automáticamente el progreso</p>
        </div>
      </div>

      <div class="panel-footer">
        <button
          (click)="openPRModal()"
          class="action-btn primary-btn"
          [disabled]="linkedPR !== null"
          title="Vincular Pull Request"
        >
          + Vincular PR
        </button>
        <button
          (click)="openIssueModal()"
          class="action-btn primary-btn"
          [disabled]="linkedIssue !== null"
          title="Vincular Issue"
        >
          + Vincular Issue
        </button>
      </div>
    </div>

    <!-- Modales -->
    <app-pr-link-modal
      [isOpen]="showPRModal"
      [taskId]="taskId"
      (close)="closePRModal()"
      (linked)="onPRLinked($event)"
    />
    <app-issue-link-modal
      [isOpen]="showIssueModal"
      [taskId]="taskId"
      (close)="closeIssueModal()"
      (linked)="onIssueLinked($event)"
    />
  `,
  styles: `
    .github-panel {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-bottom: 1px solid #e5e7eb;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .github-icon {
      width: 24px;
      height: 24px;
      color: #111827;
    }

    .title-text {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
    }

    .panel-content {
      padding: 16px;
      flex: 1;
      min-height: 100px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .linked-item {
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #f9fafb;
      transition: all 0.2s;
    }

    .linked-item:hover {
      border-color: #d1d5db;
      background: #ffffff;
    }

    .pr-item {
      border-left: 4px solid #3b82f6;
    }

    .issue-item {
      border-left: 4px solid #8b5cf6;
    }

    .item-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .item-type {
      display: inline-block;
      padding: 2px 6px;
      background: #e0e7ff;
      color: #3730a3;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .issue-item .item-type {
      background: #ede9fe;
      color: #6d28d9;
    }

    .item-title {
      flex: 1;
      font-weight: 500;
      color: #111827;
      min-width: 150px;
      word-break: break-word;
    }

    .item-state {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .item-state.open {
      background-color: #dcfce7;
      color: #15803d;
    }

    .item-state.closed {
      background-color: #fecaca;
      color: #7f1d1d;
    }

    .item-state.merged {
      background-color: #ddd6fe;
      color: #5b21b6;
    }

    .item-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      color: #6b7280;
      font-size: 0.85rem;
      flex-wrap: wrap;
    }

    .meta-separator {
      color: #d1d5db;
    }

    .item-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .action-link,
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }

    .action-link {
      color: #3b82f6;
      background: transparent;
      border: 1px solid #93c5fd;
      padding: 6px 10px;
    }

    .action-link:hover {
      background: #eff6ff;
      border-color: #3b82f6;
    }

    .action-link:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .unlink-btn {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
      padding: 6px 10px;
    }

    .unlink-btn:hover {
      background: #fecaca;
      border-color: #dc2626;
    }

    .unlink-btn:focus {
      outline: 2px solid #dc2626;
      outline-offset: 2px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      text-align: center;
      color: #6b7280;
    }

    .empty-text {
      margin: 0 0 8px 0;
      font-weight: 500;
      color: #374151;
    }

    .empty-subtext {
      margin: 0;
      font-size: 0.9rem;
      color: #9ca3af;
    }

    .panel-footer {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      flex-wrap: wrap;
    }

    .primary-btn {
      flex: 1;
      min-width: 150px;
      padding: 10px 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .primary-btn:hover:not(:disabled) {
      background: #2563eb;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .primary-btn:focus {
      outline: 2px solid #1e40af;
      outline-offset: 2px;
    }

    .primary-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      opacity: 0.6;
    }

    @media (max-width: 640px) {
      .panel-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .item-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .item-title {
        min-width: 100%;
      }

      .panel-footer {
        flex-direction: column;
      }

      .primary-btn {
        min-width: 100%;
      }
    }
  `,
})
export class GithubIntegrationPanelComponent implements OnInit {
  @Input() taskId!: string;
  @Input() linkedPR: any = null;
  @Input() linkedIssue: any = null;
  @Output() updated = new EventEmitter<{ prNumber?: number; issueNumber?: number }>();

  showPRModal = false;
  showIssueModal = false;

  constructor(private githubService: GithubIntegrationService) {}

  ngOnInit(): void {
    if (!this.taskId) {
      throw new Error('taskId es requerido para GithubIntegrationPanelComponent');
    }
  }

  openPRModal(): void {
    this.showPRModal = true;
  }

  closePRModal(): void {
    this.showPRModal = false;
  }

  openIssueModal(): void {
    this.showIssueModal = true;
  }

  closeIssueModal(): void {
    this.showIssueModal = false;
  }

  onPRLinked(event: { prNumber: number; url: string }): void {
    this.closePRModal();
    this.updated.emit({ prNumber: event.prNumber });
  }

  onIssueLinked(event: { issueNumber: number; url: string }): void {
    this.closeIssueModal();
    this.updated.emit({ issueNumber: event.issueNumber });
  }

  unlinkPR(): void {
    this.linkedPR = null;
    this.githubService.resetSyncStatus(this.taskId);
  }

  unlinkIssue(): void {
    this.linkedIssue = null;
    this.githubService.resetSyncStatus(this.taskId);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;

    return date.toLocaleDateString('es-ES');
  }
}
