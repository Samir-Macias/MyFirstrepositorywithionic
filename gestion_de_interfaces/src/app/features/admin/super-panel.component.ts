import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-super-panel',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="admin-panel">
      <header>
        <p>ADMINISTRACIÓN GLOBAL</p>
        <h1>Panel Global</h1>
      </header>
      <section>
        <h2>Espacios de trabajo</h2>
        <p role="status">
          La creación de espacios estará disponible cuando se configure la persistencia de espacios
          de trabajo y sus permisos.
        </p>
      </section>
      @if (errorMessage()) {
        <p role="alert">{{ errorMessage() }}</p>
      }
      <button type="button" (click)="signOut()">Cerrar sesión</button>
      <a routerLink="/login">Volver al inicio de sesión</a>
    </main>
  `,
  styles: [`
    .admin-panel { max-width: 54rem; margin: 8vh auto; padding: 2rem; font-family: system-ui, sans-serif; color: #20243a; }
    header, section { margin-bottom: 2rem; padding: 1.5rem; background: #fff; border: 1px solid #e8eaf1; border-radius: .7rem; }
    header p { color: #6757d9; font-size: .75rem; font-weight: 700; }
    section p { color: #62677b; }
    button, a { margin-right: 1rem; color: #6757d9; }
  `],
})
export class SuperPanelComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly errorMessage = signal('');

  async signOut(): Promise<void> {
    this.errorMessage.set('');
    try {
      await this.auth.signOut();
      await this.router.navigateByUrl('/login');
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudo cerrar la sesión.',
      );
    }
  }
}
