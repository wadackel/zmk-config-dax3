// Sets `process.env.DAX3_REPO_ROOT` to the path of the repo root so HonoX dev
// route handlers (which run in the Vite dev server's Node process) can resolve
// `config/dax3.keymap` deterministically.

import path from 'node:path'
import type { Plugin } from 'vite'

export function repoRoot(): Plugin {
  return {
    name: 'dax3-repo-root',
    configResolved(config) {
      // tools/tester/ is two levels below the repo root.
      const root = path.resolve(config.root, '../..')
      process.env.DAX3_REPO_ROOT = root
    },
  }
}
