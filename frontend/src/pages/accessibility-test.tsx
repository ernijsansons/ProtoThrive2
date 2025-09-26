import React from 'react';
import { HeroSectionAccessible } from '../components/HeroSectionAccessible';
import { ResponsiveNav } from '../components/ResponsiveNav';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function AccessibilityTest() {
  return (
    <div className="min-h-screen bg-gradient-dark text-text-primary">
      <ResponsiveNav isAuthenticated={false} />
      <HeroSectionAccessible />

      <section className="p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-high-contrast">
          Accessibility Features Test
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-primary-light">
              WCAG AA Compliance
            </h3>
            <ul className="space-y-2 text-medium-contrast">
              <li>✅ Color contrast ratios meet 4.5:1 standard</li>
              <li>✅ Semantic HTML elements (nav, section, article)</li>
              <li>✅ ARIA labels and descriptions</li>
              <li>✅ Keyboard navigation support</li>
              <li>✅ Screen reader announcements</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-primary-light">
              Internationalization
            </h3>
            <ul className="space-y-2 text-medium-contrast">
              <li>✅ 6 language support (EN, ES, FR, DE, JA, ZH)</li>
              <li>✅ Language selector (top-right)</li>
              <li>✅ Translation key structure</li>
              <li>✅ RTL language preparation</li>
              <li>✅ Dynamic language switching</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-primary-light">
              Responsive Design
            </h3>
            <ul className="space-y-2 text-medium-contrast">
              <li>✅ Mobile-first CSS approach</li>
              <li>✅ Touch targets ≥44px</li>
              <li>✅ Hamburger menu for mobile</li>
              <li>✅ Flexible grid layouts</li>
              <li>✅ Viewport-responsive text sizing</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-primary-light">
              Keyboard Shortcuts
            </h3>
            <ul className="space-y-2 text-medium-contrast">
              <li><kbd className="bg-gray-700 px-2 py-1 rounded">Alt + L</kbd> Language selector</li>
              <li><kbd className="bg-gray-700 px-2 py-1 rounded">Alt + H</kbd> Help/shortcuts</li>
              <li><kbd className="bg-gray-700 px-2 py-1 rounded">Tab</kbd> Navigate elements</li>
              <li><kbd className="bg-gray-700 px-2 py-1 rounded">Space/Enter</kbd> Activate buttons</li>
              <li><kbd className="bg-gray-700 px-2 py-1 rounded">Escape</kbd> Close dialogs</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h3 className="text-xl font-semibold mb-3 text-blue-300">
            Testing Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Test keyboard navigation by pressing Tab to move through elements</li>
            <li>Use Alt + L to open the language selector and switch languages</li>
            <li>Test screen reader compatibility with NVDA or similar tools</li>
            <li>Verify color contrast in high contrast mode</li>
            <li>Test mobile responsiveness by resizing the viewport</li>
            <li>Check focus indicators are visible when using keyboard navigation</li>
          </ol>
        </div>
      </section>
    </div>
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'landing'])),
    },
  };
}