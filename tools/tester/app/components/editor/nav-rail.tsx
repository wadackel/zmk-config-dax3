import type { JSX } from 'hono/jsx'
import type { EditorTab } from '../../lib/editor-state/types'

export type NavRailItem = { id: EditorTab; label: string }

export type NavRailProps = {
  items: NavRailItem[]
  active: EditorTab
  onSelect: (tab: EditorTab) => void
  /** Path shown at the bottom of the rail (informational, not clickable). */
  configPath?: string
  /** Tester href — the "← Tester" link at the rail foot. */
  testerHref?: string
  /** Rail-level keydown — the shell binds ArrowUp/Down/Home/End directly on
   *  the aside instead of wrapping the rail in an extra flex div. */
  onKeyDown?: JSX.IntrinsicElements['aside']['onKeyDown']
}

/**
 * Left navigation rail used by the redesigned Keymap Editor. Rendered as an
 * ARIA tablist (vertical orientation) so screen readers announce the group
 * and current selection consistently with the previous top-tab shell.
 *
 * Keyboard navigation is owned by the parent shell (ArrowUp/Down/Home/End →
 * SET_ACTIVE_TAB + focus the new tab); this component only renders the
 * static markup + focus targets.
 */
export function NavRail({
  items,
  active,
  onSelect,
  configPath,
  testerHref,
  onKeyDown,
}: NavRailProps) {
  return (
    <aside
      class="w-[216px] flex-none bg-surface-2 border-r border-border-subtle flex flex-col py-5"
      aria-label="Keymap Editor sections"
      onKeyDown={onKeyDown}
    >
      <div class="px-5 pb-5 flex items-center gap-2">
        <span class="text-base font-bold tracking-tight leading-none">Keymap Editor</span>
        <span class="text-[9px] font-mono font-semibold tracking-[.1em] text-fg-subtle border border-border rounded-full px-1.5 py-1 uppercase">
          Dev
        </span>
      </div>

      <div role="tablist" aria-orientation="vertical" class="flex flex-col">
        {items.map((t) => {
          const isActive = t.id === active
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              data-editor-tab={t.id}
              // hono/jsx serializes aria-selected={boolean} to an empty
              // attribute value; screen readers need the string form.
              aria-selected={isActive ? 'true' : 'false'}
              aria-controls={`tabpanel-${t.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(t.id)}
              class={[
                'flex items-center gap-3 px-5 py-2.5 text-left border-l-[3px] transition-colors',
                isActive
                  ? 'bg-ink-soft border-ink text-ink font-semibold'
                  : 'border-transparent text-fg-muted hover:text-fg hover:bg-surface-3',
              ].join(' ')}
            >
              <span
                class={[
                  'inline-block w-[7px] h-[7px] rounded-[2px]',
                  isActive
                    ? 'bg-ink'
                    : 'border-[1.5px] border-[color:var(--color-border-strong)]',
                ].join(' ')}
                aria-hidden="true"
              />
              <span class="text-[13.5px] leading-none">{t.label}</span>
            </button>
          )
        })}
      </div>

      <div class="mt-auto px-5 pt-4 border-t border-border-subtle flex flex-col gap-2.5">
        {testerHref && (
          <a
            href={testerHref}
            class="text-[12.5px] text-fg-muted hover:text-fg transition-colors"
          >
            ← Tester
          </a>
        )}
        {configPath && (
          <span class="text-[11px] font-mono text-fg-subtle leading-tight">
            {configPath}
          </span>
        )}
      </div>
    </aside>
  )
}
