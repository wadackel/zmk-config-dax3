import { useState } from 'hono/jsx'
import { Slider } from '../../../components/ui/slider'
import { Toggle } from '../../../components/ui/toggle'
import { CommittingTextInput } from '../../../components/ui/field'
import { InspectorShell } from '../../../components/editor/inspector-shell'
import { BindingInspector } from './binding-inspector'
import { getDirectionMeta } from '../mouse-gestures/direction-pad'
import type {
  BindingChain,
  MouseGestureBlock,
  MouseGesturePattern,
  MouseGesturePatternEntry,
} from '../../../lib/keymap-dt/types'

const NUMBER_PROPS = [
  {
    key: 'stroke-size',
    label: 'stroke-size',
    unit: 'px',
    min: 1,
    max: 400,
    hint: 'Movement counted as one stroke (smaller = more sensitive)',
  },
  {
    key: 'idle-timeout-ms',
    label: 'idle-timeout-ms',
    unit: 'ms',
    min: 0,
    max: 1000,
    hint: 'Time before a stroke commits after going idle',
  },
  {
    key: 'gesture-cooldown-ms',
    label: 'gesture-cooldown-ms',
    unit: 'ms',
    min: 0,
    max: 500,
    hint: 'Debounce between gestures',
  },
  {
    key: 'quick-tap-ms',
    label: 'quick-tap-ms',
    unit: 'ms',
    min: 0,
    max: 1000,
    hint: 'Threshold to fire immediately on quick tap',
  },
] as const

const BOOLEAN_PROPS = [
  { key: 'enable-eager-mode', label: 'eager-mode', hint: 'Fire as soon as the threshold is reached' },
  {
    key: 'suppress-movement',
    label: 'suppress-movement',
    hint: 'Suppress raw pointer movement during a stroke',
  },
  {
    key: 'always-active',
    label: 'always-active',
    hint: 'Ignore layer gating on the input-processor',
  },
] as const

const parseIntValue = (raw: string | undefined): number | null => {
  if (!raw) return null
  const m = raw.match(/^<\s*(-?\d+)\s*>$/)
  if (m) return Number(m[1])
  const n = Number(raw.replace(/^<|>$/g, ''))
  return Number.isFinite(n) ? n : null
}

const findProp = (block: MouseGestureBlock, name: string) =>
  block.props.find((p) => p.name === name)

const setPropValue = (
  block: MouseGestureBlock,
  name: string,
  value: string | null,
): MouseGestureBlock => {
  const idx = block.props.findIndex((p) => p.name === name)
  if (value === null) {
    if (idx === -1) return block
    return { ...block, props: block.props.filter((_, i) => i !== idx) }
  }
  if (idx === -1) return { ...block, props: [...block.props, { name, value }] }
  return {
    ...block,
    props: block.props.map((p, i) => (i === idx ? { ...p, value } : p)),
  }
}

const upsertEntry = (
  entries: MouseGesturePatternEntry[],
  pattern: MouseGesturePattern,
  entry: MouseGesturePatternEntry,
): MouseGesturePatternEntry[] => {
  const idx = entries.findIndex((e) => e.pattern === pattern)
  if (idx === -1) return [...entries, entry]
  return entries.map((e, i) => (i === idx ? entry : e))
}

export type GestureInspectorProps = {
  block: MouseGestureBlock
  selected: MouseGesturePattern | null
  onChange: (next: MouseGestureBlock) => void
  onDeselect: () => void
}

/**
 * Right panel for the Mouse Gestures tab. Two modes:
 *   1. **Property mode** (default) — surfaces gesture-wide DT properties
 *      (stroke-size slider, idle/cooldown/quick-tap number fields, three
 *      boolean toggles) for the entire block.
 *   2. **Binding-edit mode** — when the user clicks Change binding… the
 *      panel swaps for a BindingInspector; committing writes the new
 *      binding into the selected pattern's entry.
 */
