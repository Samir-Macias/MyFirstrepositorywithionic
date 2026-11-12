import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-auth-callback',
  imports: [IonContent, RouterLink],
  template: `
    <ion-content [fullscreen]="true">
      <main class="callback">
        @if (errorMessage()) {
          <h1>No se pudo iniciar sesión</h1>
          <p role="alert">{{ errorMessage() }}</p>
          <a routerLink="/login">Volver a iniciar sesión</a>
        } @else {
          <p role="status">Comprobando tu sesión...</p>
        }
      </main>
    </ion-content>
  `,
  styles: [`
    .callback {
      display: grid;
      min-height: 100%;
      padding: 2rem;
      place-content: center;
      text-align: center;
    }
    a { color: var(--color-avatar-text); font-weight: 700; }
  `],
})
export class AuthCallbackPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly errorMessage = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const target = await this.auth.completeGoogleSignIn();
      await this.router.navigateByUrl(target, { replaceUrl: true });
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudo completar el inicio de sesión.',
      );
    }
  }
}
