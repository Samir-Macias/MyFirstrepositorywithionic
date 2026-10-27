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

    const response = await fetch('/assets/supabase-config.json');
    if (!response.ok) {
      throw new Error(
        'No se pudo cargar la configuración de Supabase. Crea src/assets/supabase-config.json a partir del archivo de ejemplo.',
      );
    }

    const config: unknown = await response.json();
    if (!this.isRuntimeConfig(config)) {
      throw new Error(
        'Configura la URL del proyecto y la clave pública anon/publishable en src/assets/supabase-config.json.',
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
