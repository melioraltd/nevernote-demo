<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import { Editor } from '@tiptap/core';
  import { StarterKit } from '@tiptap/starter-kit';
  import { Underline } from '@tiptap/extension-underline';
  import { Button } from '$lib/components/ui/button';

  import BoldIcon from '@lucide/svelte/icons/bold';
  import ItalicIcon from '@lucide/svelte/icons/italic';
  import UnderlineIcon from '@lucide/svelte/icons/underline';
  import StrikethroughIcon from '@lucide/svelte/icons/strikethrough';
  import Heading1Icon from '@lucide/svelte/icons/heading-1';
  import Heading2Icon from '@lucide/svelte/icons/heading-2';
  import ListIcon from '@lucide/svelte/icons/list';
  import ListOrderedIcon from '@lucide/svelte/icons/list-ordered';
  import UndoIcon from '@lucide/svelte/icons/undo-2';
  import RedoIcon from '@lucide/svelte/icons/redo-2';

  interface Props {
    content?: string;
    placeholder?: string;
    autofocus?: boolean;
    onUpdate?: (html: string) => void;
  }

  let { content = '', placeholder = '', autofocus = false, onUpdate }: Props = $props();

  let element = $state<HTMLDivElement>();
  let editorState = $state<{ editor: Editor | null }>({ editor: null });

  onMount(() => {
    editorState.editor = new Editor({
      element: element,
      extensions: [
        StarterKit,
        Underline,
      ],
      content,
      editorProps: {
        attributes: {
          class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] p-3',
          'data-placeholder': placeholder,
        },
      },
      onTransaction: ({ editor }) => {
        editorState = { editor };
      },
      onUpdate: ({ editor }) => {
        onUpdate?.(editor.getHTML());
      },
      autofocus: autofocus ? 'end' : false,
    });
  });

  onDestroy(() => {
    editorState.editor?.destroy();
  });

  function isActive(name: string, attrs?: Record<string, unknown>): boolean {
    return editorState.editor?.isActive(name, attrs) ?? false;
  }

  let toolbarFocusIndex = $state(0);

  function handleToolbarKeydown(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();

    const toolbar = e.currentTarget as HTMLElement;
    const buttons = toolbar.querySelectorAll<HTMLElement>('button');
    if (buttons.length === 0) return;

    if (e.key === 'ArrowRight') {
      toolbarFocusIndex = toolbarFocusIndex < buttons.length - 1 ? toolbarFocusIndex + 1 : 0;
    } else {
      toolbarFocusIndex = toolbarFocusIndex > 0 ? toolbarFocusIndex - 1 : buttons.length - 1;
    }
    buttons[toolbarFocusIndex].focus();
  }

  function handleToolbarFocus(e: FocusEvent) {
    const toolbar = e.currentTarget as HTMLElement;
    const buttons = toolbar.querySelectorAll<HTMLElement>('button');
    if (buttons.length === 0) return;

    // If focus entered toolbar (not moving within), focus the active index
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !toolbar.contains(relatedTarget)) {
      if (toolbarFocusIndex >= buttons.length) toolbarFocusIndex = 0;
      buttons[toolbarFocusIndex].focus();
    }
  }
</script>

