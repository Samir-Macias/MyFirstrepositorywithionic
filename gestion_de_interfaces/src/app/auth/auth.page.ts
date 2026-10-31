import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  templateUrl: './auth.page.html',
  styleUrl: './auth.page.scss',
  imports: [CommonModule, ReactiveFormsModule, IonContent, RouterLink],
})
export class AuthPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isRegistration = signal(this.route.snapshot.routeConfig?.path === 'register');
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly noticeMessage = signal('');

  readonly authForm = this.fb.nonNullable.group({
    fullName: [''],
    email: [
      '',
      [Validators.required, Validators.email],
    ],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.get('error') === 'session') {
      this.errorMessage.set('No se pudo comprobar tu sesión. Inténtalo de nuevo.');
    }
    if (this.isRegistration()) {
      this.authForm.controls.fullName.addValidators([Validators.required, Validators.minLength(2)]);
      this.authForm.controls.fullName.updateValueAndValidity({ emitEvent: false });
    }
  }

  async submit(): Promise<void> {
    if (this.isSubmitting() || this.authForm.invalid || this.authForm.pending) {
      this.authForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.noticeMessage.set('');

    const { fullName, email, password } = this.authForm.getRawValue();
    try {
      if (this.isRegistration()) {
        const hasSession = await this.auth.signUp(email.trim(), password, fullName.trim());
        if (!hasSession) {
          this.noticeMessage.set(
            'Si la cuenta puede registrarse, recibirás un correo para confirmar la dirección antes de iniciar sesión.',
          );
          this.authForm.markAsPristine();
          return;
        }
      } else {
        await this.auth.signIn(email.trim(), password);
      }

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const targetUrl = returnUrl?.startsWith('/workspace') || returnUrl?.startsWith('/admin')
        ? returnUrl
        : this.auth.roles().includes('SUPER_ADMIN')
          ? '/admin/super-panel'
          : '/workspace';
      await this.router.navigateByUrl(targetUrl);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Se produjo un error inesperado.',
      );
    } finally {
      this.isSubmitting.set(false      );
    }
  }
}
