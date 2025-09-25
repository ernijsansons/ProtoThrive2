// Interaction utilities for gesture and event handling

export interface GestureEvent {
  type: 'swipe' | 'pinch' | 'tap' | 'longpress';
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  duration?: number;
  target: EventTarget | null;
}

export interface SwipeConfig {
  minDistance: number;
  maxDuration: number;
  direction?: 'horizontal' | 'vertical' | 'all';
}

export interface PinchConfig {
  minScale: number;
  maxScale: number;
}

export class InteractionHandler {
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private startDistance = 0;

  constructor(
    private element: HTMLElement,
    private config: {
      swipe?: SwipeConfig;
      pinch?: PinchConfig;
      onGesture?: (event: GestureEvent) => void;
    }
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
  }

  private handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();

    if (event.touches.length === 2) {
      const touch2 = event.touches[1];
      this.startDistance = Math.hypot(
        touch2.clientX - touch.clientX,
        touch2.clientY - touch.clientY
      );
    }
  }

  private handleTouchMove(event: TouchEvent) {
    if (event.touches.length === 2 && this.config.pinch) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scale = currentDistance / this.startDistance;
      
      if (scale < this.config.pinch.minScale || scale > this.config.pinch.maxScale) {
        event.preventDefault();
      }
    }
  }

  private handleTouchEnd(event: TouchEvent) {
    if (event.changedTouches.length === 0) return;

    const touch = event.changedTouches[0];
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;
    const distance = Math.hypot(deltaX, deltaY);

    // Check for swipe gesture
    if (this.config.swipe && distance >= this.config.swipe.minDistance && duration <= this.config.swipe.maxDuration) {
      let direction: 'left' | 'right' | 'up' | 'down';
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      this.config.onGesture?.({
        type: 'swipe',
        direction,
        distance,
        duration,
        target: event.target,
      });
    }

    // Check for tap gesture
    if (distance < 10 && duration < 300) {
      this.config.onGesture?.({
        type: 'tap',
        duration,
        target: event.target,
      });
    }

    // Check for long press gesture
    if (distance < 10 && duration > 500) {
      this.config.onGesture?.({
        type: 'longpress',
        duration,
        target: event.target,
      });
    }
  }

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
  }
}

// Utility functions for testing interactions
export const simulateSwipe = (element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down', distance = 100) => {
  const startEvent = new TouchEvent('touchstart', {
    touches: [new Touch({
      identifier: 0,
      target: element,
      clientX: direction === 'left' ? distance : 0,
      clientY: direction === 'up' ? distance : 0,
    })],
  });

  const endEvent = new TouchEvent('touchend', {
    changedTouches: [new Touch({
      identifier: 0,
      target: element,
      clientX: direction === 'right' ? distance : 0,
      clientY: direction === 'down' ? distance : 0,
    })],
  });

  element.dispatchEvent(startEvent);
  setTimeout(() => element.dispatchEvent(endEvent), 100);
};

export const simulatePinch = (element: HTMLElement, scale: number) => {
  const startEvent = new TouchEvent('touchstart', {
    touches: [
      new Touch({
        identifier: 0,
        target: element,
        clientX: 50,
        clientY: 50,
      }),
      new Touch({
        identifier: 1,
        target: element,
        clientX: 150,
        clientY: 150,
      }),
    ],
  });

  const endEvent = new TouchEvent('touchend', {
    changedTouches: [
      new Touch({
        identifier: 0,
        target: element,
        clientX: 50,
        clientY: 50,
      }),
      new Touch({
        identifier: 1,
        target: element,
        clientX: 50 + (100 * scale),
        clientY: 50 + (100 * scale),
      }),
    ],
  });

  element.dispatchEvent(startEvent);
  setTimeout(() => element.dispatchEvent(endEvent), 200);
};

// Mock functions for testing
export const mockInteractionHandler = jest.fn();
export const mockGestureEvent = jest.fn();