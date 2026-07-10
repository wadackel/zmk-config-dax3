import type { Child, JSX } from 'hono/jsx'

export type InspectorShellProps = {
  /** Panel title rendered in the header, left-aligned. */
  title: Child
  /**
   * Optional right-hand header slot — used for the `⌘⏎ commit · esc`
   * shortcut hint on BindingInspector, the `rules OK` status pill on
   * SensorTuningInspector, the block-kind subtitle on GestureInspector,
   * and the Delete link on ComboInspector.
   */
  headerRight?: Child
  /**
   * Panel width in pixels. Defaults to 340px — the value shared by
   * combo / macro-step / gesture / sensor-tuning inspectors. Binding
   * inspector overrides to 356px; behavior-add-prop shrinks to 300px.
   */
  width?: number
  /**
   * Optional footer content (buttons, hints). Rendered inside a bordered
   * <footer> with `justify-end`. Omit for panels that don't need explicit
   * commit/cancel affordances (Sensors / Gestures use auto-commit).
   */
  footer?: Child
  ariaLabel?: string
  /**
   * Panel-level keydown handler — used by BindingInspector to intercept
   * `⌘⏎` from anywhere in the panel and commit synchronously.
   */
  onKeyDown?: JSX.IntrinsicElements['aside']['onKeyDown']
  /** Scroll body content. Rendered inside a padded flex-col. */
  children: Child
}

/**
 * Shared right-panel Inspector chrome. Every editor Inspector rendered on
 * the right side of the 3-column tabs — binding / combo / macro-step /
 * gesture / sensor-tuning / behavior-add-prop — funnels through this
 * component so the aside/header/scroll-body/footer contract stays in one
 * place. Individual inspectors compose their own body; only chrome lives
 * here.
 *
 * `role="complementary"` conveys "supplemental panel" semantics to screen
 * readers, matching the visual position (adjacent to the main tabpanel).
 * Width is a fixed-pixel prop instead of a Tailwind class so callers can
 * pass any value — the design uses 300/340/356 depending on tab.
 */
export function InspectorShell({
  title,
  headerRight,
  width = 340,
  footer,
  ariaLabel,
  onKeyDown,
  children,
}: InspectorShellProps) {
  return (
    <aside
      role="complementary"
      aria-label={ariaLabel}
      class="flex-none border-l border-border-subtle bg-surface-1 flex flex-col"
      style={`width:${width}px`}
      onKeyDown={onKeyDown}
    >
      <header class="px-6 py-4 flex items-center justify-between">
        <span class="text-[15px] font-bold">{title}</span>
        {headerRight}
      </header>

      <div class="flex-1 overflow-auto px-6 flex flex-col gap-5 pb-4">
        {children}
      </div>

      {footer && (
        <footer class="flex justify-end gap-2 px-6 py-4 border-t border-border-subtle">
          {footer}
        </footer>
      )}
    </aside>
  )
}
