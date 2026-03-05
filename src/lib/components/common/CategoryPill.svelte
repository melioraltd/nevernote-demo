<script lang="ts">
  interface Props {
    name: string;
    color?: string;
  }

  let { name, color = '#6b7280' }: Props = $props();
</script>

<span
  class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border border-stone-700 bg-stone-900"
  style="border-color: {color}40;"
>
  <span
    class="w-2 h-2 rounded-full mr-1.5"
    style="background-color: {color};"
  ></span>
  {name}
</span>
