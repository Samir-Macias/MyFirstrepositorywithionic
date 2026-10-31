import { TestBed } from '@angular/core/testing';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let query: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
  };
  let client: { from: ReturnType<typeof vi.fn>; rpc: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      update: vi.fn(),
      maybeSingle: vi.fn(),
    };
    for (const method of [query.select, query.eq, query.update]) {
      method.mockReturnValue(query);
    }
    query.order.mockResolvedValue({ data: [], error: null });
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    client = {
      from: vi.fn().mockReturnValue(query),
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    };

    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        {
          provide: SupabaseClientService,
          useValue: { getClient: vi.fn().mockResolvedValue(client) },
        },
      ],
    });
    service = TestBed.inject(ProfileService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('loads team profiles through the async Supabase client', async () => {
    query.order.mockResolvedValue({
      data: [{
        id: 'user-2',
        email: 'member@example.test',
        full_name: 'Miembro Equipo',
        role: 'STANDARD_USER',
        created_at: '2026-10-29T09:00:00Z',
        organization_id: 'org-1',
      }],
      error: null,
    });

    const members = await service.loadTeamMembers('org-1');

    expect(members).toEqual([expect.objectContaining({
      id: 'user-2',
      email: 'member@example.test',
      fullName: 'Miembro Equipo',
      role: 'STANDARD_USER',
      organizationId: 'org-1',
    })]);
    expect(service.members()).toEqual(members);
  });

  it('gets the organization ID from the authenticated user profile', async () => {
    query.maybeSingle.mockResolvedValueOnce({
      data: { organization_id: 'org-1' },
      error: null,
    });

    await expect(service.getOrganizationId('user-1')).resolves.toBe('org-1');
  });

  it('checks email registration with the configured Supabase RPC contract', async () => {
    client.rpc.mockResolvedValueOnce({ data: true, error: null });

    await expect(service.emailIsRegistered(' USER@example.test ')).resolves.toBe(true);
    expect(client.rpc).toHaveBeenCalledWith('check_email_exists', {
      email_to_check: 'user@example.test',
    });
  });

  it('links an existing account and reloads the team', async () => {
    query.maybeSingle
      .mockResolvedValueOnce({ data: { id: 'user-2' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'user-2' }, error: null });

    await service.addTeamMember(' MEMBER@example.test ', ' Miembro Equipo ', 'org-1');

    expect(query.eq).toHaveBeenCalledWith('email', 'member@example.test');
    expect(query.update).toHaveBeenCalledWith({
      organization_id: 'org-1',
      role: 'STANDARD_USER',
      full_name: 'Miembro Equipo',
    });
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('does not silently invent an auth profile for an unknown email', async () => {
    await expect(
      service.addTeamMember('unknown@example.test', 'Usuario Nuevo', 'org-1'),
    ).rejects.toThrow('No existe una cuenta registrada con ese correo.');
    expect(query.update).not.toHaveBeenCalled();
  });
});
