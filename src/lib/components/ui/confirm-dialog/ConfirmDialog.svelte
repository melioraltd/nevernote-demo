<script lang="ts">
  import { t } from 'svelte-i18n';
  import { AlertDialog } from 'bits-ui';
  import { cn } from '$lib/utils';
  import { Button } from '$lib/components/ui/button';

  interface Props {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
  }

  let {
    open = $bindable(false),
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant = 'default',
    onConfirm,
    onCancel
  }: Props = $props();

  const resolvedConfirmLabel = $derived(confirmLabel ?? $t('common.confirm'));
  const resolvedCancelLabel = $derived(cancelLabel ?? $t('common.cancel'));
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Portal>
    <AlertDialog.Overlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <AlertDialog.Content
      class={cn(
        'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
        'rounded-lg border bg-background p-6 shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]'
      )}
    >
      <AlertDialog.Title class="text-lg font-semibold">{title}</AlertDialog.Title>
      <AlertDialog.Description class="mt-2 text-sm text-muted-foreground">
        {description}
      </AlertDialog.Description>
      <div class="mt-6 flex justify-end gap-3">
        <AlertDialog.Cancel>
          {#snippet child({ props })}
            <Button {...props} variant="outline" onclick={onCancel}>
              {resolvedCancelLabel}
            </Button>
          {/snippet}
        </AlertDialog.Cancel>
        <AlertDialog.Action>
          {#snippet child({ props })}
            <Button
              {...props}
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onclick={onConfirm}
            >
              {resolvedConfirmLabel}
            </Button>
          {/snippet}
        </AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
