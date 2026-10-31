import { TestBed } from '@angular/core/testing';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let query: {
    select: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
  };
  let client: { from: ReturnType<typeof vi.fn>; rpc: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    query = {
      select: vi.fn(),
      order: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    };
    for (const method of [query.select, query.insert, query.update, query.eq]) {
      method.mockReturnValue(query);
    }
    query.order.mockResolvedValue({ data: [], error: null });
    query.single.mockResolvedValue({ data: organizationRow(), error: null });
    query.maybeSingle.mockResolvedValue({ data: { id: 'profile-1' }, error: null });
    client = {
      from: vi.fn().mockReturnValue(query),
      rpc: vi.fn().mockResolvedValue({ data: [createdOrganizationRow()], error: null }),
    };

    TestBed.configureTestingModule({
      providers: [
        OrganizationService,
        {
          provide: SupabaseClientService,
          useValue: { getClient: vi.fn().mockResolvedValue(client) },
        },
      ],
    });
    service = TestBed.inject(OrganizationService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('loads organizations and maps the corporate administrator profile', async () => {
    query.order.mockResolvedValue({
      data: [{
        ...organizationRow(),
        profiles: [{ email: 'admin@example.test', full_name: 'Admin Equipo', role: 'CORP_ADMIN' }],
      }],
      error: null,
    });

    const organizations = await service.loadOrganizations();

    expect(organizations[0]).toEqual(expect.objectContaining({
      id: 'org-1',
      corpAdminEmail: 'admin@example.test',
      corpAdminName: 'Admin Equipo',
    }));
    expect(service.organizations()).toEqual(organizations);
  });

  it('creates an organization and assigns its administrator atomically through the RPC', async () => {
    const organization = await service.createOrganization({
      name: ' Equipo Demo ',
      slug: ' EQUIPO DEMO ',
      corpAdminEmail: ' ADMIN@example.test ',
      corpAdminName: ' Admin Equipo ',
    });

    expect(client.rpc).toHaveBeenCalledWith('create_organization_with_admin', {
      p_name: 'Equipo Demo',
      p_slug: 'equipo-demo',
      p_admin_email: 'admin@example.test',
      p_admin_name: 'Admin Equipo',
    });
    expect(client.from).not.toHaveBeenCalled();
    expect(organization.corpAdminEmail).toBe('admin@example.test');
    expect(service.organizations()).toEqual([organization]);
  });

  it('reports RPC failures instead of leaving a partially-created organization', async () => {
    client.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'No existe un perfil registrado con el correo indicado.' },
    });

    await expect(service.createOrganization({
      name: 'Equipo Demo',
      slug: 'equipo-demo',
      corpAdminEmail: 'admin@example.test',
      corpAdminName: 'Admin Equipo',
    })).rejects.toThrow('No se pudo crear el espacio de trabajo: No existe un perfil registrado con el correo indicado.');
    expect(service.organizations()).toEqual([]);
  });
});

function organizationRow() {
  return {
    id: 'org-1',
    name: 'Equipo Demo',
    slug: 'equipo-demo',
    created_by_user_id: 'user-1',
    created_at: '2026-10-29T09:00:00.000Z',
  };
}

function createdOrganizationRow() {
  return {
    id: 'org-1',
    name: 'Equipo Demo',
    slug: 'equipo-demo',
    created_by_user_id: 'user-1',
    created_at: '2026-10-29T09:00:00.000Z',
    corp_admin_email: 'admin@example.test',
    corp_admin_name: 'Admin Equipo',
  };
}
