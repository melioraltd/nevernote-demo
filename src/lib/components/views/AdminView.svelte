<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { AppShell, TopBar, type MenuItem } from '$lib/components/layout';
  import { sidebarStore, sidebarCollapsed } from '$lib/stores/sidebar-store';
  import { invitationStore, invitationCodes, invitationLoading, invitationError, type InvitationCode } from '$lib/stores/invitation-store';
  import { currentUser } from '$lib/stores/session-store';
  import { logout } from '$lib/services/auth-service';
  import { router } from '$lib/stores/router-store';

  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  // Subscribe to stores
  let collapsed = $state(false);
  let activeItem = $state('invitation-codes');
  let codes = $state<InvitationCode[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let user = $state<{ id: number; username: string; displayName: string | null; isAdmin: boolean } | null>(null);

  sidebarCollapsed.subscribe(value => collapsed = value);
  invitationCodes.subscribe(value => codes = value);
  invitationLoading.subscribe(value => loading = value);
  invitationError.subscribe(value => error = value);
  currentUser.subscribe(value => user = value);

  // Generate form state
  let codeCount = $state(1);
  let generatedCodes = $state<string[]>([]);
  let generating = $state(false);
  let copyFeedback = $state<string | null>(null);

  // Admin sidebar menu items
  const menuItems: MenuItem[] = [
    { id: 'invitation-codes', icon: '🎟️', label: $t('admin.invitationCodes') },
    { id: 'settings', icon: '⚙️', label: $t('admin.settings') }
  ];

  function handleSidebarItemClick(itemId: string) {
    sidebarStore.setActiveItem(itemId);
    activeItem = itemId;

    if (itemId === 'settings') {
      router.navigate('/settings');
    }
  }

  function handleToggleSidebar() {
    sidebarStore.toggleCollapsed();
  }

  function handleUserClick() {
    router.navigate('/settings');
  }

  async function handleGenerate() {
    if (codeCount < 1 || codeCount > 50) return;
    generating = true;
    generatedCodes = [];

    try {
      const newCodes = await invitationStore.generate(codeCount);
      generatedCodes = newCodes;
    } finally {
      generating = false;
    }
  }

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      copyFeedback = code;
      setTimeout(() => {
        if (copyFeedback === code) copyFeedback = null;
      }, 2000);
    } catch {
      // Fallback: select text
    }
  }

  async function handleCopyAll() {
    try {
      await navigator.clipboard.writeText(generatedCodes.join('\n'));
      copyFeedback = '__all__';
      setTimeout(() => {
        if (copyFeedback === '__all__') copyFeedback = null;
      }, 2000);
    } catch {
      // Fallback: ignore
    }
  }

  function handleLogout() {
    logout();
    router.navigate('/login');
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // User display info
  const userName = $derived(user?.displayName || user?.username || '');
  const userInitial = $derived(userName.charAt(0).toUpperCase() || '?');

  // Load data on mount
  onMount(async () => {
    sidebarStore.setActiveItem('invitation-codes');
    await invitationStore.load();
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
  <!-- Top bar -->
  <TopBar showSearch={false}>
    {#snippet actions()}
      <Button variant="ghost" size="icon" onclick={handleLogout} title={$t('common.logout')}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </Button>
    {/snippet}
  </TopBar>

  <!-- Content area -->
  <div class="flex-1 overflow-y-auto p-6 space-y-8">
    <!-- Generate codes section -->
    <section class="space-y-4">
      <h2 class="text-lg font-semibold text-stone-100">{$t('admin.generateTitle')}</h2>
      <div class="flex items-end gap-3">
        <div class="space-y-1.5">
          <Label for="code-count" class="text-sm text-stone-400">{$t('admin.codeCountLabel')}</Label>
          <Input
            id="code-count"
            type="number"
            min={1}
            max={50}
            bind:value={codeCount}
            class="w-32"
          />
        </div>
        <Button onclick={handleGenerate} disabled={generating || codeCount < 1}>
          {#if generating}
            {$t('admin.generating')}
          {:else}
            {$t('admin.generateButton')}
          {/if}
        </Button>
      </div>

      <!-- Newly generated codes -->
      {#if generatedCodes.length > 0}
        <div class="bg-stone-900 border border-stone-800 rounded-lg p-4 space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-stone-300">
              {$t('admin.generatedCount', { values: { count: generatedCodes.length } })}
            </p>
            {#if generatedCodes.length > 1}
              <Button variant="ghost" size="sm" onclick={handleCopyAll}>
                {copyFeedback === '__all__' ? $t('admin.copied') : $t('admin.copyAll')}
              </Button>
            {/if}
          </div>
          <div class="space-y-2">
            {#each generatedCodes as code (code)}
              <div class="flex items-center gap-3 bg-stone-950 rounded-md px-3 py-2">
                <code class="flex-1 text-sm font-mono text-yellow-500">{code}</code>
                <Button variant="ghost" size="sm" onclick={() => handleCopyCode(code)}>
                  {copyFeedback === code ? $t('admin.copied') : $t('admin.copy')}
                </Button>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </section>

    <!-- Code list section -->
    <section class="space-y-4">
      <h2 class="text-lg font-semibold text-stone-100">{$t('admin.allCodesTitle')}</h2>

      {#if error}
        <div class="bg-red-950 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      {/if}

      {#if loading}
        <div class="flex items-center gap-3 text-stone-400">
          <div class="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
          <span>{$t('admin.loadingCodes')}</span>
        </div>
      {:else if codes.length === 0}
        <p class="text-stone-500 text-sm">{$t('admin.emptyCodes')}</p>
      {:else}
        <div class="border border-stone-800 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-stone-900 text-stone-400 text-left">
                <th class="px-4 py-3 font-medium">{$t('admin.tableCode')}</th>
                <th class="px-4 py-3 font-medium">{$t('admin.tableStatus')}</th>
                <th class="px-4 py-3 font-medium">{$t('admin.tableUsedBy')}</th>
                <th class="px-4 py-3 font-medium">{$t('admin.tableDateUsed')}</th>
                <th class="px-4 py-3 font-medium">{$t('admin.tableCreated')}</th>
              </tr>
            </thead>
            <tbody>
              {#each codes as code (code.id)}
                <tr class="border-t border-stone-800 hover:bg-stone-900/50 transition-colors">
                  <td class="px-4 py-3">
                    <code class="font-mono text-stone-200">{code.code}</code>
                  </td>
                  <td class="px-4 py-3">
                    {#if code.isUsed}
                      <span class="inline-flex items-center gap-1.5 text-stone-500">
                        <span class="w-2 h-2 rounded-full bg-stone-600"></span>
                        {$t('admin.statusUsed')}
                      </span>
                    {:else}
                      <span class="inline-flex items-center gap-1.5 text-green-400">
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                        {$t('admin.statusAvailable')}
                      </span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-stone-400">
                    {code.usedByEmail ?? '—'}
                  </td>
                  <td class="px-4 py-3 text-stone-400">
                    {formatDate(code.usedAt)}
                  </td>
                  <td class="px-4 py-3 text-stone-400">
                    {formatDate(code.createdAt)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  </div>
</AppShell>
