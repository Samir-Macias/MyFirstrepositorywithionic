import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GithubIntegrationService } from '../../../core/services/github-integration.service';
import { GitHubPullRequest, GitHubSyncResponse } from '../../../core/models/github.models';

@Component({
  selector: 'app-pr-link-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="closeModal()" role="presentation">
      <div class="modal-content" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">Vincular Pull Request</h2>
          <button
            class="close-btn"
            (click)="closeModal()"
            aria-label="Cerrar diálogo"
            type="button"
          >
            ✕
          </button>
        </div>

        <div class="modal-body">
          <form [formGroup]="form" (ngSubmit)="linkPR()">
            <div class="form-group">
              <label for="pr-url" class="form-label">URL del Pull Request:</label>
              <input
                id="pr-url"
                type="url"
                class="form-input"
                formControlName="prUrl"
                placeholder="https://github.com/owner/repo/pull/123"
                aria-required="true"
                [attr.aria-invalid]="isUrlInvalid()"
              />
              <small class="form-hint">
                Ejemplo: https://github.com/owner/repo/pull/42
              </small>
              <div *ngIf="isUrlInvalid()" class="form-error" role="alert">
                URL de GitHub inválida
              </div>
            </div>

            <div *ngIf="syncResponse" class="response-message" [ngClass]="syncResponse.success ? 'success' : 'error'">
              {{ syncResponse.message }}
              <div *ngIf="syncResponse.linkedPR" class="pr-info">
                <strong>PR #{{ syncResponse.linkedPR.number }}</strong>: {{ syncResponse.linkedPR.title }}
                <span class="pr-state" [ngClass]="syncResponse.linkedPR.merged ? 'merged' : syncResponse.linkedPR.state">
                  {{ syncResponse.linkedPR.merged ? 'Merged' : syncResponse.linkedPR.state }}
                </span>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="closeModal()"
                [disabled]="isLoading"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="form.invalid || isLoading"
                [attr.aria-busy]="isLoading"
              >
                {{ isLoading ? 'Vinculando...' : 'Vincular PR' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background-color: #f3f4f6;
      color: #111827;
    }

    .close-btn:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #374151;
      font-size: 0.95rem;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.95rem;
      font-family: monospace;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input[aria-invalid='true'] {
      border-color: #ef4444;
      background-color: #fef2f2;
    }

    .form-hint {
      display: block;
      margin-top: 6px;
      font-size: 0.85rem;
      color: #6b7280;
    }

    .form-error {
      color: #dc2626;
      font-size: 0.85rem;
      margin-top: 6px;
      font-weight: 500;
    }

    .response-message {
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 0.95rem;
      animation: slideIn 0.3s ease-out;
    }

    .response-message.success {
      background-color: #dcfce7;
      color: #15803d;
      border-left: 4px solid #22c55e;
    }

    .response-message.error {
      background-color: #fee2e2;
      color: #991b1b;
      border-left: 4px solid #ef4444;
    }

    .pr-info {
      margin-top: 8px;
      font-size: 0.9rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pr-state {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      width: fit-content;
    }

    .pr-state.open {
      background-color: #dcfce7;
      color: #15803d;
    }

    .pr-state.closed {
      background-color: #fecaca;
      color: #7f1d1d;
    }

    .pr-state.merged {
      background-color: #ddd6fe;
      color: #5b21b6;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2563eb;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .btn-primary:focus {
      outline: 2px solid #1e40af;
      outline-offset: 2px;
    }

    .btn-primary:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .btn-secondary {
      background-color: #e5e7eb;
      color: #111827;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #d1d5db;
    }

    .btn-secondary:focus {
      outline: 2px solid #9ca3af;
      outline-offset: 2px;
    }

    .btn-secondary:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  `,
})
export class PrLinkModalComponent {
  @Input() isOpen = false;
  @Input() taskId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() linked = new EventEmitter<{ prNumber: number; url: string }>();

  form: FormGroup;
  isLoading = false;
  syncResponse: GitHubSyncResponse | null = null;

  constructor(
    private fb: FormBuilder,
    private githubService: GithubIntegrationService
  ) {
    this.form = this.fb.group({
      prUrl: ['', [Validators.required, this.urlValidator.bind(this)]],
    });
  }

  urlValidator(control: any): { [key: string]: any } | null {
    if (!control.value) return null;
    return this.githubService.isValidGitHubUrl(control.value) ? null : { invalidUrl: true };
  }

  isUrlInvalid(): boolean {
    const control = this.form.get('prUrl');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  linkPR(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.syncResponse = null;

    const prUrl = this.form.get('prUrl')?.value;
    const parsed = this.githubService.parseGitHubUrl(prUrl);

    if (!parsed || parsed.type !== 'pr') {
      this.syncResponse = {
        success: false,
        message: 'URL de PR inválida',
      };
      this.isLoading = false;
      return;
    }

    this.githubService.linkGitHubToTask({
      taskId: this.taskId,
      githubUrl: prUrl,
      type: 'pr',
      prNumber: parsed.number,
    }).subscribe(
      (response) => {
        this.syncResponse = response;
        this.isLoading = false;

        if (response.success && response.linkedPR) {
          setTimeout(() => {
            this.linked.emit({
              prNumber: parsed.number,
              url: prUrl,
            });
            this.closeModal();
          }, 1500);
        }
      },
      (error) => {
        this.syncResponse = {
          success: false,
          message: 'Error al vincular PR',
          error: error.message,
        };
        this.isLoading = false;
      }
    );
  }

  closeModal(): void {
    this.form.reset();
    this.syncResponse = null;
    this.close.emit();
  }
}
