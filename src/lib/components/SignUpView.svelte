<script lang="ts">
  import { t } from 'svelte-i18n';
  import { register } from '$lib/services/auth-service';
  import { router } from '$lib/stores/router-store';
  import { getAppInfo } from '$lib/services/app-service';

  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';

  let email = $state('');
  let password = $state('');
  let invitationCode = $state('');
  let error = $state<string | null>(null);
  let successMessage = $state<string | null>(null);
  let isLoading = $state(false);

  const isDev = import.meta.env.MODE === 'development';
  const demoInvitationCode = isDev ? getAppInfo().invitationCode : null;

  function fillDemoInvitationCode() {
    if (demoInvitationCode) {
      invitationCode = demoInvitationCode;
    }
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!email.trim() || !password.trim() || !invitationCode.trim()) {
      error = $t('auth.signupErrorAllFields');
      return;
    }

    isLoading = true;
    error = null;
    successMessage = null;

    try {
      const result = await register(email, password, invitationCode);

      if (result.success) {
        successMessage = $t('auth.signupSuccess');
        // Redirect to login after short delay
        setTimeout(() => {
          router.navigate('/login');
        }, 1500);
      } else {
        error = result.error ?? $t('auth.signupErrorDefault');
      }
    } catch {
      error = $t('auth.signupErrorGeneric');
    } finally {
      isLoading = false;
    }
  }

  function navigateToLogin() {
    router.navigate('/login');
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-center p-8">
  <!-- App Title -->
  <h1 class="text-6xl font-semibold text-foreground mb-12 tracking-tight">{$t('auth.signupTitle')}</h1>

  <!-- Sign Up Form Card -->
  <div class="w-full max-w-md space-y-6">
    <!-- Welcome Text -->
    <div class="text-center space-y-1">
      <h2 class="text-2xl font-semibold text-foreground">{$t('auth.signupWelcome')}</h2>
      <p class="text-muted-foreground">{$t('auth.signupSubtitle')}</p>
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

      <!-- Invitation Code Field -->
      <div class="space-y-2">
        <Label for="invitationCode">{$t('auth.invitationCodeLabel')}</Label>
        <Input
          id="invitationCode"
          type="text"
          bind:value={invitationCode}
          placeholder={$t('auth.invitationCodePlaceholder')}
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

      <!-- Success Message -->
      {#if successMessage}
        <div class="bg-green-950 border border-green-800 rounded-lg px-4 py-3 text-green-300 text-sm">
          {successMessage}
        </div>
      {/if}

      <!-- Sign Up Button -->
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
          {$t('auth.signingUp')}
        {:else}
          {$t('auth.signup')}
        {/if}
      </Button>
    </form>

    <!-- Login Link -->
    <div class="flex items-center gap-4">
      <Separator class="flex-1" />
      <Button variant="link" onclick={navigateToLogin} class="text-muted-foreground hover:text-foreground">
        {$t('auth.orLogin')}
      </Button>
      <Separator class="flex-1" />
    </div>

    <!-- Demo Invitation Code Hint (dev only) -->
    {#if isDev && demoInvitationCode}
      <div class="mt-8 p-4 bg-card/50 border border-border rounded-lg">
        <p class="text-muted-foreground text-xs uppercase tracking-wide mb-2">{$t('auth.demoInvitationCode')}</p>
        <Button variant="ghost" onclick={fillDemoInvitationCode} class="text-muted-foreground hover:text-foreground p-0 h-auto">
          <code class="text-green-400">{demoInvitationCode}</code>
        </Button>
      </div>
    {/if}
  </div>
</div>
