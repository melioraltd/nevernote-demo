import { writable, derived, get } from 'svelte/store';
import { t } from 'svelte-i18n';
import {
  getNotesByUserId,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  toggleNotePin,
  toggleNoteArchive,
  type Note,
  type NoteWithCategory
} from '$lib/services/note-service';
import { createLogger } from '$lib/logger';

export type { Note, NoteWithCategory } from '$lib/services/note-service';

const log = createLogger('note-store');

interface NotesState {
  notes: NoteWithCategory[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  showArchived: boolean;
  filter: 'all' | 'recent' | 'pinned' | 'shared' | 'category' | 'by-category';
  selectedCategoryId: number | null;
}

function createNotesStore() {
  const { subscribe, update } = writable<NotesState>({
    notes: [],
    loading: false,
    error: null,
    searchQuery: '',
    showArchived: false,
    filter: 'all',
    selectedCategoryId: null
  });

  return {
    subscribe,

    async load(userId: number) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const notes = getNotesByUserId(userId);
        update(state => ({ ...state, notes, loading: false }));
      } catch (err) {
        log.error({ err }, 'Failed to load notes');
        update(state => ({
          ...state,
          loading: false,
          error: get(t)('notes.loadFailed')
        }));
      }
    },

    setSearchQuery(query: string) {
      update(state => ({ ...state, searchQuery: query }));
    },

    setShowArchived(show: boolean) {
      update(state => ({ ...state, showArchived: show }));
    },

    setFilter(filter: NotesState['filter'], categoryId?: number) {
      update(state => ({
        ...state,
        filter,
        selectedCategoryId: categoryId ?? null
      }));
    },

    async create(userId: number, title: string, content: string = '', categoryId: number | null = null, location: string | null = null, noteTime: string | null = null) {
      try {
        const newId = await createNote(userId, title, content, categoryId, location, noteTime);
        await this.load(userId);
        return newId;
      } catch (err) {
        log.error({ err }, 'Failed to create note');
        throw err;
      }
    },

    async update(noteId: number, userId: number, updates: Partial<Pick<Note, 'title' | 'content' | 'categoryId' | 'location' | 'noteTime' | 'isPinned'>>) {
      try {
        await updateNote(noteId, userId, updates);
        await this.load(userId);
      } catch (err) {
        log.error({ err, noteId }, 'Failed to update note');
        throw err;
      }
    },

    async delete(noteId: number, userId: number) {
      try {
        await deleteNote(noteId, userId);
        await this.load(userId);
      } catch (err) {
        log.error({ err, noteId }, 'Failed to delete note');
        throw err;
      }
    },

    async togglePin(noteId: number, userId: number) {
      try {
        await toggleNotePin(noteId, userId);
        await this.load(userId);
      } catch (err) {
        log.error({ err, noteId }, 'Failed to toggle pin');
        throw err;
      }
    },

    async toggleArchive(noteId: number, userId: number) {
      try {
        await toggleNoteArchive(noteId, userId);
        await this.load(userId);
      } catch (err) {
        log.error({ err, noteId }, 'Failed to toggle archive');
        throw err;
      }
    },

    async getById(noteId: number, userId: number): Promise<NoteWithCategory | null> {
      try {
        return getNoteById(noteId, userId);
      } catch (err) {
        log.error({ err, noteId }, 'Failed to get note by ID');
        return null;
      }
    }
  };
}

export const notesStore = createNotesStore();

// Derived stores for filtered views
export const filteredNotes = derived(notesStore, $state => {
  let notes = $state.notes;

  // Filter by archived status
  if (!$state.showArchived) {
    notes = notes.filter(n => !n.isArchived);
  }

  // Filter by type
  switch ($state.filter) {
    case 'pinned':
      notes = notes.filter(n => n.isPinned);
      break;
    case 'recent': {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      notes = notes.filter(n => new Date(n.updatedAt) >= thirtyDaysAgo);
      break;
    }
    case 'category':
      if ($state.selectedCategoryId !== null) {
        notes = notes.filter(n => n.categoryId === $state.selectedCategoryId);
      }
      break;
  }

  // Filter by search query
  if ($state.searchQuery.trim()) {
    const query = $state.searchQuery.toLowerCase();
    notes = notes.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.content?.toLowerCase().includes(query)
    );
  }

  return notes;
});

export const notesLoading = derived(notesStore, $state => $state.loading);
export const searchQuery = derived(notesStore, $state => $state.searchQuery);
export const showArchived = derived(notesStore, $state => $state.showArchived);
export const currentFilter = derived(notesStore, $state => $state.filter);

// Interface for grouped notes by category
export interface NoteGroup {
  categoryId: number | null;
  categoryName: string;
  categoryColor: string;
  notes: NoteWithCategory[];
}

// Derived store for notes grouped by category
export const notesGroupedByCategory = derived(notesStore, $state => {
  let notes = $state.notes;

  // Filter by archived status
  if (!$state.showArchived) {
    notes = notes.filter(n => !n.isArchived);
  }

  // Filter by search query
  if ($state.searchQuery.trim()) {
    const query = $state.searchQuery.toLowerCase();
    notes = notes.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.content?.toLowerCase().includes(query)
    );
  }

  // Group notes by category
  const groupsMap = new Map<number | null, NoteGroup>();

  // First pass: create groups
  for (const note of notes) {
    const categoryId = note.categoryId;

    if (!groupsMap.has(categoryId)) {
      groupsMap.set(categoryId, {
        categoryId,
        categoryName: note.category?.name ?? 'Uncategorized',
        categoryColor: note.category?.color ?? '#6b7280',
        notes: []
      });
    }

    groupsMap.get(categoryId)!.notes.push(note);
  }

  // Sort notes within each group (pinned first, then by updated_at)
  for (const group of groupsMap.values()) {
    group.notes.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  // Convert to array and sort groups (Uncategorized last, then alphabetically)
  const groups = Array.from(groupsMap.values()).sort((a, b) => {
    if (a.categoryId === null) return 1;
    if (b.categoryId === null) return -1;
    return a.categoryName.localeCompare(b.categoryName);
  });

  return groups;
});

// Check if user has any shared notes
export const hasSharedNotes = derived(notesStore, () => {
  // This would need a join with share_links table
  // For now, return false - will implement when share feature is added
  return false;
});
