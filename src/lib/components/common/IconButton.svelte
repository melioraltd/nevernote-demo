<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'ghost' | 'filled';
    size?: 'sm' | 'md';
    disabled?: boolean;
    title?: string;
    onclick?: () => void;
    children: Snippet;
  }

  let {
    variant = 'ghost',
    size = 'md',
    disabled = false,
    title,
    onclick,
    children
  }: Props = $props();

  const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2'
  };

  const variantClasses = {
    ghost: 'text-stone-400 hover:text-stone-300 hover:bg-stone-800',
    filled: 'bg-stone-800 text-stone-300 hover:bg-stone-700'
  };
</script>

<button
  type="button"
  class="{baseClasses} {sizeClasses[size]} {variantClasses[variant]}"
  {disabled}
  {title}
  {onclick}
>
  {@render children()}
</button>
