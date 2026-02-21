import ssg from '@hono/vite-ssg'
import tailwindcss from '@tailwindcss/vite'
import honox from 'honox/vite'
import { defineConfig } from 'vite'
import { zmkLayout } from './codegen/vite-plugin'

const entry = './app/server.ts'

export default defineConfig(({ mode }) => {
  const base = process.env.BASE_PATH || '/'

  if (mode === 'client') {
    return {
      base,
      plugins: [
        zmkLayout(),
        honox({
          client: { input: ['/app/client.ts', '/app/style.css'] },
          // Prevent @hono/vite-dev-server from overriding Vite's base option
          devServer: { base: undefined },
        }),
        tailwindcss(),
      ],
    }
  }

  return {
    base,
    build: { emptyOutDir: false },
    plugins: [
      zmkLayout(),
      honox({
        // Prevent @hono/vite-dev-server from overriding Vite's base option
        devServer: { base: undefined },
      }),
      tailwindcss(),
      ssg({ entry }),
    ],
  }
})
