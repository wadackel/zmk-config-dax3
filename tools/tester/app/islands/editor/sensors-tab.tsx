import { useState } from 'hono/jsx'
import { useEditor } from '../../lib/editor-state/context'
import type { BindingChain, LayerData } from '../../lib/keymap-dt/types'
import { describeEncoderRotation } from '../../lib/sensor-hints'
import { BindingInspector } from './inspector/binding-inspector'
import { SensorTuningInspector } from './inspector/sensor-tuning-inspector'
import { EncoderDial } from './sensors/encoder-dial'
import { LayerSelectorColumn } from './sensors/layer-selector-column'

const ENCODER_LABELS = ['left', 'right']

type EditingTarget = { encoderIdx: 0 | 1 }

/**
 * Sensors tab. Three-column shell mirroring Layers:
 *   - Left: LayerSelectorColumn (which layer's sensor-bindings to edit)
 *   - Center: encoder pill selector + CCW card / EncoderDial / CW card
 *   - Right: SensorTuningInspector by default; swapped for the binding
 *     editor when CCW/CW is clicked.
 *
 * The dial is decorative; interactions happen on the CCW/CW cards. Selecting
 * a layer without sensor-bindings surfaces an "Add sensor-bindings" prompt
 * (dispatches INSERT_SENSOR_BINDING so the reducer seeds `[&trans, &trans]`).
 */
export function SensorsTab() {
  const { state, dispatch } = useEditor()
  const layers = state.draft.layers
  const activeLayer = layers[state.activeLayerIdx]
  const [selectedEncoder, setSelectedEncoder] = useState<0 | 1>(0)
  const [editing, setEditing] = useState<EditingTarget | null>(null)

  const bindings = activeLayer?.sensorBindings?.perEncoder
  const editingChain =
    editing !== null && bindings ? bindings[editing.encoderIdx] : null

  const commitBinding = (chain: BindingChain) => {
    if (editing === null) return
    dispatch({
      type: 'UPDATE_SENSOR_BINDING',
      layerIdx: state.activeLayerIdx,
      encoderIdx: editing.encoderIdx,
      chain,
    })
    setEditing(null)
  }

  return (
    <div class="flex-1 min-h-0 min-w-0 flex bg-surface-0">
      <LayerSelectorColumn />

      <div class="flex-1 bg-surface-3 flex flex-col min-w-0 overflow-auto">
        <EncoderPillSelector
          selected={selectedEncoder}
          onSelect={setSelectedEncoder}
        />

        {!bindings ? (
          <EmptySensorState
            layerName={activeLayer?.name ?? '—'}
            onInsert={() =>
              dispatch({ type: 'INSERT_SENSOR_BINDING', layerIdx: state.activeLayerIdx })
            }
          />
        ) : (
          <div class="flex-1 flex items-center justify-center gap-8 px-8 py-6 min-w-0 flex-wrap">
            <RotationCard
              direction="ccw"
              chain={bindings[selectedEncoder]!}
              isEditing={editing?.encoderIdx === selectedEncoder}
              onClick={() => setEditing({ encoderIdx: selectedEncoder })}
            />

            <div class="flex flex-col items-center gap-3">
              <EncoderDial
                encoderIdx={selectedEncoder}
                label={ENCODER_LABELS[selectedEncoder]}
                layerIdx={state.activeLayerIdx}
              />
              <span class="text-[11px] text-fg-muted">
                Rotation preview · {selectedEncoder === 0 ? 'left' : 'right'} encoder
              </span>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'SWAP_SENSOR_BINDING_ARGS',
                    layerIdx: state.activeLayerIdx,
                    encoderIdx: selectedEncoder,
                  })
                }
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface-0 text-[12px] text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
              >
                ⇄ Swap CCW / CW
              </button>
            </div>

            <RotationCard
              direction="cw"
              chain={bindings[selectedEncoder]!}
              isEditing={editing?.encoderIdx === selectedEncoder}
              onClick={() => setEditing({ encoderIdx: selectedEncoder })}
            />
          </div>
        )}
      </div>

      {editing !== null && editingChain ? (
        <BindingInspector
          targetLabel={`Encoder ${editing.encoderIdx} · ${ENCODER_LABELS[editing.encoderIdx]}`}
          targetSubtitle={`layer ${state.activeLayerIdx} · ${activeLayer?.name ?? ''}`}
          initial={editingChain}
          onCancel={() => setEditing(null)}
          onCommit={commitBinding}
        />
      ) : (
        <SensorTuningInspector />
      )}
    </div>
  )
}

