module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
    localeDetection: false,
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  ns: ['common', 'landing', 'dashboard', 'features', 'auth', 'errors'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  saveMissing: false,
  missingKeyHandler: (lng, ns, key) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation: ${lng}/${ns}:${key}`);
    }
  },
};