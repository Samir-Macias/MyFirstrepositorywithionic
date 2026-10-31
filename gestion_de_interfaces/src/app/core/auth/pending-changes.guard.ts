import { CanDeactivateFn } from '@angular/router';

export interface ComponentCanDeactivate {
  canDeactivate(): boolean;
}

export const pendingChangesGuard: CanDeactivateFn<ComponentCanDeactivate> = (component) =>
  component.canDeactivate();
