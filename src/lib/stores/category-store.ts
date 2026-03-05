import { writable, derived, get } from 'svelte/store';
import { t } from 'svelte-i18n';
import { getAllCategories, type Category } from '$lib/services/category-service';
import { createLogger } from '$lib/logger';

export type { Category } from '$lib/services/category-service';

const log = createLogger('category-store');

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

function createCategoryStore() {
  const { subscribe, set, update } = writable<CategoryState>({
    categories: [],
    loading: false,
    error: null
  });

  return {
    subscribe,

    async load() {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const categories = getAllCategories();
        set({ categories, loading: false, error: null });
      } catch (err) {
        log.error({ err }, 'Failed to load categories');
        update(state => ({
          ...state,
          loading: false,
          error: get(t)('common.loadCategoriesFailed')
        }));
      }
    },

    getById(id: number): Category | undefined {
      let category: Category | undefined;
      subscribe(state => {
        category = state.categories.find(c => c.id === id);
      })();
      return category;
    }
  };
}

export const categoriesStore = createCategoryStore();

export const categories = derived(categoriesStore, $state => $state.categories);
export const categoriesLoading = derived(categoriesStore, $state => $state.loading);
