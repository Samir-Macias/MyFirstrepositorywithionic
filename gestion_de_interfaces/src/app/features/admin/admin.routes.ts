import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'super-panel',
    loadComponent: () =>
      import('./super-panel/super-panel.component').then((module) => module.SuperPanelComponent),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'super-panel',
  },
];
