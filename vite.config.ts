import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [preact(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // claude-opus-5: Vitest's default include also matches e2e/*.spec.ts. Those are Playwright
    // specs and must not be collected here.
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
