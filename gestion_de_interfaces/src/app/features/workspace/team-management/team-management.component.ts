import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfileService } from '../../../core/services/profile.service';

registerLocaleData(localeEs);

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, RouterLink],
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
  readonly invitations = this.profileService.invitations;
  readonly embedded = input(false);

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
      const result = await this.profileService.addTeamMember(email, fullName, this.organizationId);
      this.feedbackMessage.set({
        type: 'success',
        text:
          result === 'LINKED'
            ? 'Miembro incorporado al equipo correctamente.'
            : 'Invitación creada: el usuario se unirá al equipo cuando se registre con ese correo.',
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

  async removeMember(userId: string): Promise<void> {
    await this.runAction(
      (organizationId) => this.profileService.removeTeamMember(userId, organizationId),
      'Miembro eliminado del equipo.',
    );
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    await this.runAction(
      (organizationId) => this.profileService.cancelInvitation(invitationId, organizationId),
      'Invitación cancelada.',
    );
  }

  private async runAction(
    action: (organizationId: string) => Promise<void>,
    successText: string,
  ): Promise<void> {
    if (!this.organizationId) {
      return;
    }

    this.feedbackMessage.set(null);
    try {
      await action(this.organizationId);
      this.feedbackMessage.set({ type: 'success', text: successText });
    } catch (error) {
      this.feedbackMessage.set({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo completar la acción.',
      });
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

      await Promise.all([
        this.profileService.loadTeamMembers(this.organizationId),
        this.profileService.loadInvitations(this.organizationId),
      ]);
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