export function GestureInspector({
  block,
  selected,
  onChange,
  onDeselect,
}: GestureInspectorProps) {
  const [editingBinding, setEditingBinding] = useState(false)

  const selectedEntry = selected
    ? block.entries.find((e) => e.pattern === selected)
    : null

  const commitBinding = (chain: BindingChain) => {
    if (!selected) return
    const existing = block.entries.find((e) => e.pattern === selected)
    const nextEntry: MouseGesturePatternEntry = {
      name: existing?.name ?? getDirectionMeta(selected).defaultName,
      pattern: selected,
      bindings: chain,
    }
    onChange({
      ...block,
      entries: upsertEntry(block.entries, selected, nextEntry),
    })
    setEditingBinding(false)
  }

  if (editingBinding && selected && selectedEntry) {
    return (
      <BindingInspector
        targetLabel={`${selected} stroke`}
        targetSubtitle={selectedEntry.name}
        initial={selectedEntry.bindings}
        onCancel={() => setEditingBinding(false)}
        onCommit={commitBinding}
      />
    )
  }

  return (
    <InspectorShell
      title="Properties"
      ariaLabel="Gesture properties"
      headerRight={
        <span class="text-[10.5px] font-mono text-fg-subtle">
          {block.kind === 'root' ? 'root block' : block.name}
        </span>
      }
    >
      <>
        {/* SELECTED DIRECTION */}
        {selected && selectedEntry ? (
          <div class="flex flex-col gap-2">
            <span class="text-[10.5px] font-mono font-semibold tracking-wider text-fg-subtle">
              SELECTED DIRECTION
            </span>
            <div class="flex items-center gap-3 p-3 rounded-xl bg-accent-soft border border-accent">
              <span class="w-9 h-9 shrink-0 rounded-lg bg-surface-0 border border-accent flex items-center justify-center text-[16px] font-mono text-accent">
                {getDirectionMeta(selected).symbol}
              </span>
              <div class="flex flex-col gap-0.5 min-w-0">
                <span class="text-[12.5px] font-semibold">{selected} stroke</span>
                <span class="text-[10.5px] font-mono text-fg-muted truncate">
                  {selectedEntry.bindings.tokens.join(' ')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditingBinding(true)}
              class="flex items-center justify-between px-3 py-2.5 border border-border rounded-lg bg-surface-0 text-[13px] font-mono text-fg hover:bg-surface-2 transition-colors"
            >
              <span>Change binding…</span>
              <span class="text-fg-subtle text-[11px]">▾</span>
            </button>
            <div class="flex flex-col gap-1.5">
              <span class="text-[10.5px] text-fg-subtle">Entry name (DT identifier)</span>
              <CommittingTextInput
                value={selectedEntry.name}
                invalid={selectedEntry.name.trim() === ''}
                onCommit={(name) => {
                  onChange({
                    ...block,
                    entries: upsertEntry(block.entries, selected, {
                      ...selectedEntry,
                      name,
                    }),
                  })
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...block,
                  entries: block.entries.filter((e) => e.pattern !== selected),
                })
                onDeselect()
              }}
              class="self-start text-[11px] font-mono text-danger hover:brightness-95"
            >
              Remove direction
            </button>
          </div>
        ) : (
          <div class="text-[12px] text-fg-subtle">
            Select a direction card to edit its binding.
          </div>
        )}

        {/* GESTURE PROPERTIES */}
        <div class="flex flex-col gap-4 pt-4 border-t border-border-subtle">
          <span class="text-[10.5px] font-mono font-semibold tracking-wider text-fg-subtle">
            GESTURE PROPERTIES
          </span>

          {NUMBER_PROPS.map((p) => {
            const currentRaw = findProp(block, p.key)?.value
            const currentNum = parseIntValue(currentRaw)
            return (
              <div key={p.key} class="flex flex-col gap-1.5">
                <Slider
                  value={currentNum ?? p.min}
                  min={p.min}
                  max={p.max}
                  onChange={(next) =>
                    onChange(setPropValue(block, p.key, `<${next}>`))
                  }
                  label={p.label}
                  unit={p.unit}
                  hint={p.hint}
                />
                {currentNum === null && (
                  <button
                    type="button"
                    onClick={() => onChange(setPropValue(block, p.key, `<${p.min}>`))}
                    class="self-start text-[10.5px] text-accent hover:brightness-95"
                  >
                    Set explicitly (currently using DT default)
                  </button>
                )}
              </div>
            )
          })}

          {BOOLEAN_PROPS.map((p) => {
            const on = findProp(block, p.key) !== undefined
            return (
              <div
                key={p.key}
                class="flex items-center justify-between p-3 rounded-xl bg-surface-0 border border-border"
              >
                <div class="flex flex-col gap-0.5">
                  <span class="text-[12.5px] font-semibold text-fg">{p.label}</span>
                  <span class="text-[10.5px] text-fg-subtle">{p.hint}</span>
                </div>
                <Toggle
                  checked={on}
                  onChange={(next) =>
                    onChange(setPropValue(block, p.key, next ? '' : null))
                  }
                  ariaLabel={p.label}
                />
              </div>
            )
          })}
        </div>
      </>
    </InspectorShell>
  )
}
