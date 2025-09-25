/**
 * MagicCanvas - Fixed with UX/Accessibility improvements
 * Fortune-50 grade with ARIA, keyboard navigation, smooth animations
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  MarkerType
} from 'reactflow';
import { useStore } from '../store';
import { InputValidator } from '../utils/security';
import ReactFlowAccessibility from './ReactFlowAccessibility';
import Spline3DAccessibility from './Spline3DAccessibility';
import 'reactflow/dist/style.css';

// Lazy load Spline with preload hint
const Spline = React.lazy(() => {
  // Preload hint for better performance
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = process.env.NEXT_PUBLIC_SPLINE_SCENE || '';
  link.as = 'fetch';
  document.head.appendChild(link);
  
  return import('@splinetool/react-spline');
});

interface MagicCanvasProps {
  onNodeUpdate?: (nodeId: string, data: any) => void;
  onEdgeUpdate?: (edgeId: string, data: any) => void;
  className?: string;
}

// Memoized Node Component for performance
const NodeComponent = React.memo(({ node, onNodeUpdate, thriveScore }: any) => (
  <div
    className={`p-2 rounded transition-all duration-300 ${
      node.status === 'neon'
        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-neon'
        : 'bg-gray-700 text-gray-300'
    }`}
    role="button"
    tabIndex={0}
    aria-label={`Node: ${node.label}, Status: ${node.status}`}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onNodeUpdate?.(node.id, { selected: true });
      }
    }}
  >
    {InputValidator.sanitizeInput(node.label)}
  </div>
));

const MagicCanvas: React.FC<MagicCanvasProps> = ({ onNodeUpdate, onEdgeUpdate, className }) => {
  const { nodes: storeNodes, edges: storeEdges, mode, thriveScore } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Memoized node conversion for performance
  const rfNodes = useMemo((): Node[] => {
    return storeNodes.map(n => ({
      id: n.id,
      type: 'default',
      data: {
        label: <NodeComponent node={n} onNodeUpdate={onNodeUpdate} thriveScore={thriveScore} />
      },
      position: { x: n.position.x, y: n.position.y },
      style: {
        transition: 'all 0.3s ease-in-out'
      }
    }));
  }, [storeNodes, onNodeUpdate, thriveScore]);

  // Memoized edge conversion
  const rfEdges = useMemo((): Edge[] => {
    return storeEdges.map((e, idx) => ({
      id: `edge-${e.from}-${e.to}`,
      source: e.from,
      target: e.to,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: thriveScore > 0.5 ? '#00ffff' : '#666',
        strokeWidth: 2,
        transition: 'stroke 0.3s ease'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: thriveScore > 0.5 ? '#00ffff' : '#666'
      }
    }));
  }, [storeEdges, thriveScore]);

  // Update nodes and edges when data changes
  useEffect(() => {
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [rfNodes, rfEdges, setNodes, setEdges]);

  // Handle connection between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
      onEdgeUpdate?.(`edge-${params.source}-${params.target}`, params);
    },
    [setEdges, onEdgeUpdate]
  );

  // Intersection Observer for performance optimization
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (!canvasRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = new Set(visibleNodes);
        entries.forEach((entry) => {
          const nodeId = entry.target.getAttribute('data-node-id');
          if (nodeId) {
            if (entry.isIntersecting) {
              visible.add(nodeId);
            } else {
              visible.delete(nodeId);
            }
          }
        });
        setVisibleNodes(visible);
      },
      {
        root: canvasRef.current,
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    // Observe node elements
    const nodeElements = canvasRef.current.querySelectorAll('[data-node-id]');
    nodeElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [visibleNodes, rfNodes]);

  // Keyboard navigation with throttling
  const throttledKeyHandler = useCallback(
    throttle((e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        return;
      }

      if (e.key === 'Escape') {
        setNodes((nds) =>
          nds.map((n) => ({ ...n, selected: false }))
        );
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a') {
          e.preventDefault();
          setNodes((nds) =>
            nds.map((n) => ({ ...n, selected: true }))
          );
        }
      }
    }, 100),
    [setNodes]
  );

  useEffect(() => {
    document.addEventListener('keydown', throttledKeyHandler);
    return () => document.removeEventListener('keydown', throttledKeyHandler);
  }, [throttledKeyHandler]);

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

  // Error boundary for 3D crashes
  const handle3DError = () => {
    console.error('3D rendering error');
    setError('3D view temporarily unavailable. Switched to 2D mode.');
    useStore.setState({ mode: '2d' });
  };

  return (
    <div
      ref={canvasRef}
      className={`w-full h-full relative ${className || ''}`}
      role="application"
      aria-label="Interactive roadmap canvas"
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
          <div className="text-white flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p>Loading canvas...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg z-50 animate-slide-down"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Canvas content */}
      {mode === '2d' ? (
        <div className="w-full h-full">
          <ReactFlowAccessibility
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            className="bg-gray-900"
          >
            <Background color="#333" gap={16} />
            <Controls
              className="bg-gray-800 border-gray-700"
              aria-label="Canvas controls"
            />
          </ReactFlowAccessibility>
        </div>
      ) : (
        <React.Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <p className="text-white">Loading 3D view...</p>
            </div>
          }
        >
          <Spline3DAccessibility
            scene={process.env.NEXT_PUBLIC_SPLINE_SCENE || ''}
            onLoad={() => setIsLoading(false)}
            onError={handle3DError}
            className="w-full h-full"
            ariaLabel="Interactive 3D roadmap visualization"
            ariaDescription="Navigate through your roadmap in 3D space. Use mouse or touch to interact, or keyboard for accessibility."
            enableKeyboardNavigation={true}
            enableScreenReaderSupport={true}
          />
        </React.Suspense>
      )}

      {/* Mode toggle with smooth animation */}
      <button
        onClick={() => useStore.setState({ mode: mode === '2d' ? '3d' : '2d' })}
        className={`
          absolute top-4 right-4 px-6 py-4 rounded-lg
          bg-gradient-to-r from-cyan-600 to-purple-600
          text-white font-semibold
          transform transition-all duration-300
          hover:scale-105 hover:shadow-lg
          focus:outline-none focus:ring-2 focus:ring-cyan-400
          min-w-[44px] min-h-[44px] flex items-center justify-center
        `}
        aria-label={`Switch to ${mode === '2d' ? '3D' : '2D'} view`}
        aria-pressed={mode === '3d'}
      >
        {mode === '2d' ? '🎨 3D View' : '📊 2D View'}
      </button>

      {/* Thrive Score indicator with animation */}
      <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white text-sm font-semibold">Thrive Score</span>
          <span className="text-cyan-400">{Math.round(thriveScore * 100)}%</span>
        </div>
        <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${thriveScore * 100}%` }}
          />
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="absolute bottom-4 right-4">
        <button
          className="text-gray-400 hover:text-white transition-colors p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
          aria-label="Show keyboard shortcuts"
          title="Keyboard shortcuts"
          onClick={() => {
            alert(
              'Keyboard Shortcuts:\n' +
              '• Tab: Navigate nodes\n' +
              '• Enter/Space: Select node\n' +
              '• Ctrl+A: Select all\n' +
              '• Escape: Clear selection'
            );
          }}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Add responsive styles
const styles = `
  @media (max-width: 768px) {
    .react-flow__controls {
      bottom: 80px;
    }
  }

  @keyframes slide-down {
    from {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }

  .animate-slide-down {
    animation: slide-down 0.3s ease-out;
  }

  .shadow-neon {
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default MagicCanvas;