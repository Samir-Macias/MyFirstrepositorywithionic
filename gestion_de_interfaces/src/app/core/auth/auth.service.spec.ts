import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { AuthService } from './auth.service';

describe('Google authentication', () => {
  let service: AuthService;
  const auth = {
    onAuthStateChange: vi.fn(),
    signInWithOAuth: vi.fn(),
    getSession: vi.fn(),
  };

  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    auth.onAuthStateChange.mockReset();
    auth.signInWithOAuth.mockReset().mockResolvedValue({ error: null });
    auth.getSession.mockReset();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseClientService, useValue: { getClient: vi.fn().mockResolvedValue({ auth }) } },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('starts the OAuth flow and returns to a protected page after a session is established', async () => {
    await service.signInWithGoogle('/workspace/calendar');
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: new URL('auth/callback', document.baseURI).href },
    });

    auth.getSession.mockResolvedValue({
      data: { session: { user: { app_metadata: {} } } },
      error: null,
    });
    expect(await service.completeGoogleSignIn()).toBe('/workspace/calendar');
  });

  it('routes super administrators to their panel and rejects external destinations', async () => {
    await service.signInWithGoogle('//evil.example');
    auth.getSession.mockResolvedValue({
      data: { session: { user: { app_metadata: { role: 'SUPER_ADMIN' } } } },
      error: null,
    });
    expect(await service.completeGoogleSignIn()).toBe('/admin/super-panel');
  });

  it('does not use an existing session when Google returns an error', async () => {
    window.history.replaceState({}, '', '/auth/callback#error=access_denied');
    await expect(service.completeGoogleSignIn()).rejects.toThrow('Google no pudo completar');
    expect(auth.getSession).not.toHaveBeenCalled();
  });

  it('reports an absent session and OAuth provider errors', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(service.completeGoogleSignIn()).rejects.toThrow('No se recibió una sesión');

    auth.signInWithOAuth.mockResolvedValueOnce({ error: { message: 'Proveedor desactivado' } });
    await expect(service.signInWithGoogle(null)).rejects.toThrow('Proveedor desactivado');
  });

  it('reports that native sign-in is not yet supported', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    await expect(service.signInWithGoogle(null)).rejects.toThrow('aplicación móvil');
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
  });
});
