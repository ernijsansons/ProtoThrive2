/**
 * Accessibility Utilities for ProtoThrive Frontend
 * WCAG AA compliant helper functions and utilities
 */

// Screen reader announcer utility
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private politeElement: HTMLElement | null = null;
  private assertiveElement: HTMLElement | null = null;

  private constructor() {
    this.createAnnouncers();
  }

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  private createAnnouncers() {
    if (typeof window === 'undefined') return;

    // Create polite announcer
    this.politeElement = document.createElement('div');
    this.politeElement.setAttribute('aria-live', 'polite');
    this.politeElement.setAttribute('aria-atomic', 'true');
    this.politeElement.className = 'sr-only';
    this.politeElement.id = 'sr-announcer-polite';
    document.body.appendChild(this.politeElement);

    // Create assertive announcer
    this.assertiveElement = document.createElement('div');
    this.assertiveElement.setAttribute('aria-live', 'assertive');
    this.assertiveElement.setAttribute('aria-atomic', 'true');
    this.assertiveElement.className = 'sr-only';
    this.assertiveElement.id = 'sr-announcer-assertive';
    document.body.appendChild(this.assertiveElement);
  }

  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcer = ScreenReaderAnnouncer.getInstance();
    const element = priority === 'assertive' ? announcer.assertiveElement : announcer.politeElement;

    if (element) {
      element.textContent = '';
      // Use setTimeout to ensure the element is cleared first
      setTimeout(() => {
        if (element) element.textContent = message;
      }, 100);
    }
  }

  static clear() {
    const announcer = ScreenReaderAnnouncer.getInstance();
    if (announcer.politeElement) announcer.politeElement.textContent = '';
    if (announcer.assertiveElement) announcer.assertiveElement.textContent = '';
  }
}

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = [];

  static saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement);
    }
  }

  static restoreFocus(): void {
    const elementToFocus = this.focusStack.pop();
    if (elementToFocus && document.contains(elementToFocus)) {
      elementToFocus.focus();
    }
  }

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input[type="text"]:not([disabled])',
      'input[type="email"]:not([disabled])',
      'input[type="password"]:not([disabled])',
      'input[type="search"]:not([disabled])',
      'input[type="url"]:not([disabled])',
      'input[type="number"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      'input[type="radio"]:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
  }

  static setFocusableTabIndex(elements: HTMLElement[], tabIndex: number = -1): void {
    elements.forEach(element => {
      element.tabIndex = tabIndex;
    });
  }
}

// Utility to generate unique IDs for form labels
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}