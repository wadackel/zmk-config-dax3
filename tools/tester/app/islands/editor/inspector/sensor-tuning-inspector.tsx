import { useEditor } from '../../../lib/editor-state/context'
import type { BehaviorEntry, LayerData } from '../../../lib/keymap-dt/types'
import {
  checkScrlVal,
  checkTapMs,
  checkTriggersPerRotation,
  describeEncoderRotation,
  extractScrlVal,
  getEncScrollTapMs,
  SHIELD_STEPS,
  SHIELD_TRIGGERS_PER_ROTATION,
  type HintResult,
} from '../../../lib/sensor-hints'
import { InspectorShell } from '../../../components/editor/inspector-shell'
import { Slider } from '../../../components/ui/slider'

const MSC_PERIOD_MS = 16 // enc_scroll.tap-ms must be ≥ this for scroll events to fire.

/**
 * Right-panel tuning + rules pane for the Sensors tab. Consists of:
 *   1. **Sensor config** — read-only summary (triggers-per-rotation from
 *      the shield DTS, SCRL_VAL from the keymap #define, tap-ms from the
 *      enc_scroll behaviour).
 *   2. **Editable tap-ms slider** — the one value we can actually change
 *      from within the editor. Slider range respects the MSC 16 ms floor.
 *   3. **CLAUDE.md rules** — surfaces the same HintResult that
 *      `sensor-hints.ts` computes, mapping ok/warn/error to visual tone.
 *   4. **All-layers summary** — one row per layer showing the encoder 0/1
 *      binding roll-up.
 */
export function SensorTuningInspector() {
  const { state, dispatch } = useEditor()
  const behaviors = state.draft.behaviors
  const scrlVal = extractScrlVal(state.baselineSource)
  const tapMs = getEncScrollTapMs(behaviors)
  const encScrollIdx = behaviors.findIndex((b) => b.name === 'enc_scroll')
  const encScrollDefined = encScrollIdx >= 0

  const tapMsHint = checkTapMs(tapMs)
  const scrlValHint = checkScrlVal(scrlVal)
  const tprHint = checkTriggersPerRotation(SHIELD_TRIGGERS_PER_ROTATION, SHIELD_STEPS)
  const allHints = [tapMsHint, scrlValHint, tprHint]
  const rulesLevel: 'ok' | 'warn' | 'error' = allHints.some((h) => h.level === 'error')
    ? 'error'
    : allHints.some((h) => h.level === 'warn')
      ? 'warn'
      : 'ok'

  const setTapMs = (nextMs: number) => {
    if (encScrollIdx < 0) return
    const target = behaviors[encScrollIdx]
    const nextProps = target.props.map((p) =>
      p.name === 'tap-ms' ? { ...p, value: `<${nextMs}>` } : p,
    )
    const behavior: BehaviorEntry = { ...target, props: nextProps }
    dispatch({ type: 'UPDATE_BEHAVIOR', index: encScrollIdx, behavior })
  }

  return (
    <InspectorShell
      title="Tuning"
      ariaLabel="Sensor tuning"
      headerRight={
        <span
          class={[
            'inline-flex items-center gap-1.5 text-[11px] font-medium',
            rulesLevel === 'ok'
              ? 'text-success'
              : rulesLevel === 'warn'
                ? 'text-warning'
                : 'text-danger',
          ].join(' ')}
        >
          <span
            aria-hidden="true"
            class={[
              'w-[7px] h-[7px] rounded-full',
              rulesLevel === 'ok'
                ? 'bg-success'
                : rulesLevel === 'warn'
                  ? 'bg-warning'
                  : 'bg-danger',
            ].join(' ')}
          />
          {rulesLevel === 'ok' ? 'rules OK' : rulesLevel === 'warn' ? 'rules warn' : 'rules error'}
        </span>
      }
    >
      <>
        {/* SENSOR CONFIG */}
        <div class="flex flex-col gap-2">
          <span class="text-[10.5px] font-mono font-semibold tracking-wider text-fg-subtle">
            SENSOR CONFIG
          </span>
          <div class="flex flex-col divide-y divide-border-subtle border border-border-subtle rounded-xl overflow-hidden bg-surface-0">
            <SummaryRow label="triggers-per-rotation" value={SHIELD_TRIGGERS_PER_ROTATION} />
            <SummaryRow label="tap-ms" value={tapMs ?? '—'} />
            <SummaryRow label="SCRL_VAL" value={scrlVal ?? '—'} />
          </div>
        </div>

        {/* EDITABLE SLIDER */}
        {encScrollDefined ? (
          <Slider
            value={tapMs ?? MSC_PERIOD_MS}
            min={MSC_PERIOD_MS}
            max={80}
            step={1}
            onChange={setTapMs}
            label="tap-ms"
            unit="ms"
            hint={`enc_scroll event period. Below ${MSC_PERIOD_MS}ms no scroll event fires.`}
          />
        ) : (
          <div class="p-3 rounded-lg bg-warning-soft border border-warning/40 text-[11.5px] text-fg">
            enc_scroll behaviour is undefined — tap-ms cannot be edited. Create it in the Behaviors tab.
          </div>
        )}

        {/* CLAUDE.MD RULES */}
        <div class="flex flex-col gap-2">
          <span class="text-[10.5px] font-mono font-semibold tracking-wider text-fg-subtle">
            CLAUDE.md RULES
          </span>
          <RuleCard hint={tapMsHint} okMessage={`tap-ms=${tapMs ?? '—'} within recommended range (≥ ${MSC_PERIOD_MS}ms)`} />
          <RuleCard hint={scrlValHint} okMessage={`SCRL_VAL=${scrlVal ?? '—'} clears the macOS threshold`} />
          <RuleCard
            hint={tprHint}
            okMessage={`triggers-per-rotation=${SHIELD_TRIGGERS_PER_ROTATION} is an integer divisor of steps=${SHIELD_STEPS}`}
          />
        </div>

        {/* PER-LAYER SUMMARY */}
        <div class="flex flex-col gap-2">
          <span class="text-[10.5px] font-mono font-semibold tracking-wider text-fg-subtle">
            THIS ENCODER, ALL LAYERS
          </span>
          <div class="flex flex-col gap-1.5">
            {state.draft.layers.map((l, i) => (
              <PerLayerRow key={l.name} idx={i} layer={l} />
            ))}
          </div>
        </div>
      </>
    </InspectorShell>
  )
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div class="flex items-center justify-between px-3 py-2.5">
      <span class="text-[12.5px] text-fg-muted">{label}</span>
      <span class="text-[13px] font-mono font-semibold text-fg">{value}</span>
    </div>
  )
}

