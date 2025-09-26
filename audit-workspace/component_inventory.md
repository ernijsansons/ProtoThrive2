# ProtoThrive Component Inventory & Design System

**Version:** 1.0  
**Date:** September 25, 2025  
**Status:** Specification (Application currently non-functional)

---

## Component Inventory Overview

### Current State
- **Components Detected:** 0 (Application not rendering)
- **Design System:** Not implemented
- **Component Library:** Not found
- **Consistency Score:** N/A

### Target State
- **Estimated Components Needed:** 45-50
- **Design System:** Token-based with Tailwind/CSS-in-JS
- **Component Library:** React-based, TypeScript, Storybook documented
- **Target Consistency:** 100%

---

## Core Components Specification

### 1. Button Component

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  state: 'default' | 'hover' | 'active' | 'disabled' | 'loading';
  fullWidth?: boolean;
  icon?: IconType;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}
```

**Visual Specifications:**
| Variant | Background | Text | Border | Hover | Active |
|---------|------------|------|--------|-------|--------|
| Primary | #007AFF | #FFFFFF | none | #0051D5 | #0041A8 |
| Secondary | #F2F2F7 | #007AFF | #E5E5EA | #E5E5EA | #D1D1D6 |
| Ghost | transparent | #007AFF | none | rgba(0,122,255,0.1) | rgba(0,122,255,0.2) |
| Danger | #FF3B30 | #FFFFFF | none | #D70015 | #C60013 |
| Success | #34C759 | #FFFFFF | none | #28A745 | #1E7E34 |

**Size Specifications:**
| Size | Height | Padding X | Font Size | Border Radius |
|------|--------|-----------|-----------|---------------|
| xs | 24px | 8px | 12px | 4px |
| sm | 32px | 12px | 14px | 6px |
| md | 40px | 16px | 16px | 8px |
| lg | 48px | 20px | 18px | 10px |
| xl | 56px | 24px | 20px | 12px |

---

### 2. Input Component

```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date';
  size: 'sm' | 'md' | 'lg';
  state: 'default' | 'focus' | 'error' | 'success' | 'disabled';
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  required?: boolean;
  icon?: IconType;
  value: string;
  onChange: (value: string) => void;
}
```

**Visual Specifications:**
| State | Border Color | Background | Text Color | Icon Color |
|-------|--------------|------------|------------|------------|
| Default | #E5E5EA | #FFFFFF | #1C1C1E | #8E8E93 |
| Focus | #007AFF | #FFFFFF | #1C1C1E | #007AFF |
| Error | #FF3B30 | #FFF5F5 | #1C1C1E | #FF3B30 |
| Success | #34C759 | #F5FFF7 | #1C1C1E | #34C759 |
| Disabled | #C7C7CC | #F2F2F7 | #8E8E93 | #8E8E93 |

---

### 3. Card Component

```typescript
interface CardProps {
  variant: 'default' | 'elevated' | 'outlined' | 'interactive';
  padding: 'none' | 'sm' | 'md' | 'lg';
  header?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}
```

**Specifications:**
- **Default:** Background #FFFFFF, no border, no shadow
- **Elevated:** Shadow-md (0 4px 6px rgba(0,0,0,0.1))
- **Outlined:** Border 1px solid #E5E5EA
- **Interactive:** Hover state with transform scale(1.02)

---

### 4. Modal Component

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  title?: string;
  closeButton?: boolean;
  backdrop?: 'static' | 'clickable' | 'transparent';
  position?: 'center' | 'top' | 'bottom';
  animation?: 'fade' | 'slide' | 'zoom';
}
```

**Size Specifications:**
| Size | Width | Max Height |
|------|-------|------------|
| sm | 400px | 90vh |
| md | 600px | 90vh |
| lg | 800px | 90vh |
| xl | 1140px | 90vh |
| fullscreen | 100vw | 100vh |

---

### 5. Navigation Component

```typescript
interface NavigationProps {
  variant: 'header' | 'sidebar' | 'tabs' | 'breadcrumb';
  items: NavigationItem[];
  activeItem?: string;
  sticky?: boolean;
  collapsible?: boolean;
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
}

interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: IconType;
  badge?: string | number;
  children?: NavigationItem[];
}
```

---

### 6. Form Component

```typescript
interface FormProps {
  onSubmit: (values: Record<string, any>) => void;
  validation?: ValidationSchema;
  layout: 'vertical' | 'horizontal' | 'inline';
  spacing: 'compact' | 'normal' | 'relaxed';
  showRequiredIndicator?: boolean;
}
```

---

### 7. Table Component

