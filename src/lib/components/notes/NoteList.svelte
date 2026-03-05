<script lang="ts">
  import { t } from 'svelte-i18n';
  import NoteListItem, { type NoteListItemData } from './NoteListItem.svelte';

  interface Props {
    notes: NoteListItemData[];
    emptyMessage?: string;
    onEdit?: (noteId: number) => void;
    onMenuAction?: (noteId: number, action: string) => void;
  }

  let {
    notes,
    emptyMessage = $t('notes.empty'),
    onEdit,
    onMenuAction
  }: Props = $props();
</script>

<div class="flex-1 overflow-y-auto">
  {#if notes.length === 0}
    <div class="flex flex-col items-center justify-center h-full text-stone-500 p-8">
      <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-lg">{emptyMessage}</p>
    </div>
  {:else}
    {#each notes as note (note.id)}
      <NoteListItem
        {note}
        {onEdit}
        {onMenuAction}
      />
    {/each}
  {/if}
</div>
