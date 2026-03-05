<script lang="ts">
  import { tick } from 'svelte';
  import { t } from 'svelte-i18n';
  import CategoryPill from '$lib/components/common/CategoryPill.svelte';

  export interface NoteListItemData {
    id: number;
    title: string;
    createdAt: string;
    category?: {
      name: string;
      color: string;
    };
    isPinned: boolean;
    isArchived: boolean;
  }

  interface Props {
    note: NoteListItemData;
    onEdit?: (noteId: number) => void;
    onMenuAction?: (noteId: number, action: string) => void;
  }

  let { note, onEdit, onMenuAction }: Props = $props();

  let menuOpen = $state(false);
  let menuTriggerEl = $state<HTMLButtonElement>();
  let menuContainerEl = $state<HTMLDivElement>();

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function handleRowKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit?.(note.id);
    }
  }

  function handleMenuClick() {
    menuOpen = !menuOpen;
    if (!menuOpen) return;
    tick().then(() => focusFirstMenuItem());
  }

  function handleMenuAction(action: string) {
    menuOpen = false;
    onMenuAction?.(note.id, action);
    menuTriggerEl?.focus();
  }

  function handleMenuKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      menuOpen = false;
      menuTriggerEl?.focus();
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = menuContainerEl?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      if (!items || items.length === 0) return;

      const current = document.activeElement as HTMLElement;
      const index = Array.from(items).indexOf(current);

      let next: number;
      if (e.key === 'ArrowDown') {
        next = index < items.length - 1 ? index + 1 : 0;
      } else {
        next = index > 0 ? index - 1 : items.length - 1;
      }
      items[next].focus();
    }
  }

  function focusFirstMenuItem() {
    const first = menuContainerEl?.querySelector<HTMLElement>('[role="menuitem"]');
    first?.focus();
  }
</script>

<div
  class="flex items-center gap-4 px-4 py-3 border-b border-stone-800 hover:bg-stone-900/50 transition-colors group cursor-pointer"
  class:opacity-60={note.isArchived}
  role="button"
  tabindex="0"
  onclick={() => onEdit?.(note.id)}
  onkeydown={handleRowKeydown}
>
  <!-- Pin icon (if pinned) -->
  {#if note.isPinned}
    <span class="text-amber-500 flex-shrink-0" title={$t('common.pinned')}>
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
      </svg>
    </span>
  {/if}

  <!-- Title and date -->
  <div class="flex-1 min-w-0">
    <div class="flex items-baseline gap-2">
      <h3 class="text-stone-100 font-medium truncate">{note.title}</h3>
      <span class="text-stone-500 text-sm flex-shrink-0">{$t('common.noteAdded', { values: { date: formatDate(note.createdAt) } })}</span>
    </div>
  </div>

  <!-- Category pill -->
  {#if note.category}
    <div class="flex-shrink-0">
      <CategoryPill name={note.category.name} color={note.category.color} />
    </div>
  {/if}

  <!-- Edit button -->
  <button
    type="button"
    onclick={(e: MouseEvent) => { e.stopPropagation(); onEdit?.(note.id); }}
    class="flex-shrink-0 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-md text-sm font-medium text-stone-300 transition-colors opacity-0 group-hover:opacity-100"
  >
    {$t('common.edit')}
  </button>

  <!-- Dot menu -->
  <!-- svelte-ignore a11y_no_static_element_interactions -- keydown delegated from child menu items -->
  <div
    class="relative flex-shrink-0"
    onclick={(e: MouseEvent) => e.stopPropagation()}
    onkeydown={handleMenuKeydown}
    bind:this={menuContainerEl}
  >
    <button
      type="button"
      bind:this={menuTriggerEl}
      onclick={handleMenuClick}
      aria-label={$t('common.noteActionsMenu')}
      aria-haspopup="true"
      aria-expanded={menuOpen}
      class="p-1.5 text-stone-500 hover:text-stone-300 rounded transition-colors opacity-0 group-hover:opacity-100"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="6" r="2"/>
        <circle cx="12" cy="12" r="2"/>
        <circle cx="12" cy="18" r="2"/>
      </svg>
    </button>

    {#if menuOpen}
      <div
        class="fixed inset-0 z-10"
        role="presentation"
        onclick={() => { menuOpen = false; }}
      ></div>
      <div class="absolute right-0 top-full mt-1 w-40 bg-stone-800 border border-stone-700 rounded-lg shadow-lg z-20 py-1" role="menu">
        {#if note.isPinned}
          <button
            type="button"
            role="menuitem"
            tabindex="-1"
            onclick={() => handleMenuAction('unpin')}
            class="w-full px-3 py-2 text-left text-sm text-stone-300 hover:bg-stone-700"
          >
            {$t('common.unpin')}
          </button>
        {:else}
          <button
            type="button"
            role="menuitem"
            tabindex="-1"
            onclick={() => handleMenuAction('pin')}
            class="w-full px-3 py-2 text-left text-sm text-stone-300 hover:bg-stone-700"
          >
            {$t('common.pin')}
          </button>
        {/if}
        {#if note.isArchived}
          <button
            type="button"
            role="menuitem"
            tabindex="-1"
            onclick={() => handleMenuAction('restore')}
            class="w-full px-3 py-2 text-left text-sm text-stone-300 hover:bg-stone-700"
          >
            {$t('common.restore')}
          </button>
        {:else}
          <button
            type="button"
            role="menuitem"
            tabindex="-1"
            onclick={() => handleMenuAction('archive')}
            class="w-full px-3 py-2 text-left text-sm text-stone-300 hover:bg-stone-700"
          >
            {$t('common.archive')}
          </button>
        {/if}
        <button
          type="button"
          role="menuitem"
          tabindex="-1"
          onclick={() => handleMenuAction('share')}
          class="w-full px-3 py-2 text-left text-sm text-stone-300 hover:bg-stone-700"
        >
          {$t('common.share')}
        </button>
        <hr class="my-1 border-stone-700" />
        <button
          type="button"
          role="menuitem"
          tabindex="-1"
          onclick={() => handleMenuAction('delete')}
          class="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-stone-700"
        >
          {$t('common.delete')}
        </button>
      </div>
    {/if}
  </div>
</div>
