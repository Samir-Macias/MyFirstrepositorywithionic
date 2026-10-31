import { formatDueDate, normalizeDueDate } from './date-format';

describe('formatDueDate', () => {
  it('formats a date-only value without a timezone shift', () => {
    expect(formatDueDate('2026-10-31')).toBe('31 oct');
  });

  it('formats a timestamp returned by a date/timestamp database column', () => {
    expect(formatDueDate('2026-10-31T00:00:00.000Z')).toBe('31 oct');
    expect(normalizeDueDate('2026-10-31T00:00:00.000Z')).toBe('2026-10-31');
  });

  it('keeps a clear error for invalid stored date values', () => {
    expect(() => formatDueDate('2026-02-31')).toThrow(
      'La fecha límite almacenada no es válida: 2026-02-31.',
    );
  });
});
