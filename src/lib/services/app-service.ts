import { getDatabase } from '$lib/db/database';

/**
 * Gets the application version from the database.
 */
export function getAppInfo(): { seeded: boolean; invitationCode: string | null } {
  const db = getDatabase();

  const seededResult = db.exec("SELECT value FROM app_meta WHERE key = 'seeded'");
  const seeded = seededResult.length > 0 && seededResult[0].values[0][0] === 'true';

  const codeResult = db.exec('SELECT code FROM invitation_codes WHERE is_used = 0 LIMIT 1');
  const invitationCode = codeResult.length > 0 ? String(codeResult[0].values[0][0]) : null;

  return { seeded, invitationCode };
}

/**
 * Gets the count of various entities for demo purposes.
 */
export function getDatabaseStats(): { users: number; notes: number; categories: number } {
  const db = getDatabase();

  const usersResult = db.exec('SELECT COUNT(*) FROM users');
  const notesResult = db.exec('SELECT COUNT(*) FROM notes');
  const categoriesResult = db.exec('SELECT COUNT(*) FROM categories');

  return {
    users: Number(usersResult[0]?.values[0][0] ?? 0),
    notes: Number(notesResult[0]?.values[0][0] ?? 0),
    categories: Number(categoriesResult[0]?.values[0][0] ?? 0),
  };
}

/**
 * Demo credentials for testing.
 */
export const DEMO_CREDENTIALS = {
  user: {
    email: 'demo@example.com',
    password: 'demon123',
  },
  admin: {
    email: 'admin@example.com',
    password: 'ademon123',
  },
};
