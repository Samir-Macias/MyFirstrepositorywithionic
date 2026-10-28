import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseRuntimeConfig {
  readonly url: string;
  readonly anonKey: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private client: SupabaseClient | null = null;

  async getClient(): Promise<SupabaseClient> {
    if (this.client) {
      return this.client;
    }

    const configUrl = new URL('assets/supabase-config.json', document.baseURI);
    const response = await fetch(configUrl);
    if (!response.ok) {
      throw new Error(
        `No se pudo cargar la configuración de Supabase (HTTP ${response.status}). Asegúrate de incluir assets/supabase-config.json en el despliegue.`,
      );
    }

    const responseText = await response.text();
    let config: unknown;
    try {
      config = JSON.parse(responseText);
    } catch {
      throw new Error(
        'La ruta assets/supabase-config.json no devolvió JSON. Comprueba que el archivo esté incluido junto a la app desplegada y que el servidor no esté devolviendo index.html.',
      );
    }

    if (!this.isRuntimeConfig(config)) {
      throw new Error(
        'Configura la URL del proyecto y la clave pública anon/publishable en assets/supabase-config.json.',
      );
    }

    this.client = createClient(config.url.trim(), config.anonKey.trim());
    return this.client;
  }

  private isRuntimeConfig(config: unknown): config is SupabaseRuntimeConfig {
    if (typeof config !== 'object' || config === null) {
      return false;
    }

    const candidate = config as Record<string, unknown>;
    return (
      typeof candidate['url'] === 'string' &&
      candidate['url'].startsWith('https://') &&
      typeof candidate['anonKey'] === 'string' &&
      candidate['anonKey'].trim().length > 0
    );
  }
}
