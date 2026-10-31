import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="route-message">
      <h1>Página no encontrada</h1>
      <p>La dirección solicitada no existe.</p>
      <a routerLink="/workspace">Volver al espacio de trabajo</a>
    </main>
  `,
  styles: [`
    .route-message { max-width: 36rem; margin: 15vh auto; padding: 2rem; text-align: center; font-family: system-ui, sans-serif; }
    .route-message h1 { color: #20243a; }
    .route-message p { color: #62677b; }
    .route-message a { color: #6757d9; }
  `],
})
export class NotFoundComponent {}
