import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    globals: true,
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    setupFiles: ['./tests/setup.ts'],
  },
});