```typescript
interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortable?: boolean;
  filterable?: boolean;
  pagination?: PaginationConfig;
  selectable?: boolean;
  expandable?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}
```

---

### 8. Toast/Notification Component

```typescript
interface ToastProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

### 9. Loading States

```typescript
interface LoadingProps {
  variant: 'spinner' | 'skeleton' | 'progress' | 'dots';
  size: 'sm' | 'md' | 'lg';
  text?: string;
  fullscreen?: boolean;
}
```

**Skeleton Specifications:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### 10. Accordion Component

```typescript
interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  variant: 'default' | 'bordered' | 'separated';
}

interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  icon?: IconType;
  disabled?: boolean;
}
```

---

## Design Token System

### Color Tokens

```scss
// Primary Palette
$color-primary-50: #E3F2FF;
$color-primary-100: #BAE0FF;
$color-primary-200: #8CCBFF;
$color-primary-300: #5EB5FF;
$color-primary-400: #3BA5FF;
$color-primary-500: #007AFF; // Base
$color-primary-600: #0066DB;
$color-primary-700: #0052B7;
$color-primary-800: #003F93;
$color-primary-900: #002A6F;

// Neutral Palette
$color-neutral-0: #FFFFFF;
$color-neutral-50: #FAFAFA;
$color-neutral-100: #F5F5F5;
$color-neutral-200: #E5E5E5;
$color-neutral-300: #D4D4D4;
$color-neutral-400: #A3A3A3;
$color-neutral-500: #737373;
$color-neutral-600: #525252;
$color-neutral-700: #404040;
$color-neutral-800: #262626;
$color-neutral-900: #171717;

// Semantic Colors
$color-success: #34C759;
$color-warning: #FF9500;
$color-danger: #FF3B30;
$color-info: #5856D6;

// Functional Colors
$color-background: $color-neutral-0;
$color-surface: $color-neutral-50;
$color-border: $color-neutral-200;
$color-text-primary: $color-neutral-900;
$color-text-secondary: $color-neutral-600;
$color-text-disabled: $color-neutral-400;
```

### Typography Tokens

```scss
// Font Families
$font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
$font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', monospace;

// Font Sizes
$font-size-xs: 0.75rem;    // 12px
$font-size-sm: 0.875rem;   // 14px
$font-size-base: 1rem;     // 16px
$font-size-lg: 1.125rem;   // 18px
$font-size-xl: 1.25rem;    // 20px
$font-size-2xl: 1.5rem;    // 24px
$font-size-3xl: 1.875rem;  // 30px
$font-size-4xl: 2.25rem;   // 36px
$font-size-5xl: 3rem;      // 48px

// Font Weights
$font-weight-light: 300;
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

// Line Heights
$line-height-tight: 1.25;
$line-height-normal: 1.5;
$line-height-relaxed: 1.75;
$line-height-loose: 2;

// Letter Spacing
$letter-spacing-tight: -0.025em;
$letter-spacing-normal: 0;
$letter-spacing-wide: 0.025em;
$letter-spacing-wider: 0.05em;
```

### Spacing Tokens

```scss
$spacing-0: 0;          // 0px
$spacing-0-5: 0.125rem; // 2px
$spacing-1: 0.25rem;    // 4px
$spacing-2: 0.5rem;     // 8px
$spacing-3: 0.75rem;    // 12px
$spacing-4: 1rem;       // 16px
$spacing-5: 1.25rem;    // 20px
$spacing-6: 1.5rem;     // 24px
$spacing-8: 2rem;       // 32px
$spacing-10: 2.5rem;    // 40px
$spacing-12: 3rem;      // 48px
$spacing-16: 4rem;      // 64px
$spacing-20: 5rem;      // 80px
$spacing-24: 6rem;      // 96px
```

### Animation Tokens

```scss
// Durations
$duration-instant: 0ms;
$duration-fast: 150ms;
$duration-normal: 250ms;
$duration-slow: 350ms;
$duration-slower: 500ms;

// Easings
$easing-linear: linear;
$easing-in: cubic-bezier(0.4, 0, 1, 1);
$easing-out: cubic-bezier(0, 0, 0.2, 1);
$easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);
$easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Shadow Tokens

```scss
$shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.075);
$shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
$shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
$shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);
$shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);
```

### Border Radius Tokens

```scss
$radius-none: 0;
$radius-xs: 0.125rem;  // 2px
$radius-sm: 0.25rem;   // 4px
$radius-md: 0.5rem;    // 8px
$radius-lg: 0.75rem;   // 12px
$radius-xl: 1rem;      // 16px
$radius-2xl: 1.5rem;   // 24px
$radius-full: 9999px;
```

