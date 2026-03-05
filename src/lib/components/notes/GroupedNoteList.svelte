<script lang="ts">
  import { t } from 'svelte-i18n';
  import NoteListItem, { type NoteListItemData } from './NoteListItem.svelte';
  import type { NoteGroup } from '$lib/stores/note-store';

  interface Props {
    groups: NoteGroup[];
    emptyMessage?: string;
    onEdit?: (noteId: number) => void;
    onMenuAction?: (noteId: number, action: string) => void;
  }

  let {
    groups,
    emptyMessage = $t('notes.empty'),
    onEdit,
    onMenuAction
  }: Props = $props();

  // Convert NoteWithCategory to NoteListItemData
  function toListItem(note: NoteGroup['notes'][0]): NoteListItemData {
    return {
      id: note.id,
      title: note.title,
      createdAt: note.createdAt,
      category: note.category,
      isPinned: note.isPinned,
      isArchived: note.isArchived
    };
  }

  // Check if there are any notes across all groups
  const hasNotes = $derived(groups.some(g => g.notes.length > 0));
</script>

<div class="flex-1 overflow-y-auto">
  {#if !hasNotes}
    <div class="flex flex-col items-center justify-center h-full text-stone-500 p-8">
      <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-lg">{emptyMessage}</p>
    </div>
  {:else}
    {#each groups as group (group.categoryId ?? 'uncategorized')}
      {#if group.notes.length > 0}
        <!-- Category Header -->
        <div class="sticky top-0 z-10 px-4 py-2 bg-stone-900 border-b border-stone-800 flex items-center gap-2">
          <span
            class="w-3 h-3 rounded-full"
            style="background-color: {group.categoryColor};"
          ></span>
          <h2 class="text-sm font-semibold text-stone-300 uppercase tracking-wide">
            {group.categoryName}
          </h2>
          <span class="text-xs text-stone-500">({group.notes.length})</span>
        </div>

        <!-- Notes in this category -->
        {#each group.notes as note (note.id)}
          <NoteListItem
            note={toListItem(note)}
            {onEdit}
            {onMenuAction}
          />
        {/each}
      {/if}
    {/each}
  {/if}
</div>
