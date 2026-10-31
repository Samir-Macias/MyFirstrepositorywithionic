import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfileService } from '../../../core/services/profile.service';

registerLocaleData(localeEs);

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './team-management.component.html',
  styleUrl: './team-management.component.scss',
})
export class TeamManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private organizationId: string | null = null;

  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly feedbackMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  readonly members = this.profileService.members;

  readonly memberForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });

  async ngOnInit(): Promise<void> {
    await this.fetchMembers();
  }

  async onSubmit(): Promise<void> {
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }

    if (!this.organizationId) {
      this.feedbackMessage.set({
        type: 'error',
        text: 'No se encontró la organización asociada a tu perfil de administrador.',
      });
      return;
    }

    this.isSubmitting.set(true);
    this.feedbackMessage.set(null);

    try {
      const fullName = String(this.memberForm.get('fullName')?.value ?? '').trim();
      const email = String(this.memberForm.get('email')?.value ?? '').trim();
      await this.profileService.addTeamMember(email, fullName, this.organizationId);
      this.feedbackMessage.set({
        type: 'success',
        text: 'Miembro incorporado al equipo correctamente.',
      });
      this.memberForm.reset();
    } catch (error) {
      this.feedbackMessage.set({
        type: 'error',
        text: error instanceof Error ? error.message : 'Ocurrió un error al vincular al usuario.',
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async fetchMembers(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) {
      this.feedbackMessage.set({
        type: 'error',
        text: 'No se pudo identificar tu sesión. Inicia sesión de nuevo.',
      });
      return;
    }

    this.isLoading.set(true);
    this.feedbackMessage.set(null);
    try {
      this.organizationId = await this.profileService.getOrganizationId(user.id);
      if (!this.organizationId) {
        this.feedbackMessage.set({
          type: 'error',
          text: 'No se encontró la organización asociada a tu perfil de administrador.',
        });
        return;
      }

      await this.profileService.loadTeamMembers(this.organizationId);
    } catch (error) {
      this.feedbackMessage.set({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo cargar el equipo.',
      });
    } finally {
      this.isLoading.set(false);
    }
  }
}
