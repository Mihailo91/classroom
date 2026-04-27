/**
 * Force serialization of Prisma objects to plain JSON
 * Strips Decimal, Date, and other class instances
 */
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
