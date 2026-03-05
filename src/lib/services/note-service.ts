import { getDatabase, persistDatabase } from '$lib/db/database';
import { createLogger } from '$lib/logger';

const log = createLogger('note-service');

export interface Note {
  id: number;
  userId: number;
  title: string;
  content: string | null;
  categoryId: number | null;
  location: string | null;
  noteTime: string | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteWithCategory extends Note {
  category?: {
    id: number;
    name: string;
    color: string;
  };
}

function mapRowToNote(row: unknown[]): NoteWithCategory {
  return {
    id: Number(row[0]),
    userId: Number(row[1]),
    title: String(row[2]),
    content: row[3] ? String(row[3]) : null,
    categoryId: row[4] ? Number(row[4]) : null,
    location: row[5] ? String(row[5]) : null,
    noteTime: row[6] ? String(row[6]) : null,
    isPinned: Boolean(row[7]),
    isArchived: Boolean(row[8]),
    createdAt: String(row[9]),
    updatedAt: String(row[10]),
    category: row[11] ? {
      id: Number(row[11]),
      name: String(row[12]),
      color: String(row[13])
    } : undefined
  };
}

const NOTE_WITH_CATEGORY_QUERY = `
  SELECT
    n.id, n.user_id, n.title, n.content, n.category_id,
    n.location, n.note_time,
    n.is_pinned, n.is_archived, n.created_at, n.updated_at,
    c.id as cat_id, c.name as cat_name, c.color as cat_color
  FROM notes n
  LEFT JOIN categories c ON n.category_id = c.id
`;

/**
 * Fetches all notes for a user, ordered by pinned status and update time.
 */
export function getNotesByUserId(userId: number): NoteWithCategory[] {
  const db = getDatabase();
  const result = db.exec(
    `${NOTE_WITH_CATEGORY_QUERY} WHERE n.user_id = ? ORDER BY n.is_pinned DESC, n.updated_at DESC`,
    [userId]
  );

  const notes = result.length > 0
    ? result[0].values.map(mapRowToNote)
    : [];

  log.debug({ count: notes.length, userId }, 'Notes loaded');
  return notes;
}

/**
 * Fetches a single note by ID for a given user.
 */
export function getNoteById(noteId: number, userId: number): NoteWithCategory | null {
  const db = getDatabase();
  const result = db.exec(
    `${NOTE_WITH_CATEGORY_QUERY} WHERE n.id = ? AND n.user_id = ?`,
    [noteId, userId]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  return mapRowToNote(result[0].values[0]);
}

/**
 * Creates a new note and returns its ID.
 */
export async function createNote(
  userId: number,
  title: string,
  content: string = '',
  categoryId: number | null = null,
  location: string | null = null,
  noteTime: string | null = null
): Promise<number> {
  const db = getDatabase();
  db.run(
    `INSERT INTO notes (user_id, title, content, category_id, location, note_time) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, title, content, categoryId, location, noteTime]
  );

  const result = db.exec('SELECT last_insert_rowid()');
  const newId = Number(result[0].values[0][0]);

  log.info({ noteId: newId, userId }, 'Note created');
  await persistDatabase();

  return newId;
}

/**
 * Updates an existing note's fields.
 */
export async function updateNote(
  noteId: number,
  userId: number,
  updates: Partial<Pick<Note, 'title' | 'content' | 'categoryId' | 'location' | 'noteTime' | 'isPinned'>>
): Promise<void> {
  const db = getDatabase();
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    setClauses.push('title = ?');
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    setClauses.push('content = ?');
    values.push(updates.content);
  }
  if (updates.categoryId !== undefined) {
    setClauses.push('category_id = ?');
    values.push(updates.categoryId);
  }
  if (updates.location !== undefined) {
    setClauses.push('location = ?');
    values.push(updates.location);
  }
  if (updates.noteTime !== undefined) {
    setClauses.push('note_time = ?');
    values.push(updates.noteTime);
  }
  if (updates.isPinned !== undefined) {
    setClauses.push('is_pinned = ?');
    values.push(updates.isPinned ? 1 : 0);
  }

  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  values.push(noteId, userId);

  db.run(
    `UPDATE notes SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );

  log.info({ noteId }, 'Note updated');
  await persistDatabase();
}

/**
 * Deletes a note by ID for a given user.
 */
export async function deleteNote(noteId: number, userId: number): Promise<void> {
  const db = getDatabase();
  db.run('DELETE FROM notes WHERE id = ? AND user_id = ?', [noteId, userId]);

  log.info({ noteId }, 'Note deleted');
  await persistDatabase();
}

/**
 * Toggles the pinned state of a note.
 */
export async function toggleNotePin(noteId: number, userId: number): Promise<void> {
  const db = getDatabase();
  db.run(
    'UPDATE notes SET is_pinned = NOT is_pinned, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [noteId, userId]
  );

  log.debug({ noteId }, 'Note pin toggled');
  await persistDatabase();
}

/**
 * Toggles the archived state of a note.
 */
export async function toggleNoteArchive(noteId: number, userId: number): Promise<void> {
  const db = getDatabase();
  db.run(
    'UPDATE notes SET is_archived = NOT is_archived, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [noteId, userId]
  );

  log.debug({ noteId }, 'Note archive toggled');
  await persistDatabase();
}
