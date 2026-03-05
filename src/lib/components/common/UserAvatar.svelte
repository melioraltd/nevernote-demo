<script lang="ts">
  interface Props {
    initial: string;
    size?: 'sm' | 'md' | 'lg';
  }

  let { initial, size = 'md' }: Props = $props();

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };
</script>

<div
  class="rounded-full bg-stone-700 flex items-center justify-center font-medium text-stone-300 flex-shrink-0 {sizeClasses[size]}"
>
  {initial.toUpperCase()}
</div>
