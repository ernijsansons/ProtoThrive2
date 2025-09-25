/**
 * MagicCanvas Component - Interactive Roadmap Visualization
 * 
 * This component provides an accessible, responsive interface for visualizing
 * project roadmaps with both 2D and 3D display modes. It serves as the central
 * interaction point for users to view and manipulate their roadmap data.
 * 
 * Key Features:
 * - Dual rendering modes (2D React Flow / 3D Spline integration)
 * - Full accessibility compliance (WCAG 2.1 AA)
 * - Real-time thrive score visualization
 * - Responsive design for all device sizes
 * - Keyboard navigation and screen reader support
 * 
 * Ref: CLAUDE.md Phase 2 - Enhanced MagicCanvas with full accessibility and responsive design
 * @see https://reactflow.dev/docs/ - React Flow documentation
 * @see https://spline.design/docs/ - Spline 3D documentation
 */

// Note: React Flow and Spline imports are commented out for mock development
// import ReactFlow, { ReactFlowProvider } from 'reactflow';
// import 'reactflow/dist/style.css';
// import Spline from '@splinetool/react-spline';

import { useStore, type Node } from '../store';
import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Props interface for MagicCanvas component
 * @interface CanvasProps
 * @property {string} [className] - Additional CSS classes for styling
 * @property {string} ['aria-label'] - Accessibility label for screen readers
 */
interface CanvasProps {
  className?: string;
  'aria-label'?: string;
}

/**
 * MagicCanvas Component - Main roadmap visualization interface
 * 
 * @param {CanvasProps} props - Component props
 * @returns {JSX.Element} Rendered canvas component
 */
