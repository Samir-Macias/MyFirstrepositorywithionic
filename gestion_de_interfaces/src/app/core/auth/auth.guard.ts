import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  try {
    const session = await auth.getSession();
    return session
      ? true
      : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  } catch (error) {
    console.error('No se pudo comprobar la sesión de Supabase.', error);
    return router.createUrlTree(['/login'], { queryParams: { error: 'session' } });
  }
};
