import { CommittingTextInput } from '../../../components/ui/field'
import { SegmentedControl } from '../../../components/ui/segmented-control'
import { Slider } from '../../../components/ui/slider'
import { Toggle } from '../../../components/ui/toggle'
import {
  formatPropValue,
  parsePropValue,
  type PropKind,
  type PropSchema,
} from '../../../lib/behavior-prop-schema'

export type PropRow = {
  schema: PropSchema
  rawValue: string | undefined
}

export type PropGridProps = {
  rows: PropRow[]
  onChange: (name: string, rawValue: string | undefined) => void
}

const PROP_KIND_BADGE: Record<PropKind['type'], string> = {
  int: 'int',
  'int-ms': 'int-ms',
  enum: 'enum',
  bool: 'bool',
  raw: 'raw',
}

/**
 * Schema-driven property grid for the Behaviors tab. One row per
 * `PropSchema`; the editor widget is picked by `kind`:
 *   - `int-ms` / `int` → number input + Slider
 *   - `enum` → SegmentedControl
 *   - `bool` → Toggle
 *   - `raw` → monospace text input
 *
 * The label column shows the DT prop name + a type badge so users can
 * read the schema at a glance without hovering.
 */
export function PropGrid({ rows, onChange }: PropGridProps) {
  return (
    <div class="bg-surface-0 border border-border rounded-xl overflow-hidden shadow-[var(--shadow-key)]">
      <div class="grid" style="grid-template-columns: 220px 1fr;">
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1
          return (
            <PropRowRender
              key={row.schema.name}
              row={row}
              onChange={onChange}
              isLast={isLast}
            />
          )
        })}
      </div>
    </div>
  )
}

function PropRowRender({
  row,
  onChange,
  isLast,
}: {
  row: PropRow
  onChange: (name: string, rawValue: string | undefined) => void
  isLast: boolean
}) {
  const borderClass = isLast ? '' : 'border-b border-border-subtle'
  const kind = row.schema.kind

  return (
    <>
      <div class={['px-5 py-4 flex flex-col gap-0.5', borderClass].join(' ')}>
        <span class="text-[13px] font-semibold text-fg">{row.schema.name}</span>
        <span class="text-[10.5px] font-mono text-fg-subtle">
          {PROP_KIND_BADGE[kind.type]}
        </span>
      </div>
      <div class={['px-5 py-3.5 flex items-center gap-3', borderClass].join(' ')}>
        <PropEditor row={row} onChange={onChange} />
      </div>
    </>
  )
}

function PropEditor({
  row,
  onChange,
}: {
  row: PropRow
  onChange: (name: string, rawValue: string | undefined) => void
}) {
  const { schema, rawValue } = row
  const kind = schema.kind
  const parsed = rawValue !== undefined ? parsePropValue(kind, rawValue) : undefined

  switch (kind.type) {
    case 'int':
    case 'int-ms': {
      const numeric = typeof parsed === 'number' ? parsed : undefined
      const sliderMin = kind.min ?? 0
      const sliderMax = kind.max ?? 500
      const commit = (v: number) =>
        onChange(schema.name, formatPropValue(kind, v))
      return (
        <div class="w-full flex items-center gap-3">
          <CommittingTextInput
            type="number"
            inputMode="numeric"
            min={kind.min}
            max={kind.max}
            value={numeric !== undefined ? String(numeric) : ''}
            class="!w-24 font-mono"
            onCommit={(v) => {
              if (v === '') onChange(schema.name, undefined)
              else onChange(schema.name, formatPropValue(kind, Number(v)))
            }}
          />
          <div class="flex-1 min-w-0">
            <Slider
              value={numeric ?? sliderMin}
              min={sliderMin}
              max={sliderMax}
              onChange={commit}
              unit={kind.type === 'int-ms' ? 'ms' : undefined}
              ariaLabel={schema.name}
            />
          </div>
        </div>
      )
    }
    case 'enum': {
      const value = typeof parsed === 'string' ? parsed : (kind.options[0] ?? '')
      return (
        <SegmentedControl
          value={value}
          options={kind.options.map((opt) => ({ value: opt, label: opt }))}
          onChange={(v) => onChange(schema.name, formatPropValue(kind, v))}
          ariaLabel={schema.name}
        />
      )
    }
    case 'bool': {
      const enabled = rawValue !== undefined
      return (
        <div class="flex items-center gap-3">
          <Toggle
            checked={enabled}
            onChange={(next) => onChange(schema.name, next ? '' : undefined)}
            ariaLabel={schema.name}
          />
          <span class="text-[11.5px] text-fg-subtle">
            {enabled ? 'On' : 'Off'}
          </span>
        </div>
      )
    }
    case 'raw':
      return (
        <CommittingTextInput
          class="font-mono w-full"
          value={rawValue ?? ''}
          onCommit={(v) => onChange(schema.name, v === '' ? undefined : v)}
        />
      )
  }
}
