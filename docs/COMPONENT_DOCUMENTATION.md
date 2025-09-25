# ProtoThrive Component Documentation

## Overview
ProtoThrive uses a component-based architecture built on Next.js 15, TypeScript, Tailwind CSS, and Zustand for state management. All components follow accessibility standards and support both light and dark themes.

## State Management (store.ts)

### Zustand Store
The global application state is managed using Zustand, providing a simple and efficient state management solution.

```typescript
import { useStore } from '../store';

const MyComponent = () => {
  const { nodes, edges, thriveScore, toggleMode } = useStore();
  return <div>...</div>;
};
```

### Interfaces

#### Node
Represents a roadmap node with position and status information.

```typescript
interface Node {
  id: string;                    // Unique identifier
  label: string;                 // Display label
  status: 'gray' | 'neon' | 'success' | 'error';  // Visual status
  position: {                    // 3D position coordinates
    x: number;
    y: number;
    z: number;
  };
  metadata?: {                   // Optional metadata
    description?: string;
    progress?: number;
    lastUpdated?: Date;
  };
}
```

**Status Values:**
- `gray`: Inactive/pending state
- `neon`: Active/high priority (glowing effect)
- `success`: Successfully completed
- `error`: Failed/requires attention

#### Edge
Represents connections between nodes.

```typescript
interface Edge {
  from: string;                  // Source node ID
  to: string;                    // Target node ID
  weight?: number;               // Connection strength (optional)
  type?: 'dependency' | 'flow' | 'relationship';  // Connection type
}
```

### Store Actions

```typescript
// Load new graph data
loadGraph: (nodes: Node[], edges: Edge[]) => void;

// Toggle between 2D and 3D view modes
toggleMode: () => void;

// Update the thrive score (0-1 range)
updateScore: (score: number) => void;
```

### Example Usage

```typescript
import { useStore } from '../store';

const RoadmapComponent = () => {
  const { nodes, loadGraph, toggleMode, thriveScore } = useStore();

  const loadExampleData = () => {
    const exampleNodes: Node[] = [
      {
        id: 'planning',
        label: 'Planning Phase',
        status: 'neon',
        position: { x: 0, y: 0, z: 0 }
      },
      {
        id: 'development',
        label: 'Development',
        status: 'gray',
        position: { x: 200, y: 100, z: 0 }
      }
    ];

    const exampleEdges: Edge[] = [
      { from: 'planning', to: 'development', type: 'dependency' }
    ];

    loadGraph(exampleNodes, exampleEdges);
  };

  return (
    <div>
      <button onClick={loadExampleData}>Load Example</button>
      <button onClick={toggleMode}>Toggle View</button>
      <p>Thrive Score: {(thriveScore * 100).toFixed(1)}%</p>
    </div>
  );
};
```

## Core Components

### MagicCanvas

The primary visualization component that displays roadmap nodes and connections in both 2D and 3D modes.

**File:** `src/components/MagicCanvas.tsx`

#### Props

```typescript
interface CanvasProps {
  className?: string;           // Additional CSS classes
  'aria-label'?: string;       // Accessibility label
}
```

#### Features

- **Dual Mode Visualization**: Seamlessly switch between 2D and 3D views
- **Interactive Nodes**: Click to select and inspect nodes
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Adapts to different screen sizes
- **Status Colors**: Visual indicators for node states
- **Expandable View**: Toggle between normal and fullscreen modes

#### Usage

```typescript
import MagicCanvas from '../components/MagicCanvas';

const Dashboard = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MagicCanvas 
        className="col-span-1 lg:col-span-2" 
        aria-label="Interactive project roadmap visualization"
      />
    </div>
  );
};
```

#### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Select nodes
- **Escape**: Clear selection

#### CSS Classes

The component uses several Tailwind CSS utility classes and custom classes:

```css
/* Node status colors */
.bg-neon-cyan { background-color: #00ffff; }
.border-neon-cyan { border-color: #00ffff; }
.shadow-neon { box-shadow: 0 0 10px #00ffff; }

/* Focus styles */
.focus-ring:focus {
  outline: none;
  ring: 2px;
  ring-color: #3b82f6;
  ring-offset: 2px;
}
```

### InsightsPanel

Displays analytics, thrive score, and project statistics with animated progress indicators.

**File:** `src/components/InsightsPanel.tsx`

#### Props

```typescript
interface InsightsPanelProps {
  className?: string;           // Additional CSS classes
  compact?: boolean;           // Use compact layout
}
```

#### Features

- **Animated Thrive Score**: Smooth transitions between score updates
- **Trend Indicators**: Shows if score is increasing, decreasing, or stable
- **Node Statistics**: Counts of total, active, completed, and error nodes
- **Responsive Layout**: Compact mode for smaller spaces
- **Accessibility**: ARIA labels and progress indicators
- **Real-time Updates**: Live data indicator

#### Usage

```typescript
import InsightsPanel from '../components/InsightsPanel';

const Dashboard = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Full panel */}
      <InsightsPanel className="lg:col-span-2" />
      
      {/* Compact panel */}
      <InsightsPanel compact={true} />
    </div>
  );
};
```

#### Score Calculation

The thrive score is calculated using the following algorithm:

```typescript
// From backend/utils/db.ts
function calculateThriveScore(logs: AgentLog[]): number {
  const completion = (successLogs.length / logs.length) * 0.6;
  const uiPolish = (uiLogs.length / logs.length) * 0.3;
  const risk = (1 - (failLogs.length / logs.length)) * 0.1;
  
  return completion + uiPolish + risk; // 0.0 - 1.0
}
```

#### Score Ranges

