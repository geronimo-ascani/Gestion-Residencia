export type ClassValue = string | false | null | undefined;

/**
 * Minimal class name joiner. Keeps component files free of a runtime
 * dependency while still allowing conditional classes.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
