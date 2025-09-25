import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlow, Node, Edge, useNodesState, useEdgesState, addEdge, Connection, EdgeChange, NodeChange, useReactFlow } from 'reactflow';
import { FocusManager, ScreenReaderAnnouncer, KeyboardNavigation } from '../utils/accessibility';

interface ReactFlowAccessibilityProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Enhanced ReactFlow component with comprehensive keyboard navigation and accessibility features
 */
export const ReactFlowAccessibility: React.FC<ReactFlowAccessibilityProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  children,
  className = ''
}) => {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [focusedEdgeId, setFocusedEdgeId] = useState<string | null>(null);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const reactFlowInstance = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Focus management for nodes
  const focusNode = useCallback((nodeId: string) => {
    const nodeElement = nodeRefs.current.get(nodeId);
    if (nodeElement) {
      nodeElement.focus();
      setFocusedNodeId(nodeId);
      setFocusedEdgeId(null);
      
      // Announce to screen readers
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        ScreenReaderAnnouncer.announce(`Focused on node: ${node.data?.label || nodeId}`);
      }
    }
  }, [nodes]);

  // Focus management for edges
  const focusEdge = useCallback((edgeId: string) => {
    setFocusedEdgeId(edgeId);
    setFocusedNodeId(null);
    
    // Announce to screen readers
    const edge = edges.find(e => e.id === edgeId);
    if (edge) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      ScreenReaderAnnouncer.announce(
        `Focused on edge from ${sourceNode?.data?.label || edge.source} to ${targetNode?.data?.label || edge.target}`
      );
    }
  }, [edges, nodes]);

  // Navigate between nodes
  const navigateToNextNode = useCallback(() => {
    const currentIndex = focusedNodeId ? nodes.findIndex(n => n.id === focusedNodeId) : -1;
    const nextIndex = (currentIndex + 1) % nodes.length;
    if (nodes[nextIndex]) {
      focusNode(nodes[nextIndex].id);
    }
  }, [focusedNodeId, nodes, focusNode]);

  const navigateToPreviousNode = useCallback(() => {
    const currentIndex = focusedNodeId ? nodes.findIndex(n => n.id === focusedNodeId) : -1;
    const prevIndex = currentIndex <= 0 ? nodes.length - 1 : currentIndex - 1;
    if (nodes[prevIndex]) {
      focusNode(nodes[prevIndex].id);
    }
  }, [focusedNodeId, nodes, focusNode]);

  // Navigate between edges
  const navigateToNextEdge = useCallback(() => {
    const currentIndex = focusedEdgeId ? edges.findIndex(e => e.id === focusedEdgeId) : -1;
    const nextIndex = (currentIndex + 1) % edges.length;
    if (edges[nextIndex]) {
      focusEdge(edges[nextIndex].id);
    }
  }, [focusedEdgeId, edges, focusEdge]);

  const navigateToPreviousEdge = useCallback(() => {
    const currentIndex = focusedEdgeId ? edges.findIndex(e => e.id === focusedEdgeId) : -1;
    const prevIndex = currentIndex <= 0 ? edges.length - 1 : currentIndex - 1;
    if (edges[prevIndex]) {
      focusEdge(edges[prevIndex].id);
    }
  }, [focusedEdgeId, edges, focusEdge]);

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isKeyboardMode) return;

    const { key, ctrlKey, metaKey, shiftKey } = event;

    // Prevent default behavior for our custom navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Space'].includes(key)) {
      event.preventDefault();
    }

    switch (key) {
      case 'Tab':
        if (shiftKey) {
          // Shift+Tab: Navigate backwards
          if (focusedEdgeId) {
            navigateToPreviousEdge();
          } else {
            navigateToPreviousNode();
          }
        } else {
          // Tab: Navigate forwards
          if (focusedNodeId) {
            navigateToNextNode();
          } else if (focusedEdgeId) {
            navigateToNextEdge();
          } else if (nodes.length > 0) {
            focusNode(nodes[0].id);
          }
        }
        break;

      case 'ArrowUp':
      case 'ArrowDown':
        if (focusedNodeId) {
          // Navigate between nodes vertically
          if (key === 'ArrowUp') {
            navigateToPreviousNode();
          } else {
            navigateToNextNode();
          }
        } else if (focusedEdgeId) {
          // Navigate between edges
          if (key === 'ArrowUp') {
            navigateToPreviousEdge();
          } else {
            navigateToNextEdge();
          }
        }
        break;

      case 'ArrowLeft':
      case 'ArrowRight':
        if (focusedNodeId) {
          // Switch to edge navigation
          if (key === 'ArrowRight' && edges.length > 0) {
            focusEdge(edges[0].id);
          }
        } else if (focusedEdgeId) {
          // Switch back to node navigation
          if (key === 'ArrowLeft' && nodes.length > 0) {
            focusNode(nodes[0].id);
          }
        }
        break;

      case 'Enter':
      case ' ':
        // Select/deselect focused element
        if (focusedNodeId) {
          const node = nodes.find(n => n.id === focusedNodeId);
          if (node) {
            onNodesChange([{
              id: focusedNodeId,
              type: 'select',
              selected: !node.selected
            }]);
            ScreenReaderAnnouncer.announce(
              `${node.selected ? 'Deselected' : 'Selected'} node: ${node.data?.label || focusedNodeId}`
            );
          }
        } else if (focusedEdgeId) {
          const edge = edges.find(e => e.id === focusedEdgeId);
          if (edge) {
            onEdgesChange([{
              id: focusedEdgeId,
              type: 'select',
              selected: !edge.selected
            }]);
            ScreenReaderAnnouncer.announce(
              `${edge.selected ? 'Deselected' : 'Selected'} edge`
            );
          }
        }
        break;

      case 'Escape':
        // Clear all selections and focus
        setFocusedNodeId(null);
        setFocusedEdgeId(null);
        onNodesChange(nodes.map(n => ({ id: n.id, type: 'select', selected: false })));
        onEdgesChange(edges.map(e => ({ id: e.id, type: 'select', selected: false })));
        ScreenReaderAnnouncer.announce('Cleared all selections');
        break;

      case 'Home':
        // Focus first node
        if (nodes.length > 0) {
          focusNode(nodes[0].id);
        }
        break;

      case 'End':
        // Focus last node
        if (nodes.length > 0) {
          focusNode(nodes[nodes.length - 1].id);
        }
        break;

      case 'Delete':
      case 'Backspace':
        // Delete focused element
        if (focusedNodeId) {
          onNodesChange([{ id: focusedNodeId, type: 'remove' }]);
          ScreenReaderAnnouncer.announce(`Deleted node: ${focusedNodeId}`);
          // Focus next node
          const currentIndex = nodes.findIndex(n => n.id === focusedNodeId);
          const nextNode = nodes[currentIndex + 1] || nodes[currentIndex - 1];
          if (nextNode) {
            focusNode(nextNode.id);
          }
        } else if (focusedEdgeId) {
          onEdgesChange([{ id: focusedEdgeId, type: 'remove' }]);
          ScreenReaderAnnouncer.announce(`Deleted edge: ${focusedEdgeId}`);
        }
        break;

      case 'a':
        if (ctrlKey || metaKey) {
          // Select all nodes
          onNodesChange(nodes.map(n => ({ id: n.id, type: 'select', selected: true })));
          ScreenReaderAnnouncer.announce(`Selected all ${nodes.length} nodes`);
        }
        break;

      case 'f':
        if (ctrlKey || metaKey) {
          // Focus search/filter (if implemented)
          event.preventDefault();
          ScreenReaderAnnouncer.announce('Search functionality not yet implemented');
        }
        break;

      case 'h':
        if (ctrlKey || metaKey) {
          // Show help
          event.preventDefault();
          ScreenReaderAnnouncer.announce(
            'Keyboard shortcuts: Tab to navigate, Enter to select, Escape to clear, Delete to remove, Ctrl+A to select all'
          );
        }
        break;
    }
  }, [
    isKeyboardMode,
    focusedNodeId,
    focusedEdgeId,
    nodes,
    edges,
    focusNode,
    focusEdge,
    navigateToNextNode,
    navigateToPreviousNode,
    navigateToNextEdge,
    navigateToPreviousEdge,
    onNodesChange,
    onEdgesChange
  ]);

  // Set up keyboard event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    
    // Enable keyboard mode when any key is pressed
    const enableKeyboardMode = () => setIsKeyboardMode(true);
    container.addEventListener('keydown', enableKeyboardMode);
    
    // Disable keyboard mode when mouse is used
    const disableKeyboardMode = () => setIsKeyboardMode(false);
    container.addEventListener('mousedown', disableKeyboardMode);
    container.addEventListener('touchstart', disableKeyboardMode);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('keydown', enableKeyboardMode);
      container.removeEventListener('mousedown', disableKeyboardMode);
      container.removeEventListener('touchstart', disableKeyboardMode);
    };
  }, [handleKeyDown]);

  // Set up focus trap
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isKeyboardMode) {
      FocusManager.trapFocus(container);
    } else {
      FocusManager.releaseFocus();
    }

    return () => {
      FocusManager.releaseFocus();
    };
  }, [isKeyboardMode]);

  // Register node refs for focus management
  const registerNodeRef = useCallback((nodeId: string, element: HTMLElement | null) => {
    if (element) {
      nodeRefs.current.set(nodeId, element);
    } else {
      nodeRefs.current.delete(nodeId);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`reactflow-accessibility ${className}`}
      role="application"
      aria-label="Interactive flowchart with keyboard navigation"
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {/* Keyboard mode indicator */}
      {isKeyboardMode && (
        <div
          className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded text-sm z-50"
          role="status"
          aria-live="polite"
        >
          ⌨️ Keyboard Mode Active
        </div>
      )}

      {/* Screen reader announcements */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        id="reactflow-announcements"
      />

      {/* Enhanced ReactFlow with accessibility features */}
      <ReactFlow
        nodes={nodes.map(node => ({
          ...node,
          // Add accessibility attributes
          data: {
            ...node.data,
            'aria-label': node.data?.label || `Node ${node.id}`,
            'aria-describedby': `node-description-${node.id}`,
            'aria-selected': node.selected,
            'aria-expanded': node.data?.expanded || false,
            // Register ref for focus management
            ref: (el: HTMLElement | null) => registerNodeRef(node.id, el)
          }
        }))}
        edges={edges.map(edge => ({
          ...edge,
          // Add accessibility attributes
          'aria-label': `Edge from ${edge.source} to ${edge.target}`,
          'aria-selected': edge.selected
        }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        className="bg-gray-900"
        fitView
        attributionPosition="bottom-left"
        // Accessibility props
        nodesDraggable={!isKeyboardMode}
        nodesConnectable={!isKeyboardMode}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        // Custom node types with accessibility
        nodeTypes={{
          default: ({ data, selected, id }) => (
            <div
              className={`
                px-4 py-2 rounded-lg border-2 min-w-[120px] text-center
                ${selected ? 'border-blue-400 bg-blue-900' : 'border-gray-600 bg-gray-800'}
                ${focusedNodeId === id ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
                focus:outline-none focus:ring-2 focus:ring-yellow-400
                transition-all duration-200
              `}
              tabIndex={0}
              role="button"
              aria-label={data?.label || `Node ${id}`}
              aria-selected={selected}
              aria-describedby={`node-description-${id}`}
              onFocus={() => setFocusedNodeId(id)}
              onBlur={() => {
                if (focusedNodeId === id) {
                  setFocusedNodeId(null);
                }
              }}
            >
              <div className="text-white font-medium">{data?.label || id}</div>
              {data?.description && (
                <div
                  id={`node-description-${id}`}
                  className="text-gray-400 text-sm mt-1"
                >
                  {data.description}
                </div>
              )}
            </div>
          )
        }}
        // Custom edge styles with accessibility
        edgeTypes={{
          default: ({ selected, id, source, target }) => (
            <g>
              <path
                className={`
                  stroke-2 fill-none
                  ${selected ? 'stroke-blue-400' : 'stroke-gray-500'}
                  ${focusedEdgeId === id ? 'stroke-yellow-400 stroke-3' : ''}
                  transition-all duration-200
                `}
                strokeWidth={selected ? 3 : 2}
                strokeDasharray={selected ? '5,5' : 'none'}
                aria-label={`Edge from ${source} to ${target}`}
                aria-selected={selected}
                role="button"
                tabIndex={0}
                onFocus={() => setFocusedEdgeId(id)}
                onBlur={() => {
                  if (focusedEdgeId === id) {
                    setFocusedEdgeId(null);
                  }
                }}
              />
            </g>
          )
        }}
      >
        {children}
      </ReactFlow>

      {/* Keyboard shortcuts help */}
      <div className="absolute bottom-4 right-4">
        <button
          className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          onClick={() => {
            const shortcuts = [
              'Keyboard Shortcuts:',
              '• Tab/Shift+Tab: Navigate between elements',
              '• Arrow Keys: Navigate within elements',
              '• Enter/Space: Select element',
              '• Escape: Clear selections',
              '• Delete/Backspace: Remove element',
              '• Ctrl+A: Select all nodes',
              '• Ctrl+H: Show this help'
            ].join('\n');
            
            ScreenReaderAnnouncer.announce(shortcuts);
            alert(shortcuts);
          }}
          aria-label="Show keyboard shortcuts help"
        >
          ⌨️ Help
        </button>
      </div>
    </div>
  );
};

export default ReactFlowAccessibility;
