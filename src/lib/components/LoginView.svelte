<script lang="ts">
  import { t } from 'svelte-i18n';
  import { login } from '$lib/services/auth-service';
  import { router } from '$lib/stores/router-store';
  import { DEMO_CREDENTIALS } from '$lib/services/app-service';

  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';

  let email = $state('');
  let password = $state('');
  let error = $state<string | null>(null);
  let isLoading = $state(false);

  function fillDemoCredentials(credentials: { email: string; password: string }) {
    email = credentials.email;
    password = credentials.password;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      error = $t('auth.loginErrorBothFields');
      return;
    }

    isLoading = true;
    error = null;

    try {
      const result = await login(email, password);

      if (result.success) {
        // Redirect to main view
        router.navigate('/main');
      } else {
        error = result.error ?? $t('auth.loginErrorInvalid');
      }
    } catch {
      error = $t('auth.loginErrorGeneric');
    } finally {
      isLoading = false;
    }
  }

  function navigateToSignup() {
    router.navigate('/signup');
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-center p-8">
  <!-- App Title -->
  <h1 class="text-6xl font-semibold text-foreground mb-12 tracking-tight">{$t('app.name')}</h1>

  <!-- Login Form Card -->
  <div class="w-full max-w-md space-y-6">
    <!-- Welcome Text -->
    <div class="text-center space-y-1">
      <h2 class="text-2xl font-semibold text-foreground">{$t('auth.welcomeBack')}</h2>
      <p class="text-muted-foreground">{$t('auth.loginSubtitle')}</p>
    </div>

    <!-- Form -->
    <form onsubmit={handleSubmit} class="space-y-4">
      <!-- Email Field -->
      <div class="space-y-2">
        <Label for="email">{$t('auth.emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          bind:value={email}
          placeholder={$t('auth.emailPlaceholder')}
          disabled={isLoading}
          class="h-12"
        />
      </div>

      <!-- Password Field -->
      <div class="space-y-2">
        <Label for="password">{$t('auth.passwordLabel')}</Label>
        <Input
          id="password"
          type="password"
          bind:value={password}
          placeholder={$t('auth.passwordPlaceholder')}
          disabled={isLoading}
          class="h-12"
        />
      </div>

      <!-- Error Message -->
      {#if error}
        <div class="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-destructive text-sm">
          {error}
        </div>
      {/if}

      <!-- Login Button -->
      <Button type="submit" disabled={isLoading} class="w-full h-12">
        {#if isLoading}
          <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {$t('auth.loggingIn')}
        {:else}
          {$t('auth.login')}
        {/if}
      </Button>
    </form>

    <!-- Sign Up Link -->
    <div class="flex items-center gap-4">
      <Separator class="flex-1" />
      <Button variant="link" onclick={navigateToSignup} class="text-muted-foreground hover:text-foreground">
        {$t('auth.orSignup')}
      </Button>
      <Separator class="flex-1" />
    </div>

    <!-- Demo Credentials Hint -->
    <div class="mt-8 p-4 bg-card/50 border border-border rounded-lg">
      <p class="text-muted-foreground text-xs uppercase tracking-wide mb-2">{$t('auth.demoCredentials')}</p>
      <Button variant="ghost" onclick={() => fillDemoCredentials(DEMO_CREDENTIALS.user)} class="text-muted-foreground hover:text-foreground p-0 h-auto">
        <code class="text-green-400">{DEMO_CREDENTIALS.user.email}</code>
        <span class="mx-1">/</span>
        <code class="text-green-400">{DEMO_CREDENTIALS.user.password}</code>
      </Button>
      <Button variant="ghost" onclick={() => fillDemoCredentials(DEMO_CREDENTIALS.admin)} class="text-muted-foreground hover:text-foreground p-0 h-auto">
        <code class="text-green-400">{DEMO_CREDENTIALS.admin.email}</code>
        <span class="mx-1">/</span>
        <code class="text-green-400">{DEMO_CREDENTIALS.admin.password}</code>
      </Button>
    </div>
  </div>
</div>
