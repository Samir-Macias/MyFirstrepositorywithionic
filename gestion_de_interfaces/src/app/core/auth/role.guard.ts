import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AppRole, AuthService } from './auth.service';

async function checkRoles(allowedRoles: readonly AppRole[]) {
  const auth = inject(AuthService);
  const router = inject(Router);

  try {
    const session = await auth.getSession();
    if (!session) {
      return router.createUrlTree(['/login']);
    }

    return auth.roles().some((role) => allowedRoles.includes(role))
      ? true
      : router.createUrlTree(['/forbidden']);
  } catch (error) {
    console.error('No se pudo comprobar el rol de la sesión.', error);
    return router.createUrlTree(['/login'], { queryParams: { error: 'session' } });
  }
}

export function roleMatchGuard(allowedRoles: readonly AppRole[]): CanMatchFn {
  return () => checkRoles(allowedRoles);
}

export function roleActivateGuard(allowedRoles: readonly AppRole[]): CanActivateFn {
  return () => checkRoles(allowedRoles);
}
