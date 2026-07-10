import { useState } from 'hono/jsx'
import { Button } from '../../../components/ui/button'
import { CommittingTextInput } from '../../../components/ui/field'
import { InspectorShell } from '../../../components/editor/inspector-shell'
import { BindingInspector } from './binding-inspector'
import type { BindingChain, ComboEntry, LayerData } from '../../../lib/keymap-dt/types'

export type ComboInspectorProps = {
  combo: ComboEntry
  layers: LayerData[]
  pickMode: boolean
  onChange: (next: ComboEntry) => void
  onRemove: () => void
  onEnterPickMode: () => void
  onExitPickMode: () => void
}

/**
 * Right-panel Combo editor. Sections:
 *   - Name (CommittingTextInput — DT identifier)
 *   - Binding (click-through to a nested BindingInspector)
 *   - Key positions (chips + "Add positions" toggle that puts the board
 *     into pick-mode where clicking a key toggles it into `keyPositions`)
 *   - Target layers (pill toggle group; empty selection = active on every
 *     layer, matching ZMK's default)
 *
 * `timeout-ms` and `require-prior-idle-ms` are absent by design: our
 * parser/serializer does not round-trip those properties yet, so the
 * inspector avoids exposing values the reducer would silently drop.
 */
export function ComboInspector({
  combo,
  layers,
  pickMode,
  onChange,
  onRemove,
  onEnterPickMode,
  onExitPickMode,
}: ComboInspectorProps) {
  const [editingBinding, setEditingBinding] = useState(false)

  const commitBinding = (chain: BindingChain) => {
    onChange({ ...combo, bindings: chain })
    setEditingBinding(false)
  }

  if (editingBinding) {
    return (
      <BindingInspector
        targetLabel={`${combo.name} binding`}
        targetSubtitle={`pos ${combo.keyPositions.join(',')}`}
        initial={combo.bindings}
        onCancel={() => setEditingBinding(false)}
        onCommit={commitBinding}
      />
    )
  }

  const activeLayerSet = new Set(combo.layers)

  return (
    <InspectorShell
      title="Combo"
      ariaLabel="Combo editor"
      headerRight={
        <button
          type="button"
          onClick={onRemove}
          class="text-[11px] font-mono text-danger hover:brightness-95"
        >
          Delete
        </button>
      }
      footer={
        <Button size="sm" variant="primary" disabled>
          Auto-saved
        </Button>
      }
    >
      <>
        <div class="flex flex-col gap-2">
          <span class="text-[12px] font-semibold text-fg-muted">Name</span>
          <CommittingTextInput
            class="font-mono"
            value={combo.name}
            onCommit={(name) => onChange({ ...combo, name })}
          />
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-[12px] font-semibold text-fg-muted">Binding</span>
          <button
            type="button"
            onClick={() => setEditingBinding(true)}
            class="flex items-center justify-between px-3 py-2.5 border border-border rounded-lg bg-surface-0 text-[13.5px] font-mono font-semibold text-fg hover:bg-surface-2 transition-colors"
          >
            <span>{combo.bindings.tokens.join(' ') || '&none'}</span>
            <span class="text-fg-subtle text-[11px]">▾</span>
          </button>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-[12px] font-semibold text-fg-muted">
            Key positions <span class="text-fg-subtle">({combo.keyPositions.length})</span>
          </span>
          <div class="flex flex-wrap gap-1.5">
            {combo.keyPositions.map((pos) => (
              <span
                key={pos}
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-soft border border-accent font-mono text-[12px] font-semibold text-accent"
              >
                pos {pos}
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...combo,
                      keyPositions: combo.keyPositions.filter((p) => p !== pos),
                    })
                  }
                  class="text-fg-subtle hover:text-fg"
                  aria-label={`Remove position ${pos}`}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={pickMode ? onExitPickMode : onEnterPickMode}
              class={[
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[12px] transition-colors',
                pickMode
                  ? 'bg-accent text-accent-fg border-accent'
                  : 'border-dashed border-border-strong text-fg-subtle hover:text-fg hover:border-border-strong',
              ].join(' ')}
            >
              {pickMode ? 'Done picking' : '+ Add'}
            </button>
          </div>
          <span class="text-[10.5px] text-fg-subtle leading-snug">
            {pickMode
              ? 'Click keys on the board to toggle positions. Esc to exit.'
              : 'Click "+ Add" to enter board pick mode.'}
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-[12px] font-semibold text-fg-muted">Target layers</span>
          <div role="group" aria-label="Target layers" class="flex flex-wrap gap-1.5">
            {layers.map((l, i) => {
              const isActive = activeLayerSet.has(i)
              return (
                <button
                  key={l.name}
                  type="button"
                  aria-pressed={isActive ? 'true' : 'false'}
                  aria-label={`Layer ${i} ${l.name}`}
                  onClick={() => {
                    const next = new Set(activeLayerSet)
                    if (isActive) next.delete(i)
                    else next.add(i)
                    onChange({
                      ...combo,
                      layers: Array.from(next).sort((a, b) => a - b),
                    })
                  }}
                  class={[
                    'px-2.5 py-1 rounded-lg font-mono text-[11.5px] font-semibold transition-colors',
                    isActive
                      ? 'bg-ink text-ink-fg'
                      : 'border border-border bg-surface-0 text-fg-subtle hover:text-fg hover:bg-surface-2',
                  ].join(' ')}
                >
                  {i}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => onChange({ ...combo, layers: [] })}
              class="px-2.5 py-1 rounded-lg border border-dashed border-border-strong bg-transparent font-mono text-[11.5px] text-fg-subtle hover:text-fg"
            >
              all
            </button>
          </div>
          <span class="text-[10.5px] text-fg-subtle leading-snug">
            Empty means enabled on every layer
          </span>
        </div>
      </>
    </InspectorShell>
  )
}
