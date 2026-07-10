import type { MouseGestureBlock } from '../../../lib/keymap-dt/types'

export type GestureBlockListProps = {
  blocks: MouseGestureBlock[]
  activeIdx: number
  onSelect: (idx: number) => void
}

/**
 * Left column of the Mouse Gestures tab. Lists the root
 * `&zip_mouse_gesture` override + any named input-processor blocks. Adding
 * new blocks is intentionally omitted here — creating a block requires
 * choosing a compatible / #input-processor-cells shape that our parser
 * doesn't yet expose as UI. Named blocks come from the parsed keymap only.
 */
export function GestureBlockList({ blocks, activeIdx, onSelect }: GestureBlockListProps) {
  return (
    <aside
      aria-label="Gesture blocks"
      class="w-[210px] flex-none border-r border-border-subtle p-4 flex flex-col gap-1 overflow-auto"
    >
      <span class="text-[10.5px] font-mono font-semibold tracking-wider text-fg-subtle px-1.5 pb-2">
        GESTURE BLOCKS
      </span>
      {blocks.map((block, i) => {
        const isActive = i === activeIdx
        const label = block.kind === 'root' ? '&zip_mouse_gesture' : (block.name ?? '(unnamed)')
        const subtitle = block.kind === 'root' ? 'root · default' : 'named block'
        return (
          <button
            key={`${label}-${i}`}
            type="button"
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelect(i)}
            class={[
              'flex flex-col gap-1 px-2.5 py-2.5 rounded-lg cursor-pointer transition-colors text-left',
              isActive ? 'bg-ink text-ink-fg' : 'hover:bg-surface-3',
            ].join(' ')}
          >
            <span
              class={[
                'text-[12.5px] font-mono font-semibold truncate',
                isActive ? '' : 'text-fg-muted',
              ].join(' ')}
            >
              {label}
            </span>
            <span
              class={[
                'text-[10px]',
                isActive ? 'text-[color:var(--color-ink-fg)]/60' : 'text-fg-subtle',
              ].join(' ')}
            >
              {subtitle}
            </span>
          </button>
        )
      })}
    </aside>
  )
}
