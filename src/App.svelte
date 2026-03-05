<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { databaseStore, type DatabaseStatus } from '$lib/stores/database-store';
  import { sessionStore, isAuthenticated, isSessionLoading } from '$lib/stores/session-store';
  import { router, currentRoute, noteId } from '$lib/stores/router-store';
  import LoginView from '$lib/components/LoginView.svelte';
  import SignUpView from '$lib/components/SignUpView.svelte';
  import { AdminView, MainView, NoteView } from '$lib/components/views';
  import { currentUser } from '$lib/stores/session-store';

  let dbStatus: DatabaseStatus = $state('idle');
  let dbError: string | null = $state(null);
  let authenticated = $state(false);
  let sessionLoading = $state(true);
  let route = $state('login');

  // Subscribe to stores
  databaseStore.subscribe((state) => {
    dbStatus = state.status;
    dbError = state.error;
  });

  isAuthenticated.subscribe((value) => {
    authenticated = value;
  });

  isSessionLoading.subscribe((value) => {
    sessionLoading = value;
  });

  currentRoute.subscribe((value) => {
    route = value;
  });

  let user = $state<{ id: number; username: string; displayName: string | null; isAdmin: boolean } | null>(null);
  currentUser.subscribe((value) => {
    user = value;
  });

  let currentNoteId = $state<number | null>(null);
  noteId.subscribe((value) => {
    currentNoteId = value;
  });

  // Redirect logic based on authentication and role
  $effect(() => {
    if (dbStatus === 'ready' && !sessionLoading) {
      if (authenticated && user) {
        if (route === 'login' || route === 'signup') {
          // Redirect to role-appropriate page after login
          router.navigate(user.isAdmin ? '/admin' : '/main');
        } else if (user.isAdmin && route === 'main') {
          // Admins should not access main view
          router.navigate('/admin');
        } else if (!user.isAdmin && route === 'admin') {
          // Non-admins should not access admin view
          router.navigate('/main');
        }
      } else {
        // If not authenticated and on protected route, redirect to login
        if (route !== 'login' && route !== 'signup' && route !== 'shared') {
          router.navigate('/login');
        }
      }
    }
  });

  onMount(async () => {
    await databaseStore.initialize();
    sessionStore.initialize();
  });
</script>

<!-- Loading State -->
{#if dbStatus === 'idle' || dbStatus === 'loading' || sessionLoading}
  <div class="min-h-screen flex flex-col items-center justify-center p-8">
    <div class="text-center space-y-4">
      <h1 class="text-4xl font-semibold text-stone-50">{$t('app.name')}</h1>
      <div class="flex items-center justify-center gap-3">
        <div class="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
        <span class="text-stone-400">{$t('app.loading')}</span>
      </div>
    </div>
  </div>

<!-- Error State -->
{:else if dbStatus === 'error'}
  <div class="min-h-screen flex flex-col items-center justify-center p-8">
    <div class="text-center space-y-4 max-w-md">
      <h1 class="text-4xl font-semibold text-stone-50">{$t('app.name')}</h1>
      <div class="bg-red-950 border border-red-800 rounded-lg p-4 text-red-300">
        <p class="font-medium">{$t('app.dbInitFailed')}</p>
        {#if dbError}
          <p class="text-sm mt-2">{dbError}</p>
        {/if}
      </div>
      <button
        onclick={() => window.location.reload()}
        class="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 transition-colors"
      >
        {$t('app.retry')}
      </button>
    </div>
  </div>

<!-- App Ready -->
{:else}
  <!-- Login View -->
  {#if route === 'login'}
    <LoginView />

  <!-- Sign Up View -->
  {:else if route === 'signup'}
    <SignUpView />

  <!-- Admin View -->
  {:else if route === 'admin'}
    <AdminView />

  <!-- Main View -->
  {:else if route === 'main'}
    <MainView />

  <!-- Note View (create/edit) -->
  {:else if route === 'note'}
    <NoteView noteId={currentNoteId} />

  <!-- Other routes (placeholder) -->
  {:else}
    <div class="min-h-screen flex flex-col items-center justify-center p-8">
      <div class="text-center space-y-4">
        <h1 class="text-4xl font-semibold text-stone-50">{$t('app.name')}</h1>
        <p class="text-stone-400">{$t('app.pageNotFound')}</p>
        <button
          onclick={() => router.navigate('/main')}
          class="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 transition-colors"
        >
          {$t('app.goToMain')}
        </button>
      </div>
    </div>
  {/if}
{/if}
