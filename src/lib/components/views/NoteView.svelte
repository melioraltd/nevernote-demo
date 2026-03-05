<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { t } from 'svelte-i18n';
  import { AppShell, type MenuItem } from '$lib/components/layout';
  import { sidebarStore, sidebarCollapsed } from '$lib/stores/sidebar-store';
  import { notesStore } from '$lib/stores/note-store';
  import { categoriesStore, categories, type Category } from '$lib/stores/category-store';
  import { currentUser } from '$lib/stores/session-store';
  import { router } from '$lib/stores/router-store';

  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { RichTextEditor } from '$lib/components/ui/rich-text-editor';
  import { ConfirmDialog } from '$lib/components/ui/confirm-dialog';
  import * as Select from '$lib/components/ui/select';

  interface Props {
    noteId: number | null;
  }

  let { noteId }: Props = $props();

  let collapsed = $state(false);
  let user = $state<{ id: number; username: string; displayName: string | null; isAdmin: boolean } | null>(null);
  let categoryList = $state<Category[]>([]);

  let title = $state('');
  let content = $state('');
  let categoryId = $state<number | null>(null);
  let location = $state<string | null>(null);
  let noteTime = $state<string | null>(null);
  let isPinned = $state(false);

  let editingLocation = $state(false);
  let editingTime = $state(false);

  let loading = $state(false);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let validationError = $state<string | null>(null);

  let initialTitle = $state('');
  let initialContent = $state('');
  let initialCategoryId = $state<number | null>(null);
  let initialLocation = $state<string | null>(null);
  let initialNoteTime = $state<string | null>(null);
  let initialIsPinned = $state(false);
  let showDiscardDialog = $state(false);

  const isDirty = $derived(
    title !== initialTitle ||
    content !== initialContent ||
    categoryId !== initialCategoryId ||
    location !== initialLocation ||
    noteTime !== initialNoteTime ||
    isPinned !== initialIsPinned
  );

  sidebarCollapsed.subscribe(value => collapsed = value);
  currentUser.subscribe(value => user = value);
  categories.subscribe(value => categoryList = value);

  const isNewNote = $derived(noteId === null);
  const userName = $derived(user?.displayName || user?.username || '');
  const userInitial = $derived(userName.charAt(0).toUpperCase() || '?');

  const selectedCategory = $derived(categoryList.find(c => c.id === categoryId));
  const selectedCategoryValue = $derived(categoryId !== null ? String(categoryId) : undefined);

  const menuItems: MenuItem[] = [
    { id: 'all-notes', icon: '🏠', label: $t('notes.allNotes') },
    { id: 'recent', icon: '🕐', label: $t('notes.recentNotes') },
    { id: 'by-category', icon: '📋', label: $t('notes.notesByCategory') },
    { id: 'pinned', icon: '📌', label: $t('notes.pinnedNotes') },
    { id: 'settings', icon: '⚙️', label: $t('notes.settings') }
  ];

  function handleSidebarItemClick(itemId: string) {
    if (itemId === 'settings') {
      router.navigate('/settings');
    } else {
      router.navigate('/main');
    }
  }

  function handleToggleSidebar() {
    sidebarStore.toggleCollapsed();
  }

  function handleUserClick() {
    router.navigate('/settings');
  }

  function handleCancel() {
    if (isDirty) {
      showDiscardDialog = true;
    } else {
      router.navigate('/main');
    }
  }

  function handleConfirmDiscard() {
    showDiscardDialog = false;
    router.navigate('/main');
  }

  function handleCancelDiscard() {
    showDiscardDialog = false;
  }

  function handleWindowKeydown(e: KeyboardEvent) {
    if (e.key !== 'Escape' || saving) return;

    const active = document.activeElement;
    const isInPopover = active?.closest('[data-radix-popper-content-wrapper], [data-bits-select-content]');
    if (isInPopover) return;

    if (showDiscardDialog) return;

    e.preventDefault();
    handleCancel();
  }

  async function handleSave() {
    validationError = null;

    if (!title.trim()) {
      validationError = $t('noteEditor.titleRequired');
      return;
    }

    if (!user) {
      validationError = $t('noteEditor.notLoggedIn');
      return;
    }

    saving = true;
    error = null;

    try {
      if (isNewNote) {
        await notesStore.create(user.id, title.trim(), content, categoryId, location, noteTime);
      } else {
        await notesStore.update(noteId!, user.id, {
          title: title.trim(),
          content,
          categoryId,
          location,
          noteTime,
          isPinned
        });
      }
      router.navigate('/main');
    } catch (err) {
      error = $t('noteEditor.saveFailed');
      saving = false;
    }
  }

  function handleTogglePin() {
    isPinned = !isPinned;
  }

  function handleCategoryChange(value: string | undefined) {
    if (value === undefined || value === '') {
      categoryId = null;
    } else {
      categoryId = parseInt(value, 10);
    }
  }

  function getDefaultCategoryId(): number | null {
    const otherCategory = categoryList.find(c => c.name === 'Other');
    return otherCategory?.id ?? null;
  }

  async function loadNote() {
    if (!noteId || !user) return;

    loading = true;
    error = null;

    try {
      const note = await notesStore.getById(noteId, user.id);
      if (note) {
        title = note.title;
        content = note.content || '';
        categoryId = note.categoryId;
        location = note.location;
        noteTime = note.noteTime;
        isPinned = note.isPinned;

        initialTitle = title;
        initialContent = content;
        initialCategoryId = categoryId;
        initialLocation = location;
        initialNoteTime = noteTime;
        initialIsPinned = isPinned;
      } else {
        error = $t('noteEditor.noteNotFound');
      }
    } catch (err) {
      error = $t('noteEditor.loadFailed');
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await categoriesStore.load();

    if (isNewNote) {
      categoryId = getDefaultCategoryId();

      initialTitle = title;
      initialContent = content;
      initialCategoryId = categoryId;
      initialLocation = location;
      initialNoteTime = noteTime;
      initialIsPinned = isPinned;

      await tick();
      document.getElementById('title')?.focus();
    } else {
      await loadNote();
    }
  });
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<AppShell
  sidebarItems={menuItems}
  activeItemId=""
  sidebarCollapsed={collapsed}
  {userName}
  {userInitial}
  onSidebarItemClick={handleSidebarItemClick}
  onSidebarToggle={handleToggleSidebar}
  onUserClick={handleUserClick}
