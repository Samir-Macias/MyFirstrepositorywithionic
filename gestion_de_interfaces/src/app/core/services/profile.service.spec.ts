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
      rpc: vi.fn(),
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

  it('adds a member through the RPC and reloads members and invitations', async () => {
    client.rpc.mockResolvedValue({ data: 'INVITED', error: null });

    await expect(
      service.addTeamMember(' MEMBER@example.test ', ' Miembro Equipo ', 'org-1'),
    ).resolves.toBe('INVITED');

    expect(client.rpc).toHaveBeenCalledWith('add_organization_member', {
      p_email: 'member@example.test',
      p_full_name: 'Miembro Equipo',
    });
    expect(client.from).toHaveBeenCalledWith('profiles');
    expect(client.from).toHaveBeenCalledWith('organization_invitations');
  });

  it('surfaces RPC failures when adding, removing, or cancelling', async () => {
    client.rpc.mockResolvedValue({ data: null, error: { message: 'Sin permisos' } });

    await expect(service.addTeamMember('a@b.co', 'Ana Perez', 'org-1')).rejects.toThrow('Sin permisos');
    await expect(service.removeTeamMember('user-2', 'org-1')).rejects.toThrow('Sin permisos');
    await expect(service.cancelInvitation('inv-1', 'org-1')).rejects.toThrow('Sin permisos');
  });

  it('removes a member and cancels an invitation by RPC', async () => {
    client.rpc.mockResolvedValue({ data: null, error: null });

    await service.removeTeamMember('user-2', 'org-1');
    await service.cancelInvitation('inv-1', 'org-1');

    expect(client.rpc).toHaveBeenCalledWith('remove_organization_member', { p_user_id: 'user-2' });
    expect(client.rpc).toHaveBeenCalledWith('cancel_organization_invitation', {
      p_invitation_id: 'inv-1',
    });
  });
});
