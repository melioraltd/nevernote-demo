import { writable } from 'svelte/store';
import { initDatabase } from '$lib/db/database';
import type { Database } from '$lib/db/types';

export type DatabaseStatus = 'idle' | 'loading' | 'ready' | 'error';

interface DatabaseState {
  status: DatabaseStatus;
  error: string | null;
  db: Database | null;
}

function createDatabaseStore() {
  const { subscribe, set, update } = writable<DatabaseState>({
    status: 'idle',
    error: null,
    db: null,
  });

  return {
    subscribe,

    async initialize() {
      update((state) => ({ ...state, status: 'loading', error: null }));

      try {
        const db = await initDatabase();
        set({ status: 'ready', error: null, db });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize database';
        set({ status: 'error', error: message, db: null });
      }
    },
  };
}

export const databaseStore = createDatabaseStore();
