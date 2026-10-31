import { Injectable, inject, signal } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';

export interface TeamMemberProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'CORP_ADMIN' | 'STANDARD_USER';
  createdAt: string;
  organizationId?: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

interface InvitationRow {
  readonly id: string;
  readonly email: string;
  readonly full_name: string;
  readonly created_at: string;
}

interface ProfileRow {
  readonly id: string;
  readonly email: string;
  readonly full_name: string;
  readonly role: string;
  readonly created_at: string;
  readonly organization_id: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly supabase = inject(SupabaseClientService);

  private readonly _members = signal<TeamMemberProfile[]>([]);
  public readonly members = this._members.asReadonly();

  private readonly _invitations = signal<PendingInvitation[]>([]);
  public readonly invitations = this._invitations.asReadonly();

  /**
   * Carga los miembros pertenecientes a la organización indicada
   */
  async loadTeamMembers(organizationId: string): Promise<TeamMemberProfile[]> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('profiles')
      .select('id, email, full_name, role, created_at, organization_id')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al recuperar miembros del equipo:', error.message);
      throw error;
    }

    const formattedMembers: TeamMemberProfile[] = ((data ?? []) as ProfileRow[]).map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role === 'CORP_ADMIN' ? 'CORP_ADMIN' : 'STANDARD_USER',
      createdAt: row.created_at,
      organizationId: row.organization_id ?? undefined,
    }));

    this._members.set(formattedMembers);
    return formattedMembers;
  }

  async getOrganizationId(userId: string): Promise<string | null> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo recuperar la organización del administrador: ${error.message}`);
    }

    const organizationId = (data as { organization_id?: unknown } | null)?.organization_id;
    if (organizationId === null || organizationId === undefined) {
      return null;
    }
    if (typeof organizationId !== 'string' || !organizationId.trim()) {
      throw new Error('El perfil contiene un identificador de organización no válido.');
    }

    return organizationId;
  }

  async loadInvitations(organizationId: string): Promise<PendingInvitation[]> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('organization_invitations')
      .select('id, email, full_name, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`No se pudieron cargar las invitaciones: ${error.message}`);
    }

    const invitations = ((data ?? []) as InvitationRow[]).map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      createdAt: row.created_at,
    }));
    this._invitations.set(invitations);
    return invitations;
  }

  /**
   * Añade al equipo una cuenta existente o deja una invitación si aún no se ha registrado.
   */
  async addTeamMember(
    email: string,
    fullName: string,
    organizationId: string,
  ): Promise<'LINKED' | 'INVITED'> {
    const client = await this.supabase.getClient();
    const { data, error } = await client.rpc('add_organization_member', {
      p_email: email.toLowerCase().trim(),
      p_full_name: fullName.trim(),
    });

    if (error) {
      throw new Error(error.message);
    }

    await this.reloadTeam(organizationId);
    return data === 'LINKED' ? 'LINKED' : 'INVITED';
  }

  async removeTeamMember(userId: string, organizationId: string): Promise<void> {
    const client = await this.supabase.getClient();
    const { error } = await client.rpc('remove_organization_member', { p_user_id: userId });

    if (error) {
      throw new Error(error.message);
    }

    await this.reloadTeam(organizationId);
  }

  async cancelInvitation(invitationId: string, organizationId: string): Promise<void> {
    const client = await this.supabase.getClient();
    const { error } = await client.rpc('cancel_organization_invitation', {
      p_invitation_id: invitationId,
    });

    if (error) {
      throw new Error(error.message);
    }

    await this.reloadTeam(organizationId);
  }

  private async reloadTeam(organizationId: string): Promise<void> {
    await Promise.all([this.loadTeamMembers(organizationId), this.loadInvitations(organizationId)]);
  }
}