---

## Component Usage Matrix

| Component | Homepage | Dashboard | Forms | Settings | Profile |
|-----------|----------|-----------|-------|----------|---------|
| Button | ✅ (5-8) | ✅ (10-15) | ✅ (2-4) | ✅ (3-5) | ✅ (2-3) |
| Input | ✅ (1-2) | ✅ (3-5) | ✅ (5-10) | ✅ (8-12) | ✅ (5-7) |
| Card | ✅ (3-6) | ✅ (4-8) | ❌ | ✅ (2-4) | ✅ (3-4) |
| Modal | ✅ (1-2) | ✅ (2-3) | ✅ (1-2) | ✅ (1-2) | ✅ (1) |
| Navigation | ✅ (1) | ✅ (1) | ✅ (1) | ✅ (1) | ✅ (1) |
| Table | ❌ | ✅ (1-2) | ❌ | ✅ (1) | ✅ (1) |
| Toast | ✅ | ✅ | ✅ | ✅ | ✅ |
| Loading | ✅ | ✅ | ✅ | ✅ | ✅ |
| Accordion | ✅ (1) | ❌ | ❌ | ✅ (2-3) | ❌ |
| Tabs | ❌ | ✅ (1) | ❌ | ✅ (1) | ✅ (1) |

---

## Implementation Priority

### Phase 1: Core Components (Week 1)
1. Button
2. Input
3. Card
4. Loading States
5. Typography System

### Phase 2: Interactive Components (Week 2)
1. Modal
2. Navigation
3. Form
4. Toast/Notifications
5. Dropdown/Select

### Phase 3: Data Components (Week 3)
1. Table
2. Pagination
3. Accordion
4. Tabs
5. Badge/Tag

### Phase 4: Advanced Components (Week 4)
1. Date Picker
2. File Upload
3. Autocomplete
4. Slider/Range
5. Rich Text Editor

---

## Component Development Checklist

### For Each Component:
- [ ] TypeScript interface defined
- [ ] Props validation with PropTypes or TypeScript
- [ ] Accessibility attributes (ARIA)
- [ ] Keyboard navigation support
- [ ] Focus management
- [ ] Mobile responsive
- [ ] Dark mode support
- [ ] RTL support consideration
- [ ] Unit tests (>90% coverage)
- [ ] Storybook stories
- [ ] Documentation with examples
- [ ] Performance optimized (memo/lazy)
- [ ] Error boundaries where needed
- [ ] Loading states
- [ ] Empty states
- [ ] Animation/transition specs

---

## Storybook Structure

```
stories/
├── Introduction.stories.mdx
├── Foundations/
│   ├── Colors.stories.mdx
│   ├── Typography.stories.mdx
│   ├── Spacing.stories.mdx
│   └── Icons.stories.mdx
├── Components/
│   ├── Button/
│   │   ├── Button.stories.tsx
│   │   └── Button.mdx
│   ├── Input/
│   │   ├── Input.stories.tsx
│   │   └── Input.mdx
│   └── [other components]/
├── Patterns/
│   ├── Forms.stories.mdx
│   ├── Navigation.stories.mdx
│   └── DataDisplay.stories.mdx
└── Guidelines/
    ├── Accessibility.stories.mdx
    ├── Performance.stories.mdx
    └── BestPractices.stories.mdx
```

---

## Component Library Package Structure

```
packages/
├── ui-components/
│   ├── src/
│   │   ├── components/
│   │   ├── tokens/
│   │   ├── utils/
│   │   └── index.ts
│   ├── dist/
│   ├── package.json
│   └── tsconfig.json
├── icons/
│   ├── src/
│   ├── dist/
│   └── package.json
└── themes/
    ├── light/
    ├── dark/
    └── custom/
```

---

## Quality Metrics

### Component Quality Score
- **Accessibility:** 25% (WCAG AA compliance)
- **Performance:** 25% (Bundle size, render time)
- **Reusability:** 20% (Props flexibility, composition)
- **Documentation:** 15% (Stories, examples, API docs)
- **Testing:** 15% (Unit, integration, visual)

### Target Scores
- **Individual Component:** ≥85/100
- **Overall Library:** ≥90/100
- **Consistency Index:** 100%
- **Accessibility Score:** 100%
- **Test Coverage:** ≥95%

---

## Next Steps

1. **Immediate:** Create component library repository
2. **Week 1:** Implement Phase 1 components
3. **Week 2:** Set up Storybook and documentation
4. **Week 3:** Complete Phase 2 & 3 components
5. **Week 4:** Testing, optimization, and rollout
