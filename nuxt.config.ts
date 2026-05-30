import packageJson from './package.json' with { type: 'json' };

export default defineNuxtConfig({
  compatibilityDate: '2026-03-20',
  devtools: {
    enabled: true,
  },
  sourcemap: false,
  vite: {
    build: {
      modulePreload: {
        polyfill: false,
      },
    },
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'LexiFormosa',
      meta: [
        {
          name: 'description',
          content:
            '臺灣で使われる繁體字の単語を、日本語4択でテンポ良く学べるローカル向けトレーニングゲーム。',
        },
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: 'apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '120x120', href: 'apple-touch-icon-120x120.png' },
      ],
    },
  },
  typescript: {
    strict: true,
  },
  runtimeConfig: {
    public: {
      appVersion: packageJson.version,
    },
  },
});
