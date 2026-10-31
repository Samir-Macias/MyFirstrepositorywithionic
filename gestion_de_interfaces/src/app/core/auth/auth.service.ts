import { computed, inject, Injectable, signal } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseClientService } from '../supabase/supabase-client.service';

export type AppRole = 'USER' | 'CORP_ADMIN' | 'SUPER_ADMIN';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<User | null>(null);
  readonly roles = computed<AppRole[]>(() => this.readRoles(this.currentUser()));

  private authListenerStarted = false;
  private readonly supabase = inject(SupabaseClientService);

  async getSession(): Promise<Session | null> {
    const client = await this.supabase.getClient();
    this.startAuthListener(client);

    const { data, error } = await client.auth.getSession();
    if (error) {
      throw new Error(`No se pudo recuperar la sesión: ${error.message}`);
    }

    this.currentUser.set(data.session?.user ?? null);
    return data.session;
  }

  async signIn(email: string, password: string): Promise<void> {
    const client = await this.supabase.getClient();
    this.startAuthListener(client);

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(`No se pudo iniciar sesión: ${error.message}`);
    }
    if (!data.session) {
      throw new Error('Supabase no devolvió una sesión válida al iniciar sesión.');
    }

    this.currentUser.set(data.user);
  }

  async signUp(email: string, password: string, fullName: string): Promise<boolean> {
    const client = await this.supabase.getClient();
    this.startAuthListener(client);

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      throw new Error(`No se pudo crear la cuenta: ${error.message}`);
    }

    this.currentUser.set(data.session?.user ?? null);
    return data.session !== null;
  }

  async signOut(): Promise<void> {
    const client = await this.supabase.getClient();
    const { error } = await client.auth.signOut();
    if (error) {
      throw new Error(`No se pudo cerrar la sesión: ${error.message}`);
    }

    this.currentUser.set(null);
  }

  private startAuthListener(
    client: Awaited<ReturnType<SupabaseClientService['getClient']>>,
  ): void {
    if (this.authListenerStarted) {
      return;
    }

    client.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
    });
    this.authListenerStarted = true;
  }

  private readRoles(user: User | null): AppRole[] {
    if (!user) {
      return [];
    }

    const metadata: Record<string, unknown> = user.app_metadata;
    const roleValues = Array.isArray(metadata['roles'])
      ? metadata['roles']
      : [metadata['role']];
    const allowedRoles: AppRole[] = ['USER', 'CORP_ADMIN', 'SUPER_ADMIN'];
    const roles = roleValues.filter(
      (role): role is AppRole =>
        typeof role === 'string' && allowedRoles.includes(role as AppRole),
    );

    return roles.length > 0 ? roles : ['USER'];
  }
}
