import { getDatabase } from '$lib/db/database';
import { createLogger } from '$lib/logger';

const log = createLogger('category-service');

export interface Category {
  id: number;
  name: string;
  color: string;
}

/**
 * Fetches all categories ordered by name.
 */
export function getAllCategories(): Category[] {
  const db = getDatabase();
  const result = db.exec('SELECT id, name, color FROM categories ORDER BY name');

  const categories: Category[] = result.length > 0
    ? result[0].values.map(row => ({
        id: Number(row[0]),
        name: String(row[1]),
        color: String(row[2])
      }))
    : [];

  log.debug({ count: categories.length }, 'Categories loaded');
  return categories;
}
