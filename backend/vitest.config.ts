import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/.aws-sam/**', '**/node_modules/**', '**/dist/**'],
  },
});