- **0.8-1.0**: Excellent (green, neon glow)
- **0.6-0.8**: Good (blue)
- **0.4-0.6**: Fair (orange/yellow)
- **0.0-0.4**: Needs Attention (red)

### Component Architecture

#### File Structure

```
src/
├── components/
│   ├── MagicCanvas.tsx           # Main visualization
│   ├── InsightsPanel.tsx         # Analytics panel
│   ├── canvas/
│   │   ├── CustomNode.tsx        # Individual node component
│   │   └── TemplateLibrary.tsx   # Reusable templates
│   └── ui/                       # UI primitives
│       ├── button.tsx
│       ├── input.tsx
│       ├── tabs.tsx
│       └── toast.tsx
├── store.ts                      # Zustand state management
└── utils/
    └── mocks.ts                  # Mock data for development
```

## UI Components Library

### Button Component

**File:** `src/components/ui/button.tsx`

```typescript
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  ...props 
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'btn focus-ring transition-colors duration-200',
        {
          'bg-primary-600 text-white hover:bg-primary-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'bg-transparent hover:bg-gray-100': variant === 'ghost',
          'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
};

export { Button };
```

### Input Component

**File:** `src/components/ui/input.tsx`

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Input = ({ label, error, helper, className, ...props }: InputProps) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-3 py-2 border rounded-md focus-ring',
          error 
            ? 'border-red-500 text-red-900 focus:border-red-500' 
            : 'border-gray-300 focus:border-blue-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
};
```

## Styling and Theming

### Tailwind Configuration

**File:** `tailwind.config.js`

```javascript
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        'neon-cyan': '#00ffff',
        success: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      boxShadow: {
        'neon': '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff',
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
};
```

### CSS Custom Classes

**File:** `src/styles/globals.css`

```css
/* Utility classes */
.btn {
  @apply inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium;
}

.card-dark {
  @apply bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg;
}

.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800;
}

.neon-text {
  @apply text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-blue-400;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #374151;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: #374151;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #4b5563;
  border-radius: 3px;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Testing Components

### Test Setup

**File:** `src/setupTests.ts`

```typescript
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock Zustand store for testing
jest.mock('./store', () => ({
  useStore: jest.fn(() => ({
    nodes: [
      { id: 'test-node', label: 'Test Node', status: 'gray', position: { x: 0, y: 0, z: 0 } }
    ],
    edges: [],
    mode: '2d',
    thriveScore: 0.5,
    loadGraph: jest.fn(),
    toggleMode: jest.fn(),
    updateScore: jest.fn()
  }))
}));
```

### Component Tests

**File:** `tests/magic.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MagicCanvas from '../src/components/MagicCanvas';

describe('MagicCanvas', () => {
  test('renders canvas with nodes', () => {
    render(<MagicCanvas />);
    
    expect(screen.getByRole('application')).toBeInTheDocument();
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  test('toggles mode on button click', () => {
    const mockToggleMode = jest.fn();
    
    render(<MagicCanvas />);
    
    const toggleButton = screen.getByLabelText(/switch to 3d view/i);
    fireEvent.click(toggleButton);
    
    expect(mockToggleMode).toHaveBeenCalled();
  });

  test('supports keyboard navigation', () => {
    render(<MagicCanvas />);
    
    const nodeElement = screen.getByRole('listitem');
    
    // Test keyboard interaction
    fireEvent.keyDown(nodeElement, { key: 'Enter' });
    expect(nodeElement).toHaveAttribute('aria-selected', 'true');
  });
});
```

## Development Guidelines

### Component Checklist

When creating new components:

- [ ] Include TypeScript interfaces for all props
- [ ] Add accessibility attributes (ARIA labels, roles)
- [ ] Support keyboard navigation where applicable
- [ ] Include responsive design classes
- [ ] Add loading and error states
- [ ] Write unit tests
- [ ] Document props and usage examples
- [ ] Follow naming conventions
- [ ] Use Tailwind CSS classes consistently
- [ ] Include dark mode support

### Performance Best Practices

1. **Memoization**: Use `useMemo` and `useCallback` for expensive calculations
2. **Lazy Loading**: Import components dynamically where possible
3. **Bundle Optimization**: Tree shake unused dependencies
4. **State Updates**: Batch state updates to reduce re-renders

```typescript
// Good: Memoized calculations
const nodeStats = useMemo(() => {
  return nodes.reduce((acc, node) => {
    acc[node.status] = (acc[node.status] || 0) + 1;
    return acc;
  }, {});
}, [nodes]);

// Good: Debounced updates
const debouncedUpdateScore = useCallback(
  debounce((score) => updateScore(score), 300),
  [updateScore]
);
```

### Accessibility Standards

All components follow WCAG 2.1 AA guidelines:

- Semantic HTML elements
- Proper heading hierarchy
- Focus management
- Color contrast ratios > 4.5:1
- Screen reader compatible
- Keyboard navigation support

## Integration Examples

### Using Components Together

```typescript
import MagicCanvas from '../components/MagicCanvas';
import InsightsPanel from '../components/InsightsPanel';
import { useStore } from '../store';

const ProjectDashboard = () => {
  const { loadGraph } = useStore();

  useEffect(() => {
    // Load project data on mount
    fetchProjectData().then(data => {
      loadGraph(data.nodes, data.edges);
    });
  }, [loadGraph]);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white">Project Dashboard</h1>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <MagicCanvas className="lg:col-span-3" />
          <InsightsPanel className="lg:col-span-1" />
        </div>
      </div>
    </div>
  );
};
```

This documentation provides comprehensive guidance for using, extending, and maintaining ProtoThrive components.