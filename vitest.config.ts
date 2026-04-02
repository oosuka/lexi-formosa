import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    globals: true,
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'json-summary'],
      exclude: [
        'tests/**',
        '**/*.config.*',
        '**/*.d.ts',
        '.nuxt/**',
        '.output/**',
        'coverage/**',
        'package.json',
        'app.vue',
        'assets/**',
      ],
    },
  },
});
