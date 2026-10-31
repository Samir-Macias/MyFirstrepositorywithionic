import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="route-message">
      <h1>Acceso restringido</h1>
      <p>Tu usuario no tiene permisos para acceder a esta sección.</p>
      <a routerLink="/login">Volver al inicio de sesión</a>
    </main>
  `,
  styles: [`
    .route-message { max-width: 36rem; margin: 15vh auto; padding: 2rem; text-align: center; font-family: system-ui, sans-serif; }
    .route-message h1 { color: #20243a; }
    .route-message p { color: #62677b; }
    .route-message a { color: #6757d9; }
  `],
})
export class ForbiddenComponent {}
