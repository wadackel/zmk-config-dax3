import { CommittingTextInput } from '../../../components/ui/field'
import { InspectorShell } from '../../../components/editor/inspector-shell'
import { BindingInspector } from './binding-inspector'
import { isSimpleChain } from '../macros/macro-shape'
import type { BindingChain, MacroEntry } from '../../../lib/keymap-dt/types'

export type MacroStepInspectorProps = {
  macro: MacroEntry
  stepIdx: number
  onCommitStep: (chain: BindingChain) => void
  onRemoveStep: () => void
  onCancel: () => void
}

/**
 * Right panel for editing a single macro step. Simple chains route through
 * BindingInspector for a full behaviour+keycode picker; multi-behaviour
 * "raw" chains fall back to a monospace text input to preserve tokens that
 * the picker would normalise away.
 */
export function MacroStepInspector({
  macro,
  stepIdx,
  onCommitStep,
  onRemoveStep,
  onCancel,
}: MacroStepInspectorProps) {
  const step = macro.bindingsList[stepIdx]
  if (!step) return null

  if (isSimpleChain(step)) {
    return (
      <BindingInspector
        targetLabel={`Step ${stepIdx + 1}`}
        targetSubtitle={macro.name}
        initial={step}
        onCancel={onCancel}
        onCommit={onCommitStep}
      />
    )
  }

  return (
    <InspectorShell
      title={`Step ${stepIdx + 1}`}
      ariaLabel="Macro step (raw)"
      headerRight={
        <button
          type="button"
          onClick={onRemoveStep}
          class="text-[11px] font-mono text-danger hover:brightness-95"
        >
          Remove
        </button>
      }
      footer={
        <button
          type="button"
          onClick={onCancel}
          class="px-4 py-2 rounded-lg border border-border bg-surface-0 text-[13px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2"
        >
          Close
        </button>
      }
    >
      <>
        <div class="p-3 rounded-lg bg-warning-soft border border-warning/40 text-[11.5px] text-fg">
          This step contains multiple behaviours — the picker cannot round-trip
          it. Edit the token list directly.
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-[12px] font-semibold text-fg-muted">Tokens</span>
          <CommittingTextInput
            class="font-mono w-full"
            value={step.tokens.join(' ')}
            onCommit={(next) =>
              onCommitStep({
                tokens: next.split(/\s+/).filter(Boolean),
              })
            }
          />
        </div>
      </>
    </InspectorShell>
  )
}
