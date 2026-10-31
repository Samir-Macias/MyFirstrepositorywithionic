import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService } from '../../../core/services/organization.service';
import { Organization } from '../../../core/models/organization.model';

@Component({
  selector: 'app-super-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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