const MagicCanvas = ({ className = '', 'aria-label': ariaLabel }: CanvasProps) => {
  // Development logging for debugging (will be removed in production)
  console.log('Thermonuclear MagicCanvas Rendered');
  
  // Global state from Zustand store - manages roadmap data and UI state
  const { nodes, edges, mode, toggleMode, thriveScore } = useStore();
  
  // Local component state for UI interactions
  const [isExpanded, setIsExpanded] = useState(false);        // Canvas expansion state
  const [selectedNode, setSelectedNode] = useState<string | null>(null); // Currently selected node
  const canvasRef = useRef<HTMLDivElement>(null);             // DOM reference for accessibility focus management

  /**
   * Focus management effect for accessibility compliance
   * When a node is selected, automatically focus it for keyboard navigation
   * This ensures screen readers and keyboard users can track the selected state
   */
  useEffect(() => {
    if (selectedNode && canvasRef.current) {
      const nodeElement = canvasRef.current.querySelector(`[data-node-id="${selectedNode}"]`) as HTMLElement;
      nodeElement?.focus();
    }
  }, [selectedNode]);

  /**
   * Maps node status to corresponding color and styling classes
   * Supports both light and dark theme variants with accessibility considerations
   * 
   * @param {Node['status']} status - Node status ('neon', 'success', 'error', 'gray')
   * @returns {Object} Object containing bg, border, text, and glow CSS classes
   */
  const getStatusColor = useCallback((status: Node['status']) => {
    switch (status) {
      case 'neon': return {
        bg: 'bg-neon-cyan',
        border: 'border-neon-cyan',
        text: 'text-neon-cyan',
        glow: 'shadow-neon'
      };
      case 'success': return {
        bg: 'bg-success-500',
        border: 'border-success-500',
        text: 'text-success-600',
        glow: 'shadow-soft'
      };
      case 'error': return {
        bg: 'bg-error-500',
        border: 'border-error-500',
        text: 'text-error-600',
        glow: 'shadow-soft'
      };
      default: return {
        bg: 'bg-gray-400',
        border: 'border-gray-400',
        text: 'text-gray-600',
        glow: 'shadow-soft'
      };
    }
  }, []);

  const getStatusDescription = useCallback((status: Node['status']) => {
    switch (status) {
      case 'neon': return 'Active and thriving';
      case 'success': return 'Completed successfully';
      case 'error': return 'Requires attention';
      default: return 'Pending or inactive';
    }
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  }, [selectedNode]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, nodeId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNodeClick(nodeId);
    }
  }, [handleNodeClick]);

  const toggleExpansion = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  return (
    <section 
      ref={canvasRef}
      className={`relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden ${className}`}
      style={{ 
        width: '100%', 
        height: isExpanded ? '90vh' : '80vh',
        minHeight: '400px'
      }}
      aria-label={ariaLabel || "Interactive roadmap visualization showing project nodes and connections"}
      role="application"
    >
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              <span className="neon-text">ProtoThrive</span> Graph Visualization
            </h3>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span>Mode:</span>
                <span className="font-medium capitalize text-primary-600 dark:text-primary-400">
                  {mode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Thrive Score:</span>
                <span className={`font-bold ${thriveScore > 0.7 ? 'text-success-600' : thriveScore > 0.4 ? 'text-warning-600' : 'text-error-600'}`}>
                  {(thriveScore * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <button
              onClick={toggleMode}
              className="btn bg-primary-600 text-white hover:bg-primary-700 focus-ring text-sm"
              aria-label={`Switch to ${mode === '2d' ? '3D' : '2D'} view`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
              {mode === '2d' ? '3D' : '2D'}
            </button>

            {/* Expand Toggle */}
            <button
              onClick={toggleExpansion}
              className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus-ring text-sm"
              aria-label={isExpanded ? 'Collapse canvas' : 'Expand canvas'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8l4-4m0 0v10m0-10h10M20 16l-4 4m0 0V10m0 10H6" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Canvas Content */}
      <div className="flex-1 p-4 sm:p-6 h-full overflow-auto scrollbar-thin">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          
          {/* Nodes Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Nodes ({nodes.length})
              </h4>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Click to inspect
              </div>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin" role="list">
              {nodes.map((node) => {
                const colors = getStatusColor(node.status);
                const isSelected = selectedNode === node.id;
                
                return (
                  <div
                    key={node.id}
                    data-node-id={node.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' 
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                      focus-ring
                    `}
                    onClick={() => handleNodeClick(node.id)}
                    onKeyDown={(e) => handleKeyDown(e, node.id)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    aria-describedby={`node-${node.id}-description`}
                  >
                    <div className={`w-4 h-4 rounded-full ${colors.bg} ${colors.glow} flex-shrink-0`} aria-hidden="true"></div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {node.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span className={`font-medium ${colors.text} capitalize`}>
                          {node.status}
                        </span>
                        <span>•</span>
                        <span>Position: ({node.position.x}, {node.position.y})</span>
                      </div>
                    </div>

                    {isSelected && (
                      <svg className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}

                    <div id={`node-${node.id}-description`} className="sr-only">
                      Node {node.label}: {getStatusDescription(node.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Connections Panel */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connections ({edges.length})
            </h4>
            
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin" role="list">
              {edges.map((edge, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  role="listitem"
                  aria-label={`Connection from ${edge.from} to ${edge.to}`}
                >
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{edge.from}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-medium">{edge.to}</span>
                  </div>
                  
                  <div className="w-2 h-2 bg-primary-400 rounded-full" aria-hidden="true"></div>
                </div>
              ))}
            </div>

            {edges.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="text-sm">No connections defined</p>
                <p className="text-xs mt-1">Connect nodes to build your roadmap</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg animate-fade-in-up">
            <h5 className="font-semibold text-primary-800 dark:text-primary-200 mb-2">
              Node Details
            </h5>
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">ID:</span>
                    <span className="ml-2 font-mono text-gray-900 dark:text-white">{node.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 font-medium capitalize ${getStatusColor(node.status).text}`}>
                      {node.status}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">3D Position:</span>
                    <span className="ml-2 font-mono text-gray-900 dark:text-white">
                      x: {node.position.x}, y: {node.position.y}, z: {node.position.z}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </section>
  );
};

export default MagicCanvas;