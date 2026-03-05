<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { AppShell, TopBar, type MenuItem } from '$lib/components/layout';
  import { NoteList, GroupedNoteList, type NoteListItemData } from '$lib/components/notes';
  import { sidebarStore, sidebarCollapsed, activeMenuItem } from '$lib/stores/sidebar-store';
  import { notesStore, filteredNotes, notesGroupedByCategory, showArchived, searchQuery, type NoteGroup } from '$lib/stores/note-store';
  import { categoriesStore } from '$lib/stores/category-store';
  import { currentUser } from '$lib/stores/session-store';
  import { logout } from '$lib/services/auth-service';
  import { router } from '$lib/stores/router-store';

  import { Button } from '$lib/components/ui/button';
  import { Switch } from '$lib/components/ui/switch';
  import { Label } from '$lib/components/ui/label';

  // Subscribe to stores
  let collapsed = $state(false);
  let activeItem = $state('all-notes');
  let notes = $state<NoteListItemData[]>([]);
  let groupedNotes = $state<NoteGroup[]>([]);
  let isShowArchived = $state(false);
  let query = $state('');
  let user = $state<{ id: number; username: string; displayName: string | null; isAdmin: boolean } | null>(null);

  sidebarCollapsed.subscribe(value => collapsed = value);
  activeMenuItem.subscribe(value => activeItem = value);
  filteredNotes.subscribe(value => {
    notes = value.map(n => ({
      id: n.id,
      title: n.title,
      createdAt: n.createdAt,
      category: n.category,
      isPinned: n.isPinned,
      isArchived: n.isArchived
    }));
  });
  notesGroupedByCategory.subscribe(value => groupedNotes = value);
  showArchived.subscribe(value => isShowArchived = value);
  searchQuery.subscribe(value => query = value);
  currentUser.subscribe(value => user = value);

  // Define sidebar menu items for Authors
  const menuItems: MenuItem[] = [
    { id: 'all-notes', icon: '🏠', label: $t('notes.allNotes') },
    { id: 'recent', icon: '🕐', label: $t('notes.recentNotes') },
    { id: 'by-category', icon: '📋', label: $t('notes.notesByCategory') },
    { id: 'pinned', icon: '📌', label: $t('notes.pinnedNotes') },
    { id: 'settings', icon: '⚙️', label: $t('notes.settings') }
  ];

  // TODO: Add shared notes item conditionally when hasSharedNotes is true
  // { id: 'shared', icon: '🔗', label: 'Shared notes', variant: 'highlighted' }

  function handleSidebarItemClick(itemId: string) {
    sidebarStore.setActiveItem(itemId);

    // Update filter based on selection
    switch (itemId) {
      case 'all-notes':
        notesStore.setFilter('all');
        break;
      case 'recent':
        notesStore.setFilter('recent');
        break;
      case 'pinned':
        notesStore.setFilter('pinned');
        break;
      case 'shared':
        notesStore.setFilter('shared');
        break;
      case 'by-category':
        notesStore.setFilter('by-category');
        break;
      case 'settings':
        router.navigate('/settings');
        break;
    }
  }

  function handleToggleSidebar() {
    sidebarStore.toggleCollapsed();
  }

  function handleUserClick() {
    router.navigate('/settings');
  }

  function handleSearchChange(newQuery: string) {
    notesStore.setSearchQuery(newQuery);
  }

  function handleToggleArchived(checked: boolean) {
    notesStore.setShowArchived(checked);
  }

  function handleAddNote() {
    router.navigate('/note/new');
  }

  function handleEditNote(noteId: number) {
    router.navigate(`/note/${noteId}`);
  }

  function handleNoteMenuAction(noteId: number, action: string) {
    if (!user) return;

    switch (action) {
      case 'pin':
      case 'unpin':
        notesStore.togglePin(noteId, user.id);
        break;
      case 'archive':
      case 'restore':
        notesStore.toggleArchive(noteId, user.id);
        break;
      case 'share':
        // TODO: Implement share
        break;
      case 'delete':
        if (confirm($t('notes.deleteConfirm'))) {
          notesStore.delete(noteId, user.id);
        }
        break;
    }
  }

  function handleLogout() {
    logout();
    router.navigate('/login');
  }

  // Get user display info
  const userName = $derived(user?.displayName || user?.username || '');
  const userInitial = $derived(userName.charAt(0).toUpperCase() || '?');

  // Get empty message based on current filter
  const emptyMessage = $derived(() => {
    if (query) return $t('notes.emptySearch');
    switch (activeItem) {
      case 'pinned': return $t('notes.emptyPinned');
      case 'recent': return $t('notes.emptyRecent');
      case 'shared': return $t('notes.emptyShared');
      case 'by-category': return $t('notes.emptyByCategory');
      default: return $t('notes.emptyDefault');
    }
  });

  // Load data on mount
  onMount(async () => {
    if (user) {
      await Promise.all([
        notesStore.load(user.id),
        categoriesStore.load()
      ]);
    }
  });
</script>

<AppShell
  sidebarItems={menuItems}
  activeItemId={activeItem}
  sidebarCollapsed={collapsed}
  {userName}
  {userInitial}
  onSidebarItemClick={handleSidebarItemClick}
  onSidebarToggle={handleToggleSidebar}
  onUserClick={handleUserClick}
>
  <!-- Top bar with search and actions -->
  <TopBar
    searchQuery={query}
    searchPlaceholder={$t('notes.searchPlaceholder')}
    onSearchChange={handleSearchChange}
  >
    {#snippet actions()}
      <!-- Show archived toggle -->
      <div class="flex items-center gap-2">
        <Label for="show-archived" class="text-sm text-muted-foreground cursor-pointer">
          {$t('notes.showArchived')}
        </Label>
        <Switch
          id="show-archived"
          checked={isShowArchived}
          onCheckedChange={handleToggleArchived}
        />
      </div>

      <!-- Add note button -->
      <Button onclick={handleAddNote}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {$t('notes.addNewNote')}
      </Button>

      <!-- Logout button -->
      <Button variant="ghost" size="icon" onclick={handleLogout} title={$t('common.logout')}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </Button>
    {/snippet}
  </TopBar>

  <!-- Note list -->
  {#if activeItem === 'by-category'}
    <GroupedNoteList
      groups={groupedNotes}
      emptyMessage={emptyMessage()}
      onEdit={handleEditNote}
      onMenuAction={handleNoteMenuAction}
    />
  {:else}
    <NoteList
      {notes}
      emptyMessage={emptyMessage()}
      onEdit={handleEditNote}
      onMenuAction={handleNoteMenuAction}
    />
  {/if}
</AppShell>
