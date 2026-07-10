import { useState } from 'hono/jsx'
import { Button } from '../../../components/ui/button'
import { CommittingTextInput, TextInput } from '../../../components/ui/field'
import { InspectorShell } from '../../../components/editor/inspector-shell'
import type { PropSchema } from '../../../lib/behavior-prop-schema'

export type BehaviorAddPropInspectorProps = {
  suggestions: PropSchema[]
  onAddKnown: (schema: PropSchema) => void
  onAddCustom: (name: string, value: string) => void
}

const KIND_BADGE_LABEL: Record<string, string> = {
  int: 'int',
  'int-ms': 'int-ms',
  enum: 'enum',
  bool: 'bool',
  raw: 'raw',
}

/**
 * Right-panel picker for adding new props to the currently-selected
 * behaviour. Lists unused schema-known props with their type badge
 * (int-ms / enum / bool / raw) at the top, then a "custom (raw)" section
 * for any DT prop we don't have a schema for.
 */
export function BehaviorAddPropInspector({
  suggestions,
  onAddKnown,
  onAddCustom,
}: BehaviorAddPropInspectorProps) {
  const [query, setQuery] = useState('')
  const [customName, setCustomName] = useState('')
  const [customValue, setCustomValue] = useState('')

  const filtered = query.trim()
    ? suggestions.filter((s) =>
        s.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : suggestions

  return (
    <InspectorShell
      title="Add property"
      ariaLabel="Add property"
      width={300}
    >
      <>
        <TextInput
          aria-label="Search property name"
          placeholder="Search property name…"
          value={query}
          onInput={(e: Event) => setQuery((e.target as HTMLInputElement).value)}
          class="!py-2 !text-[12.5px]"
        />

        <div class="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <span class="text-[11.5px] text-fg-subtle">
              No matching properties
            </span>
          ) : (
            filtered.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => onAddKnown(s)}
                class="flex items-center justify-between px-3 py-2.5 border border-border rounded-xl bg-surface-0 text-left hover:bg-surface-2 transition-colors"
              >
                <span class="text-[12.5px] font-mono font-semibold text-fg">
                  {s.name}
                </span>
                <span class="text-[10px] font-mono text-fg-subtle bg-surface-4 rounded-md px-1.5 py-0.5">
                  {KIND_BADGE_LABEL[s.kind.type]}
                </span>
              </button>
            ))
          )}

          <details class="mt-2">
            <summary class="cursor-pointer text-[11.5px] font-mono text-fg-subtle hover:text-fg select-none">
              + Custom (raw)
            </summary>
            <div class="mt-2 flex flex-col gap-2">
              <CommittingTextInput
                placeholder="name"
                value={customName}
                onCommit={setCustomName}
                class="!text-[12px] font-mono"
              />
              <CommittingTextInput
                placeholder="value (e.g. <5>)"
                value={customValue}
                onCommit={setCustomValue}
                class="!text-[12px] font-mono"
              />
              <Button
                size="sm"
                variant="primary"
                disabled={!customName.trim()}
                onClick={() => {
                  onAddCustom(customName.trim(), customValue)
                  setCustomName('')
                  setCustomValue('')
                }}
              >
                Add
              </Button>
            </div>
          </details>
        </div>
      </>
    </InspectorShell>
  )
}
