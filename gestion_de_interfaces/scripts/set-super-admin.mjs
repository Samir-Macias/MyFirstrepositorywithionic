import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = process.argv[2];

async function promoteToSuperAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno local.');
  }
  if (!targetEmail?.trim()) {
    throw new Error(
      'Debes indicar el correo de la cuenta. Uso: npm run set-super-admin -- usuario@ejemplo.com',
    );
  }
  if (!SUPABASE_URL.startsWith('https://')) {
    throw new Error('SUPABASE_URL debe ser la URL HTTPS del proyecto.');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const normalizedEmail = targetEmail.trim().toLowerCase();
  let page = 1;
  let user;

  while (!user) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);
    if (user || data.users.length < 100) break;
    page += 1;
  }

  if (!user) {
    throw new Error(`No se encontró una cuenta registrada con el correo ${normalizedEmail}.`);
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      role: 'SUPER_ADMIN',
      roles: [...new Set([...(Array.isArray(user.app_metadata.roles) ? user.app_metadata.roles : []), 'SUPER_ADMIN'])],
    },
  });
  if (error) throw error;
  if (!data.user.app_metadata.roles?.includes('SUPER_ADMIN')) {
    throw new Error('Supabase no confirmó el rol SUPER_ADMIN en app_metadata.');
  }

  console.log(`Rol SUPER_ADMIN asignado a ${normalizedEmail}. Cierra sesión y vuelve a entrar.`);
}

promoteToSuperAdmin().catch((error) => {
  console.error('No se pudo asignar el rol SUPER_ADMIN:', error);
  process.exitCode = 1;
});