function RuleCard({ hint, okMessage }: { hint: HintResult; okMessage: string }) {
  const level = hint.level
  const styles =
    level === 'ok'
      ? 'bg-success-soft border-success/30 text-[color:var(--color-success)]'
      : level === 'warn'
        ? 'bg-warning-soft border-warning/30 text-[color:var(--color-warning)]'
        : 'bg-danger-soft border-danger/30 text-[color:var(--color-danger)]'
  const symbol = level === 'ok' ? '✓' : level === 'warn' ? '△' : '⚠︎'
  return (
    <div class={['flex items-start gap-2 p-2.5 rounded-lg border', styles].join(' ')}>
      <span class="text-[12px] font-mono font-semibold leading-tight mt-0.5">{symbol}</span>
      <span class="text-[11.5px] leading-snug text-fg">
        {level === 'ok' ? okMessage : hint.message}
      </span>
    </div>
  )
}

function PerLayerRow({ idx, layer }: { idx: number; layer: LayerData }) {
  const bindings = layer.sensorBindings?.perEncoder
  // Parser guarantees a 2-element perEncoder tuple when present, but hostile
  // keymaps can produce shorter lists; guard both indices instead of `!`.
  const enc0Chain = bindings?.[0]
  const enc1Chain = bindings?.[1]
  const enc0 = enc0Chain ? describeEncoderRotation(enc0Chain) : null
  const enc1 = enc1Chain ? describeEncoderRotation(enc1Chain) : null
  const summary = bindings
    ? enc0 && enc1
      ? `${enc0.ccw} / ${enc0.cw}`
      : enc0Chain?.tokens.join(' ') || '—'
    : '— inherits'
  return (
    <div class="flex items-center gap-2 p-2 rounded-lg border border-border-subtle bg-surface-0">
      <span class="text-[10px] font-mono text-fg-subtle w-3">{idx}</span>
      <span class="text-[11.5px] font-mono text-fg-muted truncate">{summary}</span>
    </div>
  )
}
