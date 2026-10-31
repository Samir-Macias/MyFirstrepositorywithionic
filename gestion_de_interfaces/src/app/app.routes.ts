import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { pendingChangesGuard } from './core/auth/pending-changes.guard';
import { roleActivateGuard, roleMatchGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'auth',
    redirectTo: 'login',
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./core/pages/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: 'workspace',
    canActivate: [authGuard, roleActivateGuard(['USER', 'CORP_ADMIN'])],
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar.component').then((m) => m.CalendarComponent),
      },
      {
        path: 'activity-feed',
        loadComponent: () =>
          import('./features/workspace/activity-feed/activity-feed.component').then(
            (m) => m.ActivityFeedComponent,
          ),
        canActivate: [roleActivateGuard(['CORP_ADMIN'])],
      },
      {
        path: 'task-editor',
        loadComponent: () =>
          import('./features/workspace/task-editor/task-editor.component').then(
            (m) => m.TaskEditorComponent,
          ),
        canDeactivate: [pendingChangesGuard],
      },
      {
        path: 'task-editor/:id',
        loadComponent: () =>
          import('./features/workspace/task-editor/task-editor.component').then(
            (m) => m.TaskEditorComponent,
          ),
        canDeactivate: [pendingChangesGuard],
      },
      {
        path: 'team-management',
        loadComponent: () =>
          import('./features/workspace/team-management/team-management.component').then(
            (m) => m.TeamManagementComponent,
          ),
        canActivate: [roleActivateGuard(['CORP_ADMIN'])],
      },
    ],
  },
  {
    path: 'admin',
    canMatch: [roleMatchGuard(['SUPER_ADMIN'])],
    canActivate: [roleActivateGuard(['SUPER_ADMIN'])],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'home',
    redirectTo: 'workspace',
    pathMatch: 'full',
  },
  {
    path: 'calendar',
    redirectTo: 'workspace/calendar',
    pathMatch: 'full',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./core/pages/not-found.component').then((m) => m.NotFoundComponent),
  },
];
