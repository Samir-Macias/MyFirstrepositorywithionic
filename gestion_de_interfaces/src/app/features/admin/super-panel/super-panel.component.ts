import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService } from '../../../core/services/organization.service';
import { Organization } from '../../../core/models/organization.model';

@Component({
  selector: 'app-super-panel',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './super-panel.component.html',
  styleUrls: ['./super-panel.component.scss']
})
export class SuperPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orgService = inject(OrganizationService);

  public readonly isLoading = signal<boolean>(false);
  public readonly isSubmitting = signal<boolean>(false);
  public readonly feedbackMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  public readonly orgs = this.orgService.organizations;
  public readonly totalMembers = computed(() =>
    this.orgs().reduce((total, org) => total + (org.memberCount ?? 0), 0),
  );
  public readonly expandedOrgId = signal<string | null>(null);
  public readonly editingOrgId = signal<string | null>(null);
  public readonly deletingOrgId = signal<string | null>(null);
  public readonly isSavingEdit = signal<boolean>(false);

  public readonly editForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, Validators.pattern('^[a-z0-9-]+$')]],
  });

  public readonly orgForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, Validators.pattern('^[a-z0-9-]+$')]],
    corpAdminEmail: ['', [Validators.required, Validators.email]],
    corpAdminName: ['', [Validators.required, Validators.minLength(2)]]
  });

  async ngOnInit(): Promise<void> {
    await this.fetchOrganizations();
  }

  public autoGenerateSlug(): void {
    const nameValue = this.orgForm.get('name')?.value || '';
    const generatedSlug = nameValue
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    this.orgForm.patchValue({ slug: generatedSlug });
  }

  public async onSubmit(): Promise<void> {
    if (this.orgForm.invalid) {
      this.orgForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.feedbackMessage.set(null);

    try {
      await this.orgService.createOrganization(this.orgForm.value);
      this.feedbackMessage.set({
        type: 'success',
        text: 'Corporación creada con éxito y Administrador asignado.'
      });
      this.orgForm.reset();
    } catch (err: any) {
      this.feedbackMessage.set({
        type: 'error',
        text: err.message || 'Ocurrió un error al crear la corporación.'
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public toggleMembers(orgId: string): void {
    this.expandedOrgId.update((current) => (current === orgId ? null : orgId));
  }

  public startEdit(org: Organization): void {
    this.deletingOrgId.set(null);
    this.editForm.reset({ name: org.name, slug: org.slug });
    this.editingOrgId.set(org.id);
  }

  public cancelEdit(): void {
    this.editingOrgId.set(null);
  }

  public async saveEdit(): Promise<void> {
    const id = this.editingOrgId();
    if (!id) {
      return;
    }
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSavingEdit.set(true);
    this.feedbackMessage.set(null);
    try {
      await this.orgService.updateOrganization(id, this.editForm.value);
      this.feedbackMessage.set({ type: 'success', text: 'Espacio de trabajo actualizado.' });
      this.editingOrgId.set(null);
    } catch (err) {
      this.feedbackMessage.set({ type: 'error', text: this.errorText(err, 'No se pudo modificar.') });
    } finally {
      this.isSavingEdit.set(false);
    }
  }

  public askDelete(orgId: string): void {
    this.editingOrgId.set(null);
    this.deletingOrgId.set(orgId);
  }

  public cancelDelete(): void {
    this.deletingOrgId.set(null);
  }

  public async confirmDelete(org: Organization): Promise<void> {
    this.feedbackMessage.set(null);
    try {
      await this.orgService.deleteOrganization(org.id);
      this.feedbackMessage.set({ type: 'success', text: `«${org.name}» eliminada.` });
      this.deletingOrgId.set(null);
    } catch (err) {
      this.feedbackMessage.set({ type: 'error', text: this.errorText(err, 'No se pudo eliminar.') });
    }
  }

  private errorText(err: unknown, fallback: string): string {
    return err instanceof Error && err.message ? err.message : fallback;
  }

  private async fetchOrganizations(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.orgService.loadOrganizations();
    } catch (err) {
      console.error('Error al cargar corporaciones:', err);
    } finally {
      this.isLoading.set(false);
    }
  }
}