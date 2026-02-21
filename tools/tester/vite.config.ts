import tailwindcss from '@tailwindcss/vite'
import honox from 'honox/vite'
import { defineConfig } from 'vite'
import { zmkLayout } from './codegen/vite-plugin'

export default defineConfig({
  plugins: [
    zmkLayout(),
    honox({
      client: { input: ['/app/client.ts', '/app/style.css'] }
    }),
    tailwindcss(),
  ]
})
