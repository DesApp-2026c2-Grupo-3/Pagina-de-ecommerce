/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      include: ['src/**'],
      exclude: [
        'src/test/**',      // ayudantes y datos de las pruebas
        'src/main.tsx',     // arranque de la app
        'src/App.tsx',
        'src/pages/**',     // pantallas: se validan con pruebas manuales de punta a punta
        'src/routes/**',
        'src/services/**',  // llamadas HTTP al backend
        'src/types/**',
        'src/**/*.d.ts',
      ],
    },
  },
})
