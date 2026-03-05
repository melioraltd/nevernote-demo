import bcrypt from 'bcryptjs';
import type { Database, SqlJsStatic } from './types';
import { createLogger } from '$lib/logger';

import seedData from '../../../data/db.seed.json';
import devData from '../../../data/db.dev.json';
import prodData from '../../../data/db.prod.json';

interface CategorySeed {
  name: string;
  color: string;
}

interface InvitationCodeSeed {
  code: string;
}

interface UserSeed {
  username: string;
  password: string;
  displayName: string;
  isAdmin: boolean;
}

interface NoteSeed {
  userIndex: number;
  title: string;
  content: string;
  categoryName: string | null;
  location?: string | null;
  noteTime?: string | null;
  isPinned: boolean;
  isArchived: boolean;
  daysAgo: number;
}

interface SeedData {
  categories?: CategorySeed[];
  invitationCodes?: InvitationCodeSeed[];
  users?: UserSeed[];
  notes?: NoteSeed[];
}

const log = createLogger('database');

const SQL_JS_CDN = 'https://sql.js.org/dist';

/**
 * Loads sql.js from CDN. Uses script injection for reliable browser loading.
 */
async function loadSqlJs(): Promise<SqlJsStatic> {
  // Check if already loaded
  const win = window as unknown as { initSqlJs?: (config: { locateFile: (file: string) => string }) => Promise<SqlJsStatic> };
  if (win.initSqlJs) {
    log.debug('sql.js already loaded, reusing');
    return win.initSqlJs({ locateFile: (file) => `${SQL_JS_CDN}/${file}` });
  }

  log.debug({ cdn: SQL_JS_CDN }, 'Loading sql.js from CDN');

  // Load script from CDN
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${SQL_JS_CDN}/sql-wasm.js`;
    script.async = true;

    script.onload = async () => {
      const initSqlJs = (window as unknown as { initSqlJs: (config: { locateFile: (file: string) => string }) => Promise<SqlJsStatic> }).initSqlJs;
      if (initSqlJs) {
        try {
          const SQL = await initSqlJs({ locateFile: (file) => `${SQL_JS_CDN}/${file}` });
          log.debug('sql.js loaded successfully');
          resolve(SQL);
        } catch (err) {
          log.error({ err }, 'Failed to initialize sql.js');
          reject(err);
        }
      } else {
        const error = new Error('initSqlJs not found after script load');
        log.error({ err: error }, 'sql.js script loaded but initSqlJs not found');
        reject(error);
      }
    };

    script.onerror = () => {
      const error = new Error('Failed to load sql.js from CDN');
      log.error({ err: error, cdn: SQL_JS_CDN }, 'Failed to load sql.js script');
      reject(error);
    };
    document.head.appendChild(script);
  });
}

const DB_NAME = 'nevernote-db';
const DB_STORE = 'database';
const SAVE_INTERVAL_MS = 10000;

let db: Database | null = null;
let saveIntervalId: number | null = null;

/**
 * Opens (or creates) the IndexedDB database for persistence.
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains(DB_STORE)) {
        idb.createObjectStore(DB_STORE);
      }
    };
  });
}

/**
 * Loads the SQLite database from IndexedDB if it exists.
 */
async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  const idb = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const request = store.get('data');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result ?? null);
  });
}

/**
 * Saves the SQLite database to IndexedDB.
 */
async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  const idb = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    const request = store.put(data, 'data');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Creates the database schema.
 */
function createSchema(database: Database): void {
  log.debug('Creating database schema');
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      category_id INTEGER,
      location TEXT,
      note_time TEXT,
      is_pinned INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS invitation_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      is_used INTEGER DEFAULT 0,
      used_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      used_at TEXT,
      FOREIGN KEY (used_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS share_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

/**
 * Seeds the database with data from JSON configuration files.
 * Loads common seed data first, then environment-specific data.
 */
async function seedDatabase(database: Database): Promise<void> {
  // Check if already seeded
  const result = database.exec("SELECT value FROM app_meta WHERE key = 'seeded'");
  if (result.length > 0) {
    log.debug('Database already seeded, skipping');
    return;
  }

  const isDev = import.meta.env.MODE === 'development';
  const envData: SeedData = isDev ? devData : prodData;

  log.info({ isDev }, 'Seeding database from JSON configuration');

  // Seed common data first
  await seedFromData(database, seedData as SeedData);

  // Then seed environment-specific data
  await seedFromData(database, envData);

  // Mark as seeded
  database.run(`
    INSERT INTO app_meta (key, value) VALUES ('seeded', 'true');
  `);
}

// Track seeded user IDs for note references
let seededUserIds: number[] = [];

/**
 * Seeds database tables from a SeedData object.
 */
async function seedFromData(database: Database, data: SeedData): Promise<void> {
  // Seed categories
  if (data.categories?.length) {
    for (const category of data.categories) {
      database.run(
        'INSERT INTO categories (name, color) VALUES (?, ?)',
        [category.name, category.color]
      );
    }
    log.debug({ count: data.categories.length }, 'Seeded categories');
  }

  // Seed invitation codes
  if (data.invitationCodes?.length) {
    for (const code of data.invitationCodes) {
      database.run(
        'INSERT INTO invitation_codes (code) VALUES (?)',
        [code.code]
      );
    }
    log.debug({ count: data.invitationCodes.length }, 'Seeded invitation codes');
  }

  // Seed users (hash passwords)
  if (data.users?.length) {
    for (const user of data.users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      database.run(
        'INSERT INTO users (username, password_hash, display_name, is_admin) VALUES (?, ?, ?, ?)',
        [user.username, passwordHash, user.displayName, user.isAdmin ? 1 : 0]
      );
      // Track the inserted user ID
      const result = database.exec('SELECT last_insert_rowid()');
      seededUserIds.push(Number(result[0].values[0][0]));
    }
    log.debug({ count: data.users.length }, 'Seeded users');
  }

  // Seed notes
  if (data.notes?.length) {
    for (const note of data.notes) {
      // Resolve user ID from index
      const userId = seededUserIds[note.userIndex];
      if (!userId) {
        log.warn({ userIndex: note.userIndex }, 'Invalid user index for note, skipping');
        continue;
      }

      // Resolve category ID from name
      let categoryId: number | null = null;
      if (note.categoryName) {
        const catResult = database.exec(
          'SELECT id FROM categories WHERE name = ?',
          [note.categoryName]
        );
        if (catResult.length > 0 && catResult[0].values.length > 0) {
          categoryId = Number(catResult[0].values[0][0]);
        }
      }

      // Calculate dates based on daysAgo
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - note.daysAgo);
      const updatedAt = new Date(createdAt);
      // Make updated_at slightly after created_at for sorting
      updatedAt.setHours(updatedAt.getHours() + 1);

      database.run(
        `INSERT INTO notes (user_id, title, content, category_id, location, note_time, is_pinned, is_archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          note.title,
          note.content,
          categoryId,
          note.location ?? null,
          note.noteTime ?? null,
          note.isPinned ? 1 : 0,
          note.isArchived ? 1 : 0,
          createdAt.toISOString(),
          updatedAt.toISOString()
        ]
      );
    }
    log.debug({ count: data.notes.length }, 'Seeded notes');
  }
}

