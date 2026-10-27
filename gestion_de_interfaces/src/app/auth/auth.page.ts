import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrl: './auth.page.scss',
  imports: [FormsModule, IonContent, RouterLink],
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly isSignUp = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly noticeMessage = signal('');
  email = '';
  password = '';
  fullName = '';

  constructor() {
    if (this.route.snapshot.queryParamMap.get('error') === 'session') {
      this.errorMessage.set('No se pudo comprobar tu sesión. Inténtalo de nuevo.');
    }
  }

  async submit(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.noticeMessage.set('');

    try {
      if (this.isSignUp()) {
        const hasSession = await this.auth.signUp(
          this.email.trim(),
          this.password,
          this.fullName.trim(),
        );
        if (!hasSession) {
          this.noticeMessage.set(
            'Cuenta creada. Revisa tu correo para confirmar la dirección antes de iniciar sesión.',
          );
          return;
        }
      } else {
        await this.auth.signIn(this.email.trim(), this.password);
      }

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const targetUrl =
        returnUrl === '/home' ||
        returnUrl?.startsWith('/home?') ||
        returnUrl?.startsWith('/home#')
          ? returnUrl
          : '/home';
      await this.router.navigateByUrl(targetUrl);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Se produjo un error inesperado.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  toggleMode(): void {
    this.isSignUp.update((value) => !value);
    this.errorMessage.set('');
    this.noticeMessage.set('');
  }
}
