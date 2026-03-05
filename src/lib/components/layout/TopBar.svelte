<script lang="ts">
  import { t } from 'svelte-i18n';
  import type { Snippet } from 'svelte';

  interface Props {
    searchQuery?: string;
    searchPlaceholder?: string;
    showSearch?: boolean;
    onSearchChange?: (query: string) => void;
    actions?: Snippet;
  }

  let {
    searchQuery = '',
    searchPlaceholder = $t('notes.searchPlaceHolder'),
    showSearch = true,
    onSearchChange,
    actions
  }: Props = $props();

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    onSearchChange?.(target.value);
  }
</script>

<header class="flex items-center justify-between gap-4 px-6 py-4 border-b border-stone-800">
  <!-- Search bar -->
  {#if showSearch}
    <div class="relative flex-1 max-w-md">
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={searchQuery}
        oninput={handleSearchInput}
        placeholder={searchPlaceholder}
        class="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-700 rounded-full
               text-stone-100 placeholder-stone-500
               focus:outline-none focus:ring-2 focus:ring-stone-600 focus:border-transparent"
      />
    </div>
  {:else}
    <div></div>
  {/if}

  <!-- Action buttons slot -->
  {#if actions}
    <div class="flex items-center gap-3">
      {@render actions()}
    </div>
  {/if}
</header>