>
  <div class="flex-1 flex flex-col p-6 overflow-auto">
    {#if loading}
      <div class="flex items-center justify-center h-full">
        <div class="text-muted-foreground">{$t('noteEditor.loading')}</div>
      </div>
    {:else if error && !title}
      <div class="flex flex-col items-center justify-center h-full gap-4">
        <div class="text-destructive">{error}</div>
        <Button variant="outline" onclick={handleCancel}>
          {$t('noteEditor.backToNotes')}
        </Button>
      </div>
    {:else}
      <!-- Header row with category and title -->
      <div class="flex items-center gap-4 mb-6">
        <!-- Category dropdown -->
        <div class="flex items-center gap-2">
          <Label for="category" class="text-muted-foreground text-sm">{$t('noteEditor.categoryLabel')}</Label>
          <Select.Root type="single" value={selectedCategoryValue} onValueChange={handleCategoryChange}>
            <Select.Trigger class="w-[180px]">
              {#if selectedCategory}
                <span class="flex items-center gap-2">
                  <span
                    class="w-2 h-2 rounded-full"
                    style="background-color: {selectedCategory.color}"
                  ></span>
                  {selectedCategory.name}
                </span>
              {:else}
                <span class="text-muted-foreground">{$t('noteEditor.selectCategory')}</span>
              {/if}
            </Select.Trigger>
            <Select.Content>
              {#each categoryList as category}
                <Select.Item value={String(category.id)}>
                  <span class="flex items-center gap-2">
                    <span
                      class="w-2 h-2 rounded-full"
                      style="background-color: {category.color}"
                    ></span>
                    {category.name}
                  </span>
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <!-- Chevron separator -->
        <svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>

        <!-- Title input -->
        <div class="flex-1 flex items-center gap-2">
          <Label for="title" class="text-muted-foreground text-sm">{$t('noteEditor.titleLabel')}</Label>
          <Input
            id="title"
            type="text"
            bind:value={title}
            placeholder={$t('noteEditor.titlePlaceholder')}
            class="flex-1"
          />
        </div>

        <!-- Pin toggle -->
        <Button
          variant={isPinned ? 'secondary' : 'outline'}
          size="icon"
          onclick={handleTogglePin}
          title={isPinned ? $t('noteEditor.unpinNote') : $t('noteEditor.pinNote')}
          class={isPinned ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : ''}
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
          </svg>
        </Button>
      </div>

      <!-- Location and time fields -->
      <div class="flex items-center gap-6 mb-4">
        <!-- Location chooser -->
        <button
          type="button"
          class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onclick={() => editingLocation = true}
          class:hidden={editingLocation}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{location || $t('noteEditor.locationPlaceholder')}</span>
        </button>
        {#if editingLocation}
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <Input
              type="text"
              value={location ?? ''}
              placeholder={$t('noteEditor.locationPlaceholder')}
              class="w-[280px] h-8 text-sm"
              oninput={(e: Event) => {
                const val = (e.target as HTMLInputElement).value;
                location = val || null;
              }}
              onblur={() => editingLocation = false}
              onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') editingLocation = false; }}
              autofocus
            />
          </div>
        {/if}

        <!-- Time chooser -->
        <button
          type="button"
          class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onclick={() => editingTime = true}
          class:hidden={editingTime}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{noteTime ? new Date(noteTime).toLocaleString() : $t('noteEditor.timePlaceholder')}</span>
        </button>
        {#if editingTime}
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <Input
              type="datetime-local"
              value={noteTime ?? ''}
              class="w-[220px] h-8 text-sm"
              oninput={(e: Event) => {
                const val = (e.target as HTMLInputElement).value;
                noteTime = val || null;
              }}
              onblur={() => editingTime = false}
              onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') editingTime = false; }}
              autofocus
            />
          </div>
        {/if}
      </div>

      <!-- Validation error -->
      {#if validationError}
        <div class="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
          {validationError}
        </div>
      {/if}

      <!-- Save error -->
      {#if error && title}
        <div class="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
          {error}
        </div>
      {/if}

      <!-- Content editor -->
      <div class="flex-1 flex flex-col min-h-0">
        <RichTextEditor
          {content}
          placeholder={$t('noteEditor.contentPlaceholder')}
          autofocus={!isNewNote}
          onUpdate={(html) => content = html}
        />
      </div>

      <!-- Action buttons -->
      <div class="flex justify-end gap-3 mt-6">
        <Button variant="outline" onclick={handleCancel} disabled={saving}>
          {$t('noteEditor.cancel')}
        </Button>
        <Button onclick={handleSave} disabled={saving}>
          {saving ? $t('noteEditor.saving') : $t('noteEditor.save')}
        </Button>
      </div>
    {/if}
  </div>
</AppShell>

<ConfirmDialog
  bind:open={showDiscardDialog}
  title={$t('noteEditor.discardTitle')}
  description={$t('noteEditor.discardDescription')}
  confirmLabel={$t('noteEditor.discardConfirm')}
  cancelLabel={$t('noteEditor.discardCancel')}
  variant="destructive"
  onConfirm={handleConfirmDiscard}
  onCancel={handleCancelDiscard}
/>
