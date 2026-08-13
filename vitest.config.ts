import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        overrides: {
          // @nuxt/test-utils のテスト用ビルドで発生する NUXT_B7021 を避ける。
          // アプリ本体の Nuxt 5 互換モードは nuxt.config.ts で維持する。
          experimental: {
            viteEnvironmentApi: false,
          },
        },
      },
    },
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
        'app/app.vue',
        'app/assets/**',
      ],
    },
  },
});
