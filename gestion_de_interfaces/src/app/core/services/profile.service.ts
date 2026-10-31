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

  async emailIsRegistered(email: string): Promise<boolean> {
    const client = await this.supabase.getClient();
    const { data, error } = await client.rpc('check_email_exists', {
      email_to_check: email.toLowerCase().trim(),
    });

    if (error) {
      throw new Error(`No se pudo comprobar el correo: ${error.message}`);
    }
    if (typeof data !== 'boolean') {
      throw new Error('El RPC check_email_exists debe devolver un booleano.');
    }

    return data;
  }

  /**
   * Vincula una cuenta ya registrada a la organización como STANDARD_USER.
   */
  async addTeamMember(email: string, fullName: string, organizationId: string): Promise<void> {
    const client = await this.supabase.getClient();

    const normalizedEmail = email.toLowerCase().trim();
    const { data: existingProfile, error: lookupError } = await client
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (lookupError) {
      throw new Error(`No se pudo buscar la cuenta del miembro: ${lookupError.message}`);
    }

    if (!existingProfile) {
      throw new Error('No existe una cuenta registrada con ese correo. El usuario debe registrarse primero.');
    }

    const { data: updatedProfile, error: updateError } = await client
      .from('profiles')
      .update({
        organization_id: organizationId,
        role: 'STANDARD_USER',
        full_name: fullName.trim(),
      })
      .eq('id', existingProfile.id)
      .select('id')
      .maybeSingle();

    if (updateError) {
      throw new Error(`No se pudo vincular el miembro a la organización: ${updateError.message}`);
    }
    if (!updatedProfile) {
      throw new Error('No se vinculó el miembro. Comprueba los permisos RLS del perfil.');
    }

    await this.loadTeamMembers(organizationId);
  }
}