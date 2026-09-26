/** Supabase join có thể trả về object hoặc array tùy quan hệ. */
export function unwrapRelation<T>(
  value: T | T[] | null | undefined,
): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}
