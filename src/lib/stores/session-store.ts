import { writable, derived } from 'svelte/store';

export interface User {
  id: number;
  username: string;
  displayName: string | null;
  isAdmin: boolean;
}

interface SessionState {
  user: User | null;
  isLoading: boolean;
}

const SESSION_KEY = 'nevernote-session';

function createSessionStore() {
  const { subscribe, set, update } = writable<SessionState>({
    user: null,
    isLoading: true,
  });

  return {
    subscribe,

    /**
     * Initialize session from storage.
     */
    initialize() {
      try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) {
          const user = JSON.parse(stored) as User;
          set({ user, isLoading: false });
        } else {
          set({ user: null, isLoading: false });
        }
      } catch {
        set({ user: null, isLoading: false });
      }
    },

    /**
     * Set the authenticated user.
     */
    setUser(user: User) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      set({ user, isLoading: false });
    },

    /**
     * Clear the session.
     */
    clear() {
      sessionStorage.removeItem(SESSION_KEY);
      set({ user: null, isLoading: false });
    },

    /**
     * Set loading state.
     */
    setLoading(isLoading: boolean) {
      update((state) => ({ ...state, isLoading }));
    },
  };
}

export const sessionStore = createSessionStore();

export const currentUser = derived(sessionStore, ($session) => $session.user);
export const isAuthenticated = derived(sessionStore, ($session) => $session.user !== null);
export const isSessionLoading = derived(sessionStore, ($session) => $session.isLoading);
