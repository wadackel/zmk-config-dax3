import { createRoute } from 'honox/factory'
import KeyboardTester from '../islands/keyboard-tester'

export default createRoute((c) => {
  // Body is `h-screen overflow-hidden` (see routes/_renderer.tsx) so the
  // editor pane can never leak a page-level scrollbar. Tester content
  // (encoder row + 46 keys + event log) can exceed the viewport on shorter
  // screens; wrap the route in an internal scroll container to preserve
  // access to the full log.
  return c.render(
    <div class="h-screen overflow-auto">
      {import.meta.env.DEV && (
        <div class="px-4 py-2 text-xs font-mono text-fg-muted border-b border-border-subtle">
          <a class="hover:text-fg" href="/">
            <span aria-hidden="true">←</span> Back to keymap editor
          </a>
        </div>
      )}
      <KeyboardTester />
    </div>,
  )
})