/**
 * Initializes the sql.js database, loading from IndexedDB if available.
 */
export async function initDatabase(): Promise<Database> {
  if (db) {
    log.debug('Database already initialized');
    return db;
  }

  log.info('Initializing database');

  const SQL = await loadSqlJs();

  const existingData = await loadFromIndexedDB();

  if (existingData) {
    log.debug({ size: existingData.length }, 'Loading existing database from IndexedDB');
    db = new SQL.Database(existingData);
  } else {
    log.debug('Creating new database');
    db = new SQL.Database();
    createSchema(db);
    await seedDatabase(db);
    await persistDatabase();
  }

  // Start periodic saves
  startPeriodicSave();

  log.info('Database initialized successfully');
  return db;
}

/**
 * Gets the database instance. Throws if not initialized.
 */
export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Persists the current database state to IndexedDB.
 */
export async function persistDatabase(): Promise<void> {
  if (!db) return;
  const data = db.export();
  await saveToIndexedDB(data);
}

/**
 * Starts the periodic save interval.
 */
function startPeriodicSave(): void {
  if (saveIntervalId !== null) return;

  log.debug({ intervalMs: SAVE_INTERVAL_MS }, 'Starting periodic database saves');

  saveIntervalId = window.setInterval(() => {
    persistDatabase().catch((err) => log.error({ err }, 'Periodic save failed'));
  }, SAVE_INTERVAL_MS);

  // Also save on page unload
  window.addEventListener('beforeunload', () => {
    if (db) {
      const data = db.export();
      // Synchronous save attempt using localStorage as fallback
      try {
        const idb = indexedDB.open(DB_NAME, 1);
        idb.onsuccess = () => {
          const tx = idb.result.transaction(DB_STORE, 'readwrite');
          tx.objectStore(DB_STORE).put(data, 'data');
        };
      } catch {
        // Best effort
      }
    }
  });
}

/**
 * Closes the database and cleans up resources.
 */
export function closeDatabase(): void {
  log.debug('Closing database');
  if (saveIntervalId !== null) {
    clearInterval(saveIntervalId);
    saveIntervalId = null;
  }
  if (db) {
    db.close();
    db = null;
  }
  log.info('Database closed');
}

/**
 * Clears the database from IndexedDB.
 * Useful for testing and resetting demo data.
 */
export async function clearDatabase(): Promise<void> {
  log.info('Clearing database from IndexedDB');
  closeDatabase();
  const idb = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    const request = store.delete('data');

    request.onerror = () => {
      log.error({ err: request.error }, 'Failed to clear database');
      reject(request.error);
    };
    request.onsuccess = () => {
      log.info('Database cleared successfully');
      resolve();
    };
  });
}
