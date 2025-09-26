# ProtoThrive Frontend: Accessibility & Internationalization Implementation Guide

## Overview

This document outlines the complete implementation of WCAG AA accessibility standards and internationalization (i18n) for the ProtoThrive frontend, including semantic HTML, ARIA attributes, keyboard navigation, responsive design, and multi-language support.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install next-i18next react-i18next i18next
```

### 2. Update Configuration Files

**next.config.js** - Add i18n configuration:
```javascript
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  i18n,
  // ... rest of config
};
```

### 3. Replace Components

Replace your existing components with the new accessible versions:

- Use `HeroSectionAccessible.tsx` instead of basic hero sections
- Use `ResponsiveNav.tsx` for navigation
- Use `_app.enhanced.tsx` for the main app wrapper

## 🎯 Key Features Implemented

### ✅ Semantic HTML & ARIA Attributes

**Components Updated:**
- `HeroSectionAccessible.tsx`: Proper heading hierarchy, semantic sections, ARIA labels
- `ResponsiveNav.tsx`: Navigation landmarks, proper focus management
- `Spline3DAccessibility.tsx`: 3D component with screen reader support

**Key Improvements:**
```html
<!-- Before -->
<div>Some content</div>

<!-- After -->
<section aria-labelledby="hero-heading" role="region">
  <h1 id="hero-heading">...</h1>
</section>
```

### ✅ Keyboard Navigation

**Features:**
- Tab navigation through all interactive elements
- Arrow key navigation in menus
- Escape key to close modals/dropdowns
- Enter/Space to activate buttons
- Home/End for quick navigation

**Implementation in ResponsiveNav.tsx:**
- Focus trapping in mobile menu
- Keyboard shortcuts (Alt+L for language selector)
- ARIA expanded/collapsed states

### ✅ WCAG AA Color Contrast

**New Color System:**
- All colors meet 4.5:1 contrast ratio (normal text)
- Large text meets 3:1 contrast ratio
- High contrast mode support
- CSS custom properties for consistency

**File:** `wcag-colors.css`
- Primary: `#3b82f6` (4.5:1 contrast on dark)
- Error: `#ef4444` (4.5:1 contrast on dark)
- Success: `#10b981` (4.5:1 contrast on dark)

### ✅ Internationalization (i18n)

**Supported Languages:**
- English (en) - Default
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)
- Chinese (zh)

**Translation Files Structure:**
```
public/locales/
├── en/
│   ├── common.json
│   └── landing.json
├── es/
│   ├── common.json
│   └── landing.json
└── [other-languages]/
```

**Usage in Components:**
```tsx
import { useTranslation } from 'next-i18next';

const { t } = useTranslation('landing');
return <h1>{t('hero.title')}</h1>;
```

### ✅ Responsive Design

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Features:**
- Mobile-first CSS
- Hamburger menu for mobile
- Touch-friendly tap targets (44px minimum)
- Flexible grid layouts

## 🔧 Implementation Steps

### Step 1: Component Integration

**Replace existing index.tsx:**
```tsx
import { HeroSectionAccessible } from '../components/HeroSectionAccessible';
import { ResponsiveNav } from '../components/ResponsiveNav';

export default function LandingPage() {
  return (
    <>
      <ResponsiveNav />
      <HeroSectionAccessible />
    </>
  );
}
```

### Step 2: Add Accessibility Styles

**Add to your main CSS file:**
```css
@import '../styles/wcag-colors.css';

/* Enable focus indicators */
.focus-visible:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
```

### Step 3: Setup i18n Pages

**Create getServerSideProps in your pages:**
```tsx
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'landing'])),
    },
  };
}
```

### Step 4: Update App Component

Replace `_app.tsx` with `_app.enhanced.tsx` or integrate the features:
- Error boundary
- Language selector
- Skip links
- Screen reader announcements

## 🧪 Testing Accessibility

### Automated Testing
```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/react axe-core

# Run accessibility linting
npm run lint:a11y
```

### Manual Testing Checklist

**Keyboard Navigation:**
- [ ] Tab through all interactive elements
- [ ] No keyboard traps
- [ ] Focus indicators visible
- [ ] Logical tab order

**Screen Reader Testing:**
- [ ] Test with NVDA (free)
- [ ] Test with JAWS
- [ ] All images have alt text
- [ ] Form labels properly associated

**Color Contrast:**
- [ ] Use WebAIM Contrast Checker
- [ ] Test in high contrast mode
- [ ] Ensure information isn't conveyed by color alone

**Mobile Testing:**
- [ ] Touch targets ≥ 44px
- [ ] Content reflows properly
- [ ] No horizontal scrolling

## 📋 Translation Workflow

### Adding New Languages

1. **Create locale directory:**
```bash
mkdir public/locales/[locale-code]
```

2. **Copy translation files:**
```bash
cp public/locales/en/* public/locales/[locale-code]/
```

3. **Update next-i18next.config.js:**
```javascript
module.exports = {
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'ja', 'zh', 'new-locale'],
    // ...
  }
};
```

### Translation Keys Structure
```json
{
  "hero": {
    "title": "Main heading",
    "subtitle": "Supporting text",
    "cta": "Call to action button"
  },
  "nav": {
    "home": "Home",
    "about": "About"
  }
}
```

## 🎨 Design System Integration

### CSS Custom Properties

All components use CSS custom properties for theming:
```css
.component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
```

### Component Props for Accessibility
```tsx
interface ComponentProps {
  // Standard props
  className?: string;

  // Accessibility props
  ariaLabel?: string;
  ariaDescription?: string;
  role?: string;
  tabIndex?: number;

  // i18n props
  locale?: string;
}
```

## 🚀 Performance Considerations

### Code Splitting
- Translations loaded only for active locale
- Components lazy-loaded where appropriate
- Next.js automatic code splitting

### Bundle Size
- Tree-shaking enabled for i18n
- Only import needed translation namespaces
- Optimize font loading

## 📊 Browser Support

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Accessibility Features:**
- Screen readers: NVDA, JAWS, VoiceOver
- High contrast mode
- Reduced motion preferences
- Keyboard-only navigation

## 🔍 Maintenance

### Regular Audits
- Run Lighthouse accessibility audits
- Test with screen readers monthly
- Validate WCAG compliance quarterly
- Update translations as needed

### Monitoring
- Track accessibility metrics
- Monitor user feedback
- Performance impact assessment
- Translation completeness

## 🤝 Contributing

### Accessibility Guidelines
1. Always include ARIA labels
2. Test keyboard navigation
3. Verify color contrast
4. Include focus indicators
5. Test with screen readers

### i18n Guidelines
1. Use semantic translation keys
2. Avoid hardcoded strings
3. Test RTL languages if supported
4. Include context for translators
5. Regular translation reviews

---

This implementation provides a solid foundation for accessible, internationalized frontend components that meet WCAG AA standards while maintaining excellent user experience across all devices and languages.