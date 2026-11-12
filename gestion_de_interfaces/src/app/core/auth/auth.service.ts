import { computed, inject, Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseClientService } from '../supabase/supabase-client.service';

export type AppRole = 'USER' | 'CORP_ADMIN' | 'SUPER_ADMIN';

const GOOGLE_RETURN_URL_KEY = 'taskflow-google-return-url';

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

  async signInWithGoogle(returnUrl: string | null): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      throw new Error('El inicio de sesión con Google todavía no está disponible en la aplicación móvil.');
    }

    const client = await this.supabase.getClient();
    this.startAuthListener(client);
    if (returnUrl) {
      sessionStorage.setItem(GOOGLE_RETURN_URL_KEY, returnUrl);
    } else {
      sessionStorage.removeItem(GOOGLE_RETURN_URL_KEY);
    }

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: new URL('auth/callback', document.baseURI).href },
    });
    if (error) {
      sessionStorage.removeItem(GOOGLE_RETURN_URL_KEY);
      throw new Error(`No se pudo iniciar sesión con Google: ${error.message}`);
    }
  }

  async completeGoogleSignIn(): Promise<string> {
    const returnUrl = sessionStorage.getItem(GOOGLE_RETURN_URL_KEY);
    sessionStorage.removeItem(GOOGLE_RETURN_URL_KEY);

    const url = new URL(window.location.href);
    const fragment = new URLSearchParams(url.hash.slice(1));
    if (url.searchParams.has('error') || fragment.has('error')) {
      throw new Error('Google no pudo completar el inicio de sesión. Inténtalo de nuevo.');
    }

    const session = await this.getSession();
    if (!session) {
      throw new Error('No se recibió una sesión de Google. Comprueba la configuración e inténtalo de nuevo.');
    }

    return this.postSignInUrl(returnUrl);
  }

  postSignInUrl(returnUrl: string | null): string {
    if (returnUrl && /^\/(?:workspace|admin)(?:[/?#]|$)/.test(returnUrl)
      && !/[\\\u0000-\u001f\u007f]/.test(returnUrl)) {
      return returnUrl;
    }
    return this.roles().includes('SUPER_ADMIN') ? '/admin/super-panel' : '/workspace';
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
