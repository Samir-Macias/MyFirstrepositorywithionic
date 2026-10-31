import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Organization } from '../../../core/models/organization.model';
import { OrganizationService } from '../../../core/services/organization.service';
import { SuperPanelComponent } from './super-panel.component';

describe('SuperPanelComponent', () => {
  let fixture: ComponentFixture<SuperPanelComponent>;
  let service: {
    organizations: ReturnType<typeof signal<Organization[]>>;
    loadOrganizations: ReturnType<typeof vi.fn>;
    createOrganization: ReturnType<typeof vi.fn>;
    updateOrganization: ReturnType<typeof vi.fn>;
    deleteOrganization: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      organizations: signal<Organization[]>([
        org('org-1', 'Alfa', 2),
        org('org-2', 'Beta', 3),
      ]),
      loadOrganizations: vi.fn().mockResolvedValue([]),
      createOrganization: vi.fn(),
      updateOrganization: vi.fn().mockResolvedValue(undefined),
      deleteOrganization: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [SuperPanelComponent],
      providers: [{ provide: OrganizationService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(SuperPanelComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows the number of organizations and users per organization', () => {
    const text = fixture.nativeElement.textContent as string;
    const values = Array.from(fixture.nativeElement.querySelectorAll('.stat-box__value')).map(
      (element) => (element as HTMLElement).textContent?.trim(),
    );

    expect(values).toEqual(['2', '5']);
    expect(text).toContain('Alfa');
  });

  it('expands the member list of an organization', () => {
    fixture.componentInstance.toggleMembers('org-1');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('admin@alfa.test');
  });

  it('edits an organization', async () => {
    const component = fixture.componentInstance;
    component.startEdit(service.organizations()[0]);
    component.editForm.patchValue({ name: 'Alfa 2', slug: 'alfa-2' });

    await component.saveEdit();

    expect(service.updateOrganization).toHaveBeenCalledWith('org-1', { name: 'Alfa 2', slug: 'alfa-2' });
    expect(component.editingOrgId()).toBeNull();
  });

  it('requires confirmation before deleting an organization', async () => {
    const component = fixture.componentInstance;
    component.askDelete('org-2');
    expect(service.deleteOrganization).not.toHaveBeenCalled();

    await component.confirmDelete(service.organizations()[1]);

    expect(service.deleteOrganization).toHaveBeenCalledWith('org-2');
    expect(component.feedbackMessage()?.type).toBe('success');
  });
});

function org(id: string, name: string, memberCount: number): Organization {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    createdByUserId: 'super',
    createdAt: '2026-10-31T10:00:00Z',
    corpAdminEmail: `admin@${name.toLowerCase()}.test`,
    corpAdminName: 'Admin',
    memberCount,
    members: [
      { id: `${id}-a`, email: `admin@${name.toLowerCase()}.test`, fullName: 'Admin', role: 'CORP_ADMIN' },
    ],
  };
}
