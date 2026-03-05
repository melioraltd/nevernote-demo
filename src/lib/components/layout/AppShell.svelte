<script lang="ts">
  import type { Snippet } from 'svelte';
  import Sidebar, { type MenuItem } from './Sidebar.svelte';

  interface Props {
    sidebarItems: MenuItem[];
    activeItemId: string;
    sidebarCollapsed?: boolean;
    userName?: string;
    userInitial?: string;
    onSidebarItemClick?: (itemId: string) => void;
    onSidebarToggle?: () => void;
    onUserClick?: () => void;
    children: Snippet;
  }

  let {
    sidebarItems,
    activeItemId,
    sidebarCollapsed = false,
    userName = '',
    userInitial = '',
    onSidebarItemClick,
    onSidebarToggle,
    onUserClick,
    children
  }: Props = $props();
</script>

<div class="flex h-screen bg-stone-950">
  <!-- Sidebar -->
  <Sidebar
    items={sidebarItems}
    {activeItemId}
    collapsed={sidebarCollapsed}
    {userName}
    {userInitial}
    onItemClick={onSidebarItemClick}
    onToggleCollapse={onSidebarToggle}
    {onUserClick}
  />

  <!-- Main content area -->
  <main class="flex-1 flex flex-col overflow-hidden">
    {@render children()}
  </main>
</div>
