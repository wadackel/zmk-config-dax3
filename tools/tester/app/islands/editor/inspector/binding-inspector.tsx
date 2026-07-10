import { useEffect, useRef, useState } from 'hono/jsx'
import { Button } from '../../../components/ui/button'
import {
  getBehavior,
  KEYCODES,
  loadRecentKeycodes,
  pushRecentKeycode,
} from '../../../lib/picker'
import { useEditor } from '../../../lib/editor-state/context'
import { physicalToMatrix } from '../../../lib/matrix-mapping'
import type { BindingChain } from '../../../lib/keymap-dt/types'
import { InspectorShell } from '../../../components/editor/inspector-shell'
import { ArgumentControl } from '../picker/argument-control'
import { BehaviorCombobox } from '../picker/behavior-combobox'
import { BtSpecialForm } from '../picker/bt-special-form'

const KEYCODE_TOKEN_SET = new Set(KEYCODES.map((k) => k.token))

export type BindingInspectorProps = {
  /** Position on the physical board (0-45) — anchors the "selected key"
   *  card. Pass -1 (or omit) when the target isn't a physical key
   *  (e.g. sensor encoder, mouse gesture direction). */
  keyIdx?: number
  /** Optional label for non-key targets (`CCW stroke`, `RIGHT stroke`, …).
   *  Used only when `keyIdx` is negative. */
  targetLabel?: string
  /** Small monospace subtitle under `targetLabel`. */
  targetSubtitle?: string
  /** Existing chain being edited. Empty / `&trans` fall back to `&kp`. */
  initial: BindingChain
  onCancel: () => void
  onCommit: (chain: BindingChain) => void
}

/**
 * Right-panel binding editor. Semantically the same picker as the legacy
 * `BindingPicker` modal — Behaviour combobox + Arguments (with modifier
 * chips for `&kp`) + Recent chips + preview — but rendered as a docked
 * inspector so the user can see the board and the edit side-by-side.
 *
 * Commit / cancel routing differs from the modal picker:
 *   - No Dialog runTeardown: this panel is a plain conditional render.
 *   - The `Commit` button uses `onMouseDown` + activeElement.blur() to flush
 *     any focused ArgumentControl's pending value into `argsRef` before
 *     `commit()` reads it. Same rationale as the modal picker — combobox
 *     blurs cause layout shifts that make `onClick` miss.
 */
