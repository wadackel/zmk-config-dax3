import tailwindcss from '@tailwindcss/vite'
import honox from 'honox/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    honox({
      client: { input: ['/app/client.ts', '/app/style.css'] }
    }),
    tailwindcss(),
  ]
})
