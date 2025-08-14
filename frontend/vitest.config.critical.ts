import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      // Tests críticos que DEBEN pasar
      'src/hooks/__tests__/useAutoSave.test.tsx',
      'src/hooks/__tests__/useAuth.test.tsx', 
      'src/hooks/__tests__/useWizardNavigation.test.tsx',
      'src/__tests__/e2e/organization-flow.test.tsx',
    ],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/**/*.d.ts',
        'src/**/__tests__/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})