export function BindingInspector({
  keyIdx = -1,
  targetLabel,
  targetSubtitle,
  initial,
  onCancel,
  onCommit,
}: BindingInspectorProps) {
  const { state } = useEditor()

  const isEmpty = initial.tokens.length === 0 || initial.tokens[0] === '&trans'
  const initialBehaviorToken = isEmpty ? '&kp' : initial.tokens[0]!

  const [behaviorToken, setBehaviorToken] = useState(initialBehaviorToken)
  const [args, setArgs] = useState<string[]>(isEmpty ? [] : initial.tokens.slice(1))
  const [activeArgIdx, setActiveArgIdx] = useState(0)
  const [recent, setRecent] = useState<string[]>([])

  // Synchronous mirrors — commit() reads these instead of the render closure
  // so blur-then-commit within one task sees the latest values. Same pattern
  // as the legacy BindingPicker (`binding-picker.tsx:37-39`).
  const argsRef = useRef<string[]>(args)
  const behaviorRef = useRef<string>(behaviorToken)
  argsRef.current = args
  behaviorRef.current = behaviorToken

  const behavior = getBehavior(behaviorToken)
  const expectedArity = behavior?.arity?.[0] ?? 0
  const argTypes = behavior?.argTypes ?? []
  const argLabels = behavior?.argLabels
  const normalizedArgs = Array.from({ length: expectedArity }, (_, i) => args[i] ?? '')

  useEffect(() => {
    // Refresh the recents each mount — localStorage may have been updated by
    // a previous commit in this session.
    setRecent(loadRecentKeycodes())
  }, [keyIdx])

  useEffect(() => {
    const first = argTypes.findIndex((t) => t === 'keycode')
    setActiveArgIdx(first === -1 ? 0 : first)
  }, [behaviorToken])

  const previewTokens =
    behaviorToken === '&bt'
      ? ['&bt', ...(args ?? [])].filter(Boolean)
      : [behaviorToken, ...normalizedArgs].filter(Boolean)
  const previewText = previewTokens.join(' ')

  const commit = (overrideValue?: string) => {
    if (typeof overrideValue !== 'string') overrideValue = undefined
    const currentBehavior = behaviorRef.current ?? behaviorToken
    const currentBehaviorEntry = getBehavior(currentBehavior)
    const currentArity = currentBehaviorEntry?.arity?.[0] ?? 0
    const currentArgTypes = currentBehaviorEntry?.argTypes ?? []
    let effectiveArgs = argsRef.current ?? args
    if (overrideValue !== undefined && activeArgIdx >= 0) {
      effectiveArgs = [...effectiveArgs]
      while (effectiveArgs.length <= activeArgIdx) effectiveArgs.push('')
      effectiveArgs[activeArgIdx] = overrideValue
    }
    const effectiveNormalized = Array.from(
      { length: currentArity },
      (_, i) => effectiveArgs[i] ?? '',
    )
    for (let i = 0; i < effectiveNormalized.length; i++) {
      if (currentArgTypes[i] === 'keycode' && effectiveNormalized[i]) {
        pushRecentKeycode(effectiveNormalized[i])
      }
    }
    const effectiveTokens =
      currentBehavior === '&bt'
        ? ['&bt', ...effectiveArgs].filter(Boolean)
        : [currentBehavior, ...effectiveNormalized].filter(Boolean)
    onCommit({ tokens: effectiveTokens })
  }

  const updateArg = (i: number, v: string) => {
    const next = [...(argsRef.current ?? args)]
    while (next.length <= i) next.push('')
    next[i] = v
    argsRef.current = next
    setArgs(next)
  }

  const advanceAfter = (i: number) => {
    for (let j = i + 1; j < argTypes.length; j++) {
      if (argTypes[j] === 'keycode') {
        setActiveArgIdx(j)
        return
      }
    }
  }

  const applyRecent = (token: string) => {
    if (activeArgIdx < 0) return
    updateArg(activeArgIdx, token)
    pushRecentKeycode(token)
    advanceAfter(activeArgIdx)
  }

  const coord = keyIdx >= 0 ? physicalToMatrix(keyIdx) : null
  const displayChar =
    behaviorToken === '&kp' && normalizedArgs[0]
      ? normalizedArgs[0].replace(/^[LR][CSGA]\((.+)\)$/, '$1')
      : behaviorToken === '&trans'
        ? '·'
        : behaviorToken.replace(/^&/, '')

  // Cmd/Ctrl+Enter commits from anywhere in the panel. Escape cancels only
  // when a text input is not composing — the ArgumentControl children handle
  // their own Escape semantics for the combobox listbox.
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.defaultPrevented) return
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      commit()
    }
  }

  return (
    <InspectorShell
      title="Binding"
      ariaLabel="Binding editor"
      width={356}
      onKeyDown={handleKeyDown}
      headerRight={<span class="text-[10.5px] font-mono text-fg-subtle">⌘↵ commit · esc</span>}
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            // See `binding-picker.tsx:143` for the mousedown → blur → commit
            // rationale (blur must flush pending pending combobox state before
            // commit reads argsRef).
            onMouseDown={(e: MouseEvent) => {
              e.preventDefault()
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur()
              }
              commit()
            }}
          >
            Commit
          </Button>
        </>
      }
    >
      <>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-accent-soft border border-accent">
          <span class="w-9 h-9 shrink-0 rounded-lg bg-surface-0 border border-accent flex items-center justify-center text-[16px] font-mono font-semibold text-accent">
            {displayChar}
          </span>
          <div class="flex flex-col gap-0.5">
            <span class="text-[12.5px] font-semibold">
              {coord ? 'Selected key' : (targetLabel ?? 'Selected')}
            </span>
            <span class="text-[10.5px] font-mono text-fg-muted">
              {coord
                ? `row ${coord.row} · col ${coord.col} · pos ${keyIdx}`
                : (targetSubtitle ?? '')}
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-[12px] font-semibold text-fg-muted">Behaviour</span>
          <BehaviorCombobox
            value={behaviorToken}
            onChange={(next) => {
              setBehaviorToken(next)
              behaviorRef.current = next
              const nextBehavior = getBehavior(next)
              const nextArity = nextBehavior?.arity?.[0] ?? 0
              const nextArgTypes = nextBehavior?.argTypes ?? []
              const prevArgTypes = behavior?.argTypes ?? []
              const sameShape =
                nextArgTypes.length === prevArgTypes.length &&
                nextArgTypes.every((t, i) => t === prevArgTypes[i])
              const currentArgs = argsRef.current ?? args
              const newArgs = sameShape
                ? Array.from({ length: nextArity }, (_, i) => currentArgs[i] ?? '')
                : Array.from({ length: nextArity }, () => '')
              argsRef.current = newArgs
              setArgs(newArgs)
            }}
          />
          {behavior?.description && (
            <div class="text-[10.5px] text-fg-subtle">{behavior.description}</div>
          )}
        </div>

        {behaviorToken === '&bt' ? (
          <BtSpecialForm
            tokens={['&bt', ...args]}
            onChange={(t) => {
              const nextArgs = t.slice(1)
              argsRef.current = nextArgs
              setArgs(nextArgs)
            }}
          />
        ) : (
          expectedArity > 0 && (
            <div class="flex flex-col gap-2">
              <span class="text-[12px] font-semibold text-fg-muted">
                Arguments <span class="text-fg-subtle">({expectedArity})</span>
              </span>
              <div class="flex flex-col gap-3">
                {normalizedArgs.map((value, i) => {
                  const argType = argTypes[i]
                  const isActive = i === activeArgIdx
                  const label = argLabels?.[i] ?? argType ?? 'arg'
                  const pinModifiers =
                    behaviorToken === '&mt' && i === 0 && argType === 'keycode'
                  return (
                    <ArgumentControl
                      key={`${behaviorToken}-${i}`}
                      argType={argType}
                      value={value}
                      onChange={(v) => {
                        updateArg(i, v)
                        if (
                          argType === 'keycode' &&
                          v &&
                          KEYCODE_TOKEN_SET.has(v.replace(/^[LR][CSGA]\((.+)\)$/, '$1'))
                        ) {
                          advanceAfter(i)
                        }
                      }}
                      onCommit={commit}
                      pinModifiers={pinModifiers}
                      layers={state.draft.layers}
                      isActive={isActive}
                      onFocus={() => setActiveArgIdx(i)}
                      label={label}
                      autoFocus={i === activeArgIdx}
                    />
                  )
                })}
              </div>
            </div>
          )
        )}

        {recent.length > 0 && argTypes.some((t) => t === 'keycode') && (
          <div class="flex flex-col gap-2">
            <span class="text-[10.5px] font-mono font-semibold tracking-wider text-fg-subtle">
              RECENT
            </span>
            <div class="flex flex-wrap gap-1.5">
              {recent.slice(0, 8).map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => applyRecent(token)}
                  class="px-2.5 py-1 border border-border-subtle rounded-md text-[12px] font-mono text-fg-muted bg-surface-0 hover:text-fg hover:bg-surface-2 transition-colors"
                  title={`Insert ${token} into active argument`}
                >
                  {token}
                </button>
              ))}
            </div>
          </div>
        )}

        <div class="flex items-center gap-3 p-3 rounded-lg bg-surface-3">
          <span class="text-[11px] text-fg-subtle">Preview</span>
          <span class="text-[13.5px] font-mono font-semibold text-fg">
            {previewText || '—'}
          </span>
        </div>
      </>
    </InspectorShell>
  )
}
