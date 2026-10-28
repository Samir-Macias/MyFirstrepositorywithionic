import { SupabaseClientService } from './supabase-client.service';

describe('SupabaseClientService', () => {
  let service: SupabaseClientService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new SupabaseClientService();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates and reuses a client from the local public configuration', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          url: 'https://example.supabase.co',
          anonKey: 'test-public-key',
        }),
    });

    const firstClient = await service.getClient();
    const secondClient = await service.getClient();

    expect(firstClient).toBe(secondClient);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('reports a missing local configuration file explicitly', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    await expect(service.getClient()).rejects.toThrow(
      'No se pudo cargar la configuración de Supabase (HTTP 404).',
    );
  });

  it('explains when the config route returns the app HTML instead of JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => '<!DOCTYPE html><html></html>',
    });

    await expect(service.getClient()).rejects.toThrow(
      'no devolvió JSON. Comprueba que el archivo esté incluido junto a la app desplegada',
    );
  });

  it('rejects configuration without a public key', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ url: 'https://example.supabase.co', anonKey: '' }),
    });

    await expect(service.getClient()).rejects.toThrow(
      'Configura la URL del proyecto y la clave pública',
    );
  });
});
