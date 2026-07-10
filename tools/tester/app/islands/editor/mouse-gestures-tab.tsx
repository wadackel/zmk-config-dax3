import { useState } from 'hono/jsx'
import { useEditor } from '../../lib/editor-state/context'
import type {
  MouseGestureBlock,
  MouseGesturePattern,
  MouseGesturePatternEntry,
} from '../../lib/keymap-dt/types'
import { DirectionPad, getDirectionMeta } from './mouse-gestures/direction-pad'
import { GestureBlockList } from './mouse-gestures/gesture-block-list'
import { GestureInspector } from './inspector/gesture-inspector'

const upsertEntry = (
  entries: MouseGesturePatternEntry[],
  pattern: MouseGesturePattern,
  entry: MouseGesturePatternEntry,
): MouseGesturePatternEntry[] => {
  const idx = entries.findIndex((e) => e.pattern === pattern)
  if (idx === -1) return [...entries, entry]
  return entries.map((e, i) => (i === idx ? entry : e))
}

/**
 * Mouse Gestures tab. Three-column shell:
 *   - Left: GestureBlockList (root override + named input-processor blocks)
 *   - Center: DirectionPad (4-direction cards + decorative trackball)
 *   - Right: GestureInspector (per-block DT properties + per-direction binding)
 */
export function MouseGesturesTab() {
  const { state, dispatch } = useEditor()
  const blocks = state.draft.mouseGestures
  const [activeBlockIdx, setActiveBlockIdx] = useState(0)
  const [selected, setSelected] = useState<MouseGesturePattern | null>(null)

  const block = blocks[activeBlockIdx]

  if (blocks.length === 0 || !block) {
    return (
      <div class="flex-1 min-h-0 flex items-center justify-center text-fg-subtle text-sm">
        No mouse gesture blocks defined.
      </div>
    )
  }

  const onCreateDirection = (pattern: MouseGesturePattern) => {
    dispatch({
      type: 'UPDATE_MOUSE_GESTURE',
      index: activeBlockIdx,
      block: {
        ...block,
        entries: upsertEntry(block.entries, pattern, {
          name: getDirectionMeta(pattern).defaultName,
          pattern,
          bindings: { tokens: ['&none'] },
        }),
      },
    })
    setSelected(pattern)
  }

  const commitBlock = (next: MouseGestureBlock) => {
    dispatch({ type: 'UPDATE_MOUSE_GESTURE', index: activeBlockIdx, block: next })
  }

  return (
    <div class="flex-1 min-h-0 min-w-0 flex bg-surface-0">
      <GestureBlockList
        blocks={blocks}
        activeIdx={activeBlockIdx}
        onSelect={(i) => {
          setActiveBlockIdx(i)
          setSelected(null)
        }}
      />

      <div class="flex-1 bg-surface-3 flex flex-col min-w-0 overflow-auto">
        <div class="flex items-center justify-between px-8 pt-4 gap-4">
          <div class="flex items-baseline gap-3">
            <span class="text-[14px] font-mono font-semibold text-fg">
              {block.kind === 'root' ? '&zip_mouse_gesture' : (block.name ?? '(unnamed)')}
            </span>
            <span class="text-[11px] text-fg-subtle">
              {block.kind === 'root' ? 'root block' : 'named block'}
            </span>
          </div>
          <span class="text-[11px] text-fg-subtle">
            Select a direction card to assign a binding
          </span>
        </div>

        <div class="flex-1 flex items-center justify-center px-8 py-6 min-w-0">
          <DirectionPad
            block={block}
            selected={selected}
            onSelect={setSelected}
            onCreate={onCreateDirection}
          />
        </div>
      </div>

      <GestureInspector
        block={block}
        selected={selected}
        onChange={commitBlock}
        onDeselect={() => setSelected(null)}
      />
    </div>
  )
}
