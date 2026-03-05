import { writable, derived } from 'svelte/store';

const STORAGE_KEY = 'nevernote-sidebar-collapsed';

interface SidebarState {
  collapsed: boolean;
  activeItemId: string;
}

function createSidebarStore() {
  // Load initial collapsed state from localStorage
  const storedCollapsed = typeof window !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY) === 'true'
    : false;

  const { subscribe, update } = writable<SidebarState>({
    collapsed: storedCollapsed,
    activeItemId: 'all-notes'
  });

  return {
    subscribe,

    setActiveItem(itemId: string) {
      update(state => ({ ...state, activeItemId: itemId }));
    },

    toggleCollapsed() {
      update(state => {
        const newCollapsed = !state.collapsed;
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, String(newCollapsed));
        }
        return { ...state, collapsed: newCollapsed };
      });
    },

    setCollapsed(collapsed: boolean) {
      update(state => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, String(collapsed));
        }
        return { ...state, collapsed };
      });
    }
  };
}

export const sidebarStore = createSidebarStore();

export const sidebarCollapsed = derived(sidebarStore, $state => $state.collapsed);
export const activeMenuItem = derived(sidebarStore, $state => $state.activeItemId);
