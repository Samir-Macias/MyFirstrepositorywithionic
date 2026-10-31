import { Injectable, inject, signal } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { Organization, CreateOrganizationInput } from '../models/organization.model';

interface OrganizationRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly created_by_user_id: string;
  readonly created_at: string;
  readonly profiles?: ProfileRow[] | ProfileRow | null;
}

interface ProfileRow {
  readonly id?: string;
  readonly email?: string | null;
  readonly full_name?: string | null;
  readonly role?: string | null;
}

interface CreatedOrganizationRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly created_by_user_id: string;
  readonly created_at: string;
  readonly corp_admin_email: string;
  readonly corp_admin_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly supabaseService = inject(SupabaseClientService);

  private readonly _organizations = signal<Organization[]>([]);
  public readonly organizations = this._organizations.asReadonly();

  /**
   * Obtiene todas las organizaciones registradas (permitido únicamente para SUPER_ADMIN vía RLS)
   */
  async loadOrganizations(): Promise<Organization[]> {
    const client = await this.supabaseService.getClient();
    
    const { data, error } = await client
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        created_by_user_id,
        created_at,
        profiles (
          email,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al recuperar organizaciones:', error.message);
      throw error;
    }

    const orgs: Organization[] = ((data ?? []) as OrganizationRow[]).map((row) => {
      // Filtrar el perfil que corresponda al administrador de la corporación
      const corpAdmin = Array.isArray(row.profiles)
        ? row.profiles.find((profile) => profile.role === 'CORP_ADMIN')
        : row.profiles?.role === 'CORP_ADMIN'
          ? row.profiles
          : null;

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        createdByUserId: row.created_by_user_id,
        createdAt: row.created_at,
        corpAdminEmail: corpAdmin?.email || 'Sin asignar',
        corpAdminName: corpAdmin?.full_name || 'Sin asignar'
      };
    });

    this._organizations.set(orgs);
    return orgs;
  }

  /**
   * Registra una nueva corporación
   */
  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const client = await this.supabaseService.getClient();
    const normalizedEmail = input.corpAdminEmail.toLowerCase().trim();
    const normalizedName = input.name.trim();
    const normalizedSlug = input.slug.toLowerCase().trim().replace(/\s+/g, '-');

    const { data, error } = await client.rpc('create_organization_with_admin', {
      p_name: normalizedName,
      p_slug: normalizedSlug,
      p_admin_email: normalizedEmail,
      p_admin_name: input.corpAdminName.trim(),
    });

    if (error) {
      throw new Error(`No se pudo crear el espacio de trabajo: ${error.message}`);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!this.isCreatedOrganizationRow(row)) {
      throw new Error('Supabase no devolvió los datos de la organización creada.');
    }

    const createdOrg: Organization = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdByUserId: row.created_by_user_id,
      createdAt: row.created_at,
      corpAdminEmail: row.corp_admin_email,
      corpAdminName: row.corp_admin_name,
    };

    this._organizations.update(current => [createdOrg, ...current]);
    return createdOrg;
  }

  private isCreatedOrganizationRow(value: unknown): value is CreatedOrganizationRow {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const row = value as Record<string, unknown>;
    return (
      typeof row['id'] === 'string' &&
      typeof row['name'] === 'string' &&
      typeof row['slug'] === 'string' &&
      typeof row['created_by_user_id'] === 'string' &&
      typeof row['created_at'] === 'string' &&
      typeof row['corp_admin_email'] === 'string' &&
      typeof row['corp_admin_name'] === 'string'
    );
  }
}