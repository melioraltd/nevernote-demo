<script lang="ts">
  interface Props {
    icon: string;
    label: string;
    active?: boolean;
    collapsed?: boolean;
    variant?: 'default' | 'highlighted';
    onclick?: () => void;
  }

  let {
    icon,
    label,
    active = false,
    collapsed = false,
    variant = 'default',
    onclick
  }: Props = $props();

  const baseClasses = 'flex items-center gap-4 px-4 py-2.5 rounded-lg cursor-pointer transition-colors';

  const variantClasses = $derived(() => {
    if (variant === 'highlighted') {
      return active
        ? 'bg-blue-900/50 text-blue-300'
        : 'bg-blue-950/30 text-blue-400 hover:bg-blue-900/40';
    }
    return active
      ? 'bg-stone-800 text-stone-100'
      : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-300';
  });
</script>

<button
  type="button"
  class="{baseClasses} {variantClasses()}"
  class:justify-center={collapsed}
  {onclick}
  title={collapsed ? label : undefined}
>
  <span class="text-xl flex-shrink-0">{icon}</span>
  {#if !collapsed}
    <span class="text-sm font-medium truncate">{label}</span>
  {/if}
</button>
