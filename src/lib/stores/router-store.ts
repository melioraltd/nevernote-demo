import { writable, derived } from 'svelte/store';

export type Route = 'login' | 'signup' | 'main' | 'note' | 'settings' | 'admin' | 'shared';

interface RouterState {
  path: string;
  params: Record<string, string>;
}

function parseHash(): RouterState {
  const hash = window.location.hash.slice(1) || '/';
  const [path, query] = hash.split('?');
  const params: Record<string, string> = {};

  if (query) {
    const searchParams = new URLSearchParams(query);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  }

  return { path: path || '/', params };
}

function createRouterStore() {
  const { subscribe, set } = writable<RouterState>(parseHash());

  // Listen for hash changes
  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
      set(parseHash());
    });
  }

  return {
    subscribe,

    navigate(path: string, params?: Record<string, string>) {
      let hash = path;
      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        hash += '?' + searchParams.toString();
      }
      window.location.hash = hash;
    },

    replace(path: string, params?: Record<string, string>) {
      let hash = path;
      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        hash += '?' + searchParams.toString();
      }
      window.location.replace('#' + hash);
    },
  };
}

export const router = createRouterStore();

export const currentRoute = derived(router, ($router) => {
  const path = $router.path;

  if (path === '/' || path === '/login') return 'login' as Route;
  if (path === '/signup') return 'signup' as Route;
  if (path === '/main' || path === '/notes') return 'main' as Route;
  if (path.startsWith('/note/')) return 'note' as Route;
  if (path === '/settings') return 'settings' as Route;
  if (path === '/admin') return 'admin' as Route;
  if (path.startsWith('/shared/')) return 'shared' as Route;

  return 'login' as Route;
});

export const noteId = derived(router, ($router) => {
  const path = $router.path;
  if (path.startsWith('/note/')) {
    const id = path.slice(6);
    if (id === 'new') return null;
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
});