<div class="border border-border rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
  <!-- Toolbar -->
  {#if editorState.editor}
    <!-- svelte-ignore a11y_interactive_supports_focus -- focus managed via roving tabindex on child buttons -->
    <div class="flex items-center gap-1 p-2 border-b border-border bg-muted/30 flex-wrap" role="toolbar" aria-label={$t('editor.toolbarLabel')} onkeydown={handleToolbarKeydown} onfocusin={handleToolbarFocus}>
      <Button
        variant={isActive('bold') ? 'secondary' : 'ghost'}
        size="icon-sm"
        tabindex={toolbarFocusIndex === 0 ? 0 : -1}
        onclick={() => editorState.editor?.chain().focus().toggleBold().run()}
        title={$t('editor.bold')}
      >
        <BoldIcon class="size-4" />
      </Button>

      <Button
        variant={isActive('italic') ? 'secondary' : 'ghost'}
        size="icon-sm"
        tabindex={toolbarFocusIndex === 1 ? 0 : -1}
        onclick={() => editorState.editor?.chain().focus().toggleItalic().run()}
        title={$t('editor.italic')}
      >
        <ItalicIcon class="size-4" />
      </Button>

      <Button
        variant={isActive('underline') ? 'secondary' : 'ghost'}
        size="icon-sm"
        tabindex={toolbarFocusIndex === 2 ? 0 : -1}
        onclick={() => editorState.editor?.chain().focus().toggleUnderline().run()}
        title={$t('editor.underline')}
      >
        <UnderlineIcon class="size-4" />
      </Button>

      <Button
        variant={isActive('strike') ? 'secondary' : 'ghost'}
        size="icon-sm"
        tabindex={toolbarFocusIndex === 3 ? 0 : -1}
        onclick={() => editorState.editor?.chain().focus().toggleStrike().run()}
        title={$t('editor.strikethrough')}
      >
        <StrikethroughIcon class="size-4" />
      </Button>

      <div class="w-px h-5 bg-border mx-1"></div>

      <Button
        variant={isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
        size="icon-sm"
        tabindex={toolbarFocusIndex === 4 ? 0 : -1}
        onclick={() => editorState.editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        title={$t('editor.heading1')}
      >
        <Heading1Icon class="size-4" />
      </Button>

      <Button
        variant={isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
        size="icon-sm"
        tabindex={toolbarFocusIndex === 5 ? 0 : -1}
        onclick={() => editorState.editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        title={$t('editor.heading2')}
      >
        <Heading2Icon class="size-4" />
      </Button>

      <div class="w-px h-5 bg-border mx-1"></div>

      <Button
        variant={isActive('bulletList') ? 'secondary' : 'ghost'}
        size="icon-sm"
        tabindex={toolbarFocusIndex === 6 ? 0 : -1}
        onclick={() => editorState.editor?.chain().focus().toggleBulletList().run()}
        title={$t('editor.bulletList')}
      >
        <ListIcon class="size-4" />
      </Button>

      <Button
        variant={isActive('orderedList') ? 'secondary' : 'ghost'}
        size="icon-sm"
        tabindex={toolbarFocusIndex === 7 ? 0 : -1}
        onclick={() => editorState.editor?.chain().focus().toggleOrderedList().run()}
        title={$t('editor.orderedList')}
      >
        <ListOrderedIcon class="size-4" />
      </Button>

      <div class="w-px h-5 bg-border mx-1"></div>

      <Button
        variant="ghost"
        size="icon-sm"
        tabindex={toolbarFocusIndex === 8 ? 0 : -1}
        onclick={() => editorState.editor?.chain().focus().undo().run()}
        disabled={!editorState.editor?.can().undo()}
        title={$t('editor.undo')}
      >
        <UndoIcon class="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        tabindex={toolbarFocusIndex === 9 ? 0 : -1}
        onclick={() => editorState.editor?.chain().focus().redo().run()}
        disabled={!editorState.editor?.can().redo()}
        title={$t('editor.redo')}
      >
        <RedoIcon class="size-4" />
      </Button>
    </div>
  {/if}

  <!-- Editor mount point - always in the DOM so Tiptap can attach -->
  <div bind:this={element} class="flex-1 overflow-auto"></div>
</div>

<style>
  :global(.ProseMirror) {
    min-height: 200px;
    height: 100%;
  }

  :global(.ProseMirror p.is-editor-empty:first-child::before) {
    color: var(--color-muted-foreground);
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  :global(.ProseMirror h1) {
    font-size: 1.875rem;
    font-weight: 700;
    line-height: 2.25rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  :global(.ProseMirror h2) {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 2rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  :global(.ProseMirror h3) {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.75rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  :global(.ProseMirror ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
  }

  :global(.ProseMirror ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
  }

  :global(.ProseMirror li) {
    margin-top: 0.125rem;
    margin-bottom: 0.125rem;
  }

  :global(.ProseMirror blockquote) {
    border-left: 3px solid var(--color-border);
    padding-left: 1rem;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
    color: var(--color-muted-foreground);
  }

  :global(.ProseMirror code) {
    background-color: var(--color-muted);
    border-radius: 0.25rem;
    padding: 0.125rem 0.25rem;
    font-size: 0.875rem;
  }

  :global(.ProseMirror pre) {
    background-color: var(--color-muted);
    border-radius: 0.375rem;
    padding: 0.75rem;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
    overflow-x: auto;
  }

  :global(.ProseMirror pre code) {
    background: none;
    padding: 0;
  }
</style>
