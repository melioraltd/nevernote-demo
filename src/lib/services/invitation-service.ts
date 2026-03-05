import { getDatabase, persistDatabase } from '$lib/db/database';
import { createLogger } from '$lib/logger';

const log = createLogger('invitation-service');

export interface InvitationCode {
  id: number;
  code: string;
  isUsed: boolean;
  usedByEmail: string | null;
  createdAt: string;
  usedAt: string | null;
}

/**
 * Generates a random alphanumeric code between 8 and 12 characters.
 */
function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 8 + Math.floor(Math.random() * 5); // 8–12
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generates one or more unique invitation codes and inserts them into the database.
 * Returns the generated code strings.
 */
export async function generateCodes(count: number): Promise<string[]> {
  const db = getDatabase();
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    let code: string;
    let attempts = 0;
    // Ensure uniqueness
    do {
      code = generateRandomCode();
      attempts++;
      const existing = db.exec('SELECT id FROM invitation_codes WHERE code = ?', [code]);
      if (existing.length === 0 || existing[0].values.length === 0) {
        break;
      }
    } while (attempts < 10);

    db.run('INSERT INTO invitation_codes (code) VALUES (?)', [code]);
    codes.push(code);
  }

  log.info({ count: codes.length }, 'Invitation codes generated');
  await persistDatabase();

  return codes;
}

/**
 * Retrieves all invitation codes with optional used-by email from joined users table.
 */
export function getAllCodes(): InvitationCode[] {
  const db = getDatabase();
  const result = db.exec(`
    SELECT
      ic.id, ic.code, ic.is_used, ic.created_at, ic.used_at,
      u.username AS used_by_email
    FROM invitation_codes ic
    LEFT JOIN users u ON ic.used_by = u.id
    ORDER BY ic.created_at DESC
  `);

  if (result.length === 0) {
    return [];
  }

  const codes = result[0].values.map((row): InvitationCode => ({
    id: Number(row[0]),
    code: String(row[1]),
    isUsed: Boolean(row[2]),
    createdAt: String(row[3]),
    usedAt: row[4] ? String(row[4]) : null,
    usedByEmail: row[5] ? String(row[5]) : null
  }));

  log.debug({ count: codes.length }, 'Invitation codes loaded');
  return codes;
}
