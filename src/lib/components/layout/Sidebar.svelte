<script lang="ts">
  import { t } from 'svelte-i18n';
  import SidebarItem from './SidebarItem.svelte';

  export interface MenuItem {
    id: string;
    icon: string;
    label: string;
    variant?: 'default' | 'highlighted';
  }

  interface Props {
    items: MenuItem[];
    activeItemId: string;
    collapsed?: boolean;
    userName?: string;
    userInitial?: string;
    onItemClick?: (itemId: string) => void;
    onToggleCollapse?: () => void;
    onUserClick?: () => void;
  }

  let {
    items,
    activeItemId,
    collapsed = false,
    userName = '',
    userInitial = '',
    onItemClick,
    onToggleCollapse,
    onUserClick
  }: Props = $props();

  function handleNavKeydown(e: KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();

    const nav = (e.currentTarget as HTMLElement);
    const buttons = nav.querySelectorAll<HTMLElement>('button');
    if (buttons.length === 0) return;

    const current = document.activeElement as HTMLElement;
    const index = Array.from(buttons).indexOf(current);

    let next: number;
    if (e.key === 'ArrowDown') {
      next = index < buttons.length - 1 ? index + 1 : 0;
    } else {
      next = index > 0 ? index - 1 : buttons.length - 1;
    }
    buttons[next].focus();
  }
</script>

<aside
  class="flex flex-col h-full bg-stone-950 border-r border-stone-800 transition-all duration-200"
  class:w-64={!collapsed}
  class:w-16={collapsed}
>
  <!-- Header: App title + collapse toggle -->
  <div class="flex items-center justify-between p-4 border-b border-stone-800">
    {#if !collapsed}
      <h1 class="text-xl font-semibold text-stone-100 tracking-tight">{$t('layout.appTitle')}</h1>
    {/if}
    <button
      type="button"
      onclick={onToggleCollapse}
      class="p-1.5 rounded-lg text-stone-400 hover:text-stone-300 hover:bg-stone-800 transition-colors"
      title={collapsed ? $t('layout.expandSidebar') : $t('layout.collapseSidebar')}
    >
      {#if collapsed}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      {:else}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      {/if}
    </button>
  </div>

  <!-- Navigation menu -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -- arrow key navigation for sidebar items -->
  <nav class="flex-1 p-2 space-y-1 overflow-y-auto" onkeydown={handleNavKeydown}>
    {#each items as item (item.id)}
      <SidebarItem
        icon={item.icon}
        label={item.label}
        active={activeItemId === item.id}
        variant={item.variant}
        {collapsed}
        onclick={() => onItemClick?.(item.id)}
      />
    {/each}
  </nav>

  <!-- Footer: User info -->
  <div class="p-2 border-t border-stone-800">
    <button
      type="button"
      onclick={onUserClick}
      class="flex items-center gap-3 w-full p-2 rounded-lg text-stone-400 hover:bg-stone-800/50 hover:text-stone-300 transition-colors"
      class:justify-center={collapsed}
      title={collapsed ? userName : undefined}
    >
      <div class="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-sm font-medium text-stone-300 flex-shrink-0">
        {userInitial}
      </div>
      {#if !collapsed}
        <span class="text-sm truncate">{userName}</span>
      {/if}
    </button>
  </div>
</aside>
