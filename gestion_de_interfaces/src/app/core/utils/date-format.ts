export function normalizeDueDate(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new Error(`La fecha límite almacenada no es válida: ${value}.`);
    }
    return value;
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error(`La fecha límite almacenada no es válida: ${value}.`);
  }

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

export function formatDueDate(value: string | null | undefined): string {
  const normalizedDate = normalizeDueDate(value);
  if (!normalizedDate) {
    return 'Sin fecha límite';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${normalizedDate}T00:00:00Z`));
}
