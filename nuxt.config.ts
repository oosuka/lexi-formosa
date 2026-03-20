import packageJson from './package.json' with { type: 'json' };

export default defineNuxtConfig({
  compatibilityDate: '2026-03-20',
  devtools: {
    enabled: true,
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