function EncoderPillSelector({
  selected,
  onSelect,
}: {
  selected: 0 | 1
  onSelect: (n: 0 | 1) => void
}) {
  const items: { idx: 0 | 1; label: string }[] = [
    { idx: 0, label: 'Encoder 0 · left' },
    { idx: 1, label: 'Encoder 1 · right' },
  ]
  return (
    <div role="radiogroup" aria-label="Encoder selection" class="flex items-center gap-2 px-8 pt-4">
      {items.map((it) => {
        const active = selected === it.idx
        return (
          <button
            key={it.idx}
            type="button"
            role="radio"
            aria-checked={active ? 'true' : 'false'}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(it.idx)}
            class={[
              'inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] transition-colors',
              active
                ? 'bg-ink text-ink-fg font-semibold'
                : 'bg-surface-0 border border-border text-fg-muted hover:text-fg hover:bg-surface-2',
            ].join(' ')}
          >
            <span
              aria-hidden="true"
              class={[
                'w-3.5 h-3.5 border-2 rounded-full inline-block',
                active
                  ? 'border-[color:var(--color-ink-fg)]/50 border-t-[color:var(--color-ink-fg)]'
                  : 'border-border-strong border-t-fg-subtle',
              ].join(' ')}
            />
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

function EmptySensorState({
  layerName,
  onInsert,
}: {
  layerName: string
  onInsert: () => void
}) {
  return (
    <div class="flex-1 flex flex-col items-center justify-center gap-4 px-8 py-6">
      <span class="text-[14px] text-fg-muted">
        <span class="font-semibold text-fg">{layerName}</span> has no sensor-bindings yet
      </span>
      <button
        type="button"
        onClick={onInsert}
        class="px-4 py-2 rounded-lg bg-accent text-accent-fg text-[13px] font-semibold shadow-[0_1px_2px_rgb(79_91_107/0.35)]"
      >
        + Add sensor-bindings
      </button>
      <span class="text-[11px] text-fg-subtle">
        Defaults for CCW / CW are <code class="font-mono">&trans</code>
      </span>
    </div>
  )
}

type RotationCardProps = {
  direction: 'ccw' | 'cw'
  chain: BindingChain
  isEditing: boolean
  onClick: () => void
}

function RotationCard({ direction, chain, isEditing, onClick }: RotationCardProps) {
  const desc = describeEncoderRotation(chain)
  // arg positions per describeEncoderRotation: arg0 = CCW, arg1 = CW
  const argToken = direction === 'ccw' ? chain.tokens[1] : chain.tokens[2]
  const displayTokens = argToken
    ? `${chain.tokens[0] ?? ''} ${argToken}`.trim()
    : chain.tokens.join(' ') || '—'
  const hint = desc ? (direction === 'ccw' ? desc.ccw : desc.cw) : ''
  const label = direction === 'ccw' ? 'CCW' : 'CW'
  const symbol = direction === 'ccw' ? '↺' : '↻'
  return (
    <button
      type="button"
      onClick={onClick}
      class={[
        'w-[212px] flex-none bg-surface-0 border rounded-xl overflow-hidden shadow-[var(--shadow-key)] text-left transition-shadow',
        isEditing
          ? 'border-2 border-accent shadow-[var(--shadow-focus-ring)]'
          : 'border-border hover:shadow-[var(--shadow-key-hover)]',
      ].join(' ')}
    >
      <div class="flex items-center gap-2 px-3.5 py-3 border-b border-border-subtle">
        <span class="text-[15px] font-mono font-semibold text-fg">{symbol}</span>
        <span class="text-[12.5px] font-semibold text-fg">{label}</span>
        <span class="ml-auto text-[10.5px] text-fg-subtle">
          {direction === 'ccw' ? 'counter-clockwise' : 'clockwise'}
        </span>
      </div>
      <div class="p-3.5 flex flex-col gap-2">
        <span class="text-[10.5px] text-fg-subtle">Binding</span>
        <span class="flex items-center justify-between px-3 py-2.5 border border-border rounded-lg bg-surface-3 font-mono text-[13.5px] font-semibold text-fg">
          <span>{displayTokens}</span>
          <span class="text-fg-subtle text-[11px]">▾</span>
        </span>
        {hint && <span class="text-[11px] text-fg-subtle">{hint}</span>}
      </div>
    </button>
  )
}
