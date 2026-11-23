import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import {
  GitHubPullRequest,
  GitHubIssue,
  GitHubSyncResponse,
  GitHubLinkRequest,
  GitHubSyncStatus,
  TaskGitHubLink,
} from '../models/github.models';

@Injectable({
  providedIn: 'root',
})
export class GithubIntegrationService {
  private readonly API_BASE = 'https://api.github.com';
  
  private syncStatus$ = new BehaviorSubject<Map<string, GitHubSyncStatus>>(new Map());

  constructor(private http: HttpClient) {}

  /**
   * Parse GitHub URL to extract owner, repo, type (pr/issue), and number
   */
  parseGitHubUrl(
    url: string
  ): { owner: string; repo: string; type: 'pr' | 'issue'; number: number } | null {
    const prRegex = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
    const issueRegex = /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/;

    const prMatch = url.match(prRegex);
    if (prMatch) {
      return {
        owner: prMatch[1],
        repo: prMatch[2],
        type: 'pr',
        number: parseInt(prMatch[3], 10),
      };
    }

    const issueMatch = url.match(issueRegex);
    if (issueMatch) {
      return {
        owner: issueMatch[1],
        repo: issueMatch[2],
        type: 'issue',
        number: parseInt(issueMatch[3], 10),
      };
    }

    return null;
  }

  /**
   * Fetch PR details from GitHub API (requires GitHub token)
   * Note: In production, this should be done server-side to avoid exposing token
   */
  fetchPullRequest(
    owner: string,
    repo: string,
    prNumber: number,
    token?: string
  ): Observable<GitHubPullRequest> {
    const url = `${this.API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}`;
    const headers = token ? { Authorization: `token ${token}` } : {};

    return this.http.get<GitHubPullRequest>(url, { headers }).pipe(
      catchError(() => {
        console.error(`Failed to fetch PR #${prNumber} from ${owner}/${repo}`);
        return of(null as any);
      })
    );
  }

  /**
   * Fetch Issue details from GitHub API
   */
  fetchIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    token?: string
  ): Observable<GitHubIssue> {
    const url = `${this.API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}`;
    const headers = token ? { Authorization: `token ${token}` } : {};

    return this.http.get<GitHubIssue>(url, { headers }).pipe(
      catchError(() => {
        console.error(`Failed to fetch Issue #${issueNumber} from ${owner}/${repo}`);
        return of(null as any);
      })
    );
  }

  /**
   * Link GitHub PR/Issue to a task
   * Updates task with GitHub metadata and sets sync status
   */
  linkGitHubToTask(linkRequest: GitHubLinkRequest): Observable<GitHubSyncResponse> {
    const parsed = this.parseGitHubUrl(linkRequest.githubUrl);

    if (!parsed) {
      return of({
        success: false,
        message: 'Invalid GitHub URL format',
        error: 'URL debe ser: https://github.com/owner/repo/pull/123 o https://github.com/owner/repo/issues/456',
      });
    }

    // Update sync status to "syncing"
    this.updateSyncStatus(linkRequest.taskId, GitHubSyncStatus.SYNCING);

    // Fetch the GitHub object details
    const fetchRequest$ =
      parsed.type === 'pr'
        ? this.fetchPullRequest(parsed.owner, parsed.repo, parsed.number)
        : this.fetchIssue(parsed.owner, parsed.repo, parsed.number);

    return fetchRequest$.pipe(
      map((githubObject) => {
        if (!githubObject) {
          this.updateSyncStatus(linkRequest.taskId, GitHubSyncStatus.ERROR);
          return {
            success: false,
            message: 'Could not fetch GitHub object',
            error: `${parsed.type} #${parsed.number} no encontrado`,
          };
        }

        // This response will be handled by the component
        // which will make the actual Supabase update
        const response: GitHubSyncResponse = {
          success: true,
          message: `${parsed.type.toUpperCase()} #${parsed.number} vinculado correctamente`,
        };

        if (parsed.type === 'pr') {
          response.linkedPR = githubObject as GitHubPullRequest;
        } else {
          response.linkedIssue = githubObject as GitHubIssue;
        }

        this.updateSyncStatus(linkRequest.taskId, GitHubSyncStatus.SYNCED);
        return response;
      }),
      catchError((error) => {
        this.updateSyncStatus(linkRequest.taskId, GitHubSyncStatus.ERROR);
        return of({
          success: false,
          message: 'Error al vincular GitHub',
          error: error.message,
        });
      })
    );
  }

  /**
   * Map GitHub state to Taskflow status
   */
  mapGitHubStateToStatus(
    type: 'pr' | 'issue',
    state: 'open' | 'closed',
    merged?: boolean
  ): string {
    if (type === 'pr') {
      if (state === 'open') return 'in_progress';
      if (merged) return 'completed';
      return 'failed'; // PR closed without merge
    }

    if (type === 'issue') {
      if (state === 'open') return 'pending';
      return 'completed';
    }

    return 'pending';
  }

  /**
   * Update sync status for a task
   */
  updateSyncStatus(taskId: string, status: GitHubSyncStatus): void {
    const current = this.syncStatus$.value;
    current.set(taskId, status);
    this.syncStatus$.next(new Map(current));
  }

  /**
   * Get sync status for a task
   */
  getSyncStatus$(taskId: string): Observable<GitHubSyncStatus> {
    return this.syncStatus$.pipe(
      map((statusMap) => statusMap.get(taskId) || GitHubSyncStatus.UNLINKED)
    );
  }

  /**
   * Get all sync statuses
   */
  getAllSyncStatuses$(): Observable<Map<string, GitHubSyncStatus>> {
    return this.syncStatus$.asObservable();
  }

  /**
   * Reset sync status for a task (when unlinking)
   */
  resetSyncStatus(taskId: string): void {
    const current = this.syncStatus$.value;
    current.delete(taskId);
    this.syncStatus$.next(new Map(current));
  }

  /**
   * Format GitHub URL for display
   */
  formatGitHubUrl(owner: string, repo: string, type: 'pr' | 'issue', number: number): string {
    return `https://github.com/${owner}/${repo}/${type === 'pr' ? 'pull' : 'issues'}/${number}`;
  }

  /**
   * Extract repository info from GitHub URL
   */
  extractRepoInfo(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)(\/|$)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
      };
    }
    return null;
  }

  /**
   * Check if a URL is a valid GitHub link
   */
  isValidGitHubUrl(url: string): boolean {
    return this.parseGitHubUrl(url) !== null;
  }

  /**
   * Get status badge color based on sync status
   */
  getStatusColor(status: GitHubSyncStatus): string {
    switch (status) {
      case GitHubSyncStatus.SYNCED:
        return '#10b981'; // green
      case GitHubSyncStatus.SYNCING:
        return '#f59e0b'; // amber
      case GitHubSyncStatus.ERROR:
        return '#ef4444'; // red
      case GitHubSyncStatus.UNLINKED:
        return '#6b7280'; // gray
      default:
        return '#6b7280';
    }
  }

  /**
   * Get status text
   */
  getStatusText(status: GitHubSyncStatus): string {
    switch (status) {
      case GitHubSyncStatus.SYNCED:
        return 'Sincronizado';
      case GitHubSyncStatus.SYNCING:
        return 'Sincronizando...';
      case GitHubSyncStatus.ERROR:
        return 'Error en sincronización';
      case GitHubSyncStatus.UNLINKED:
        return 'No vinculado';
      default:
        return 'Desconocido';
    }
  }
}
