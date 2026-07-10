import { useEffect, useState } from 'hono/jsx'
import { useEditor } from '../../lib/editor-state/context'
import type { BindingChain } from '../../lib/keymap-dt/types'
import { ChainEditor } from './macros/chain-editor'
import { MacroList } from './macros/macro-list'
import { MacroStepInspector } from './inspector/macro-step-inspector'

/**
 * Macros tab redesign. Three-column shell:
 *   - Left: MacroList (SIMPLE / RAW badge, step count)
 *   - Center: ChainEditor (horizontal step cards + insert toolbar + raw preview)
 *   - Right: MacroStepInspector (BindingInspector for simple chains,
 *     raw-token text input for RAW chains)
 */
export function MacrosTab() {
  const { state, dispatch } = useEditor()
  const macros = state.draft.macros
  const [activeMacroIdx, setActiveMacroIdx] = useState<number | null>(
    macros.length > 0 ? 0 : null,
  )
  const [selectedStepIdx, setSelectedStepIdx] = useState<number | null>(null)

  useEffect(() => {
    if (macros.length === 0) setActiveMacroIdx(null)
    else if (activeMacroIdx === null || activeMacroIdx >= macros.length) {
      setActiveMacroIdx(0)
    }
  }, [macros.length, activeMacroIdx])

  useEffect(() => {
    setSelectedStepIdx(null)
  }, [activeMacroIdx])

  const activeMacro =
    activeMacroIdx !== null ? macros[activeMacroIdx] : null

  const updateMacroChains = (updater: (list: BindingChain[]) => BindingChain[]) => {
    if (activeMacroIdx === null || !activeMacro) return
    dispatch({
      type: 'UPDATE_MACRO',
      index: activeMacroIdx,
      macro: {
        ...activeMacro,
        bindingsList: updater(activeMacro.bindingsList),
      },
    })
  }

  return (
    <div class="flex-1 min-h-0 min-w-0 flex bg-surface-0">
      <MacroList
        macros={macros}
        activeIdx={activeMacroIdx}
        onSelect={setActiveMacroIdx}
        onAdd={() => {
          dispatch({ type: 'ADD_MACRO' })
          setActiveMacroIdx(macros.length)
        }}
      />

      <div class="flex-1 bg-surface-3 flex flex-col min-w-0 overflow-hidden">
        {activeMacro ? (
          <ChainEditor
            macro={activeMacro}
            selectedStepIdx={selectedStepIdx}
            onSelectStep={setSelectedStepIdx}
            onInsertStep={(idx, chain) => {
              updateMacroChains((list) => {
                const next = [...list]
                next.splice(idx, 0, chain)
                return next
              })
              setSelectedStepIdx(idx)
            }}
            onRemoveStep={(idx) => {
              updateMacroChains((list) => list.filter((_, i) => i !== idx))
              if (selectedStepIdx === idx) setSelectedStepIdx(null)
            }}
          />
        ) : (
          <div class="flex-1 flex items-center justify-center text-fg-subtle text-[13px]">
            Click + to add a macro
          </div>
        )}
      </div>

      {activeMacro && selectedStepIdx !== null ? (
        <MacroStepInspector
          macro={activeMacro}
          stepIdx={selectedStepIdx}
          onCommitStep={(chain) => {
            updateMacroChains((list) =>
              list.map((c, i) => (i === selectedStepIdx ? chain : c)),
            )
          }}
          onRemoveStep={() => {
            updateMacroChains((list) =>
              list.filter((_, i) => i !== selectedStepIdx),
            )
            setSelectedStepIdx(null)
          }}
          onCancel={() => setSelectedStepIdx(null)}
        />
      ) : (
        <aside class="w-[340px] flex-none border-l border-border-subtle bg-surface-1 flex items-center justify-center px-8 text-center text-[12px] text-fg-subtle">
          Click a step to edit
        </aside>
      )}
    </div>
  )
}
