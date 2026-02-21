import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { parseDefaultLayerBindings } from './parse-keymap'
import { resolveEncoders, resolveKeys } from './resolve'

const VIRTUAL_MODULE_ID = 'virtual:zmk-layout'
const RESOLVED_ID = '\0' + VIRTUAL_MODULE_ID

interface DaxLayout {
  layouts: {
    default_layout: {
      layout: Array<{ x: number; y: number }>
    }
  }
  sensors: Array<{ ref: string }>
}

export function zmkLayout(): Plugin {
  let repoRoot: string

  const getSourceFiles = () => ({
    jsonPath: path.join(repoRoot, 'config/dax3.json'),
    keymapPath: path.join(repoRoot, 'config/dax3.keymap'),
  })

  const generateModule = () => {
    const { jsonPath, keymapPath } = getSourceFiles()
    const layout = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as DaxLayout
    const keymapContent = fs.readFileSync(keymapPath, 'utf-8')

    const physicalLayout = layout.layouts.default_layout.layout
    const bindings = parseDefaultLayerBindings(keymapContent)
    const keys = resolveKeys(physicalLayout, bindings)
    const encoders = resolveEncoders(layout.sensors)
    const testableCount = keys.filter(k => k.testability !== 'untestable').length

    return [
      `export const KEYS = ${JSON.stringify(keys, null, 2)}`,
      `export const ENCODERS = ${JSON.stringify(encoders, null, 2)}`,
      `export const TESTABLE_KEY_COUNT = ${testableCount}`,
    ].join('\n')
  }

  return {
    name: 'zmk-layout',

    configResolved(config) {
      // Vite root = tools/tester/, repo root is 2 levels up
      repoRoot = path.resolve(config.root, '../..')
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return
      return generateModule()
    },

    configureServer(server) {
      const { jsonPath, keymapPath } = getSourceFiles()
      const watchFiles = [jsonPath, keymapPath]

      for (const file of watchFiles) {
        server.watcher.add(file)
      }

      server.watcher.on('change', (changedPath) => {
        if (!watchFiles.includes(changedPath)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}
