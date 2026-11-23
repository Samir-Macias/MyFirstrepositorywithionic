/**
 * GitHub Integration Models
 * Types for PR, Issue, and Repository data
 */

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  description: string | null;
  private: boolean;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  merged: boolean;
  draft: boolean;
  author_association: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  html_url: string;
  diff_url: string;
  patch_url: string;
  review_comments: number;
  comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  state_reason?: 'completed' | 'not_planned';
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  comments: number;
  reactions: {
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

export interface GitHubWebhookPayload {
  action: string;
  pull_request?: GitHubPullRequest;
  issue?: GitHubIssue;
  repository: GitHubRepository;
  sender: {
    login: string;
    avatar_url: string;
  };
}

export interface TaskGitHubLink {
  taskId: string;
  github_pr_number?: number;
  github_issue_number?: number;
  github_url: string;
  github_updated_at: string;
  sync_status: 'synced' | 'syncing' | 'error';
  sync_error?: string;
}

export interface GitHubSyncResponse {
  success: boolean;
  message: string;
  linkedPR?: GitHubPullRequest;
  linkedIssue?: GitHubIssue;
  error?: string;
}

export interface GitHubLinkRequest {
  taskId: string;
  githubUrl: string;
  type: 'pr' | 'issue';
  prNumber?: number;
  issueNumber?: number;
}

export enum GitHubSyncStatus {
  SYNCED = 'synced',
  SYNCING = 'syncing',
  ERROR = 'error',
  UNLINKED = 'unlinked',
}

export interface GitHubWebhookEvent {
  event_type: 'pull_request' | 'issues';
  action: string;
  taskId: string;
  newStatus: string;
  timestamp: string;
  payload: GitHubWebhookPayload;
}
