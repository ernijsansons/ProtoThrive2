import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Spline from '@splinetool/react-spline';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomNode } from './canvas/CustomNode';
import { useStore } from '../store';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCcw, 
  Download,
  Upload,
  Move3D,
  Layers,
  Settings,
  Sparkles
} from 'lucide-react';

// Elite Node Types for React Flow
const nodeTypes = {
  custom: CustomNode,
};

// Elite edge styling with neon glow
const eliteEdgeStyles = {
  default: {
    stroke: 'var(--neon-blue-primary)',
    strokeWidth: 2,
    filter: 'drop-shadow(0 0 8px var(--neon-blue-primary))',
  },
  animated: {
    stroke: 'var(--neon-green-primary)',
    strokeWidth: 3,
    filter: 'drop-shadow(0 0 12px var(--neon-green-primary))',
    strokeDasharray: '5,5',
    animation: 'flow 2s linear infinite',
  },
  selected: {
    stroke: 'var(--neon-purple)',
    strokeWidth: 4,
    filter: 'drop-shadow(0 0 16px var(--neon-purple))',
  },
};

interface MagicCanvasProps {
  className?: string;
}

const MagicCanvasCore = ({ className = '' }: MagicCanvasProps) => {
  console.log('Thermonuclear Elite MagicCanvas Rendered');
  const { nodes: storeNodes, edges: storeEdges, mode, thriveScore } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [canvasStats, setCanvasStats] = useState({
    nodeCount: 0,
    connectionCount: 0,
    completionRate: 0,
  });
  
  const reactFlowInstance = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Convert store nodes to React Flow format with elite styling
  useEffect(() => {
    const rfNodes: Node[] = storeNodes.map(n => ({
      id: n.id,
      type: 'custom',
      position: { x: n.position.x, y: n.position.y },
      data: { 
        label: n.label,
        status: n.status,
        templateMatch: Math.random() > 0.5 ? 'auth-basic' : undefined,
      },
      style: {
        background: n.status === 'neon' 
          ? 'rgba(0, 210, 255, 0.1)' 
          : 'rgba(42, 42, 43, 0.8)',
        border: n.status === 'neon' 
          ? '2px solid var(--neon-blue-primary)' 
          : '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        boxShadow: n.status === 'neon' 
          ? '0 0 20px var(--neon-blue-primary)' 
          : '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
      selected: selectedNodes.includes(n.id),
    }));

    const rfEdges: Edge[] = storeEdges.map(e => ({
      id: `e-${e.from}-${e.to}`,
      source: e.from,
      target: e.to,
      type: 'smoothstep',
      style: eliteEdgeStyles.default,
      animated: Math.random() > 0.7,
      markerEnd: 'arrowclosed',
    }));

    setNodes(rfNodes);
    setEdges(rfEdges);

    // Update canvas stats
    const completedNodes = storeNodes.filter(n => n.status === 'neon').length;
    setCanvasStats({
      nodeCount: storeNodes.length,
      connectionCount: storeEdges.length,
      completionRate: storeNodes.length > 0 ? (completedNodes / storeNodes.length) * 100 : 0,
    });
  }, [storeNodes, storeEdges, selectedNodes, setNodes, setEdges]);

  // Handle edge connections with elite effects
  const onConnect = useCallback((params: Connection | Edge) => {
    const newEdge = {
      ...params,
      type: 'smoothstep',
      style: eliteEdgeStyles.animated,
      animated: true,
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  // Elite drag and drop handler
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    const templateData = event.dataTransfer.getData('template');

    if (typeof type === 'undefined' || !type || !templateData) {
      return;
    }

    const template = JSON.parse(templateData);
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node = {
      id: `${template.id}-${Date.now()}`,
      type: 'custom',
      position,
      data: {
        label: template.label,
        status: 'gray',
        templateMatch: template.id,
      },
      style: {
        background: 'rgba(42, 42, 43, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
      },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);

  // Elite canvas controls
  const handleZoomIn = () => reactFlowInstance.zoomIn();
  const handleZoomOut = () => reactFlowInstance.zoomOut();
  const handleFitView = () => reactFlowInstance.fitView({ padding: 0.2 });
  const handleReset = () => {
    reactFlowInstance.setCenter(0, 0);
    reactFlowInstance.zoomTo(1);
  };

  // Export/Import functionality
  const handleExport = () => {
    const flow = reactFlowInstance.toObject();
    const dataStr = JSON.stringify(flow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'protothrive-canvas.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Spline 3D scene handler with better error handling
  const handleSplineLoad = () => {
    console.log('Thermonuclear Elite 3D Loaded - Nodes mapped to positions:', storeNodes.map(n => n.position));
    setIsLoading(false);
  };

  const handleSplineError = (error: any) => {
    console.warn('Spline loading error, falling back to 2D mode:', error);
    setIsLoading(false);
  };

  // Node selection handler
  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    setSelectedNodes(nodes.map(node => node.id));
  }, []);

  if (mode === '3d') {
    return (
      <motion.div 
        className={`relative w-full h-full rounded-xl overflow-hidden ${className}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5 }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-primary/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="spinner-elite mb-4 mx-auto"></div>
              <p className="text-neon-blue-primary animate-neon-glow">Loading 3D Experience...</p>
            </div>
          </div>
        )}
        
        <Spline
          scene="https://prod.spline.design/6Wq1Q7YGyM-iab9t/scene.splinecode"
          onLoad={handleSplineLoad}
          onError={handleSplineError}
          style={{
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at center, rgba(0, 210, 255, 0.1) 0%, rgba(10, 10, 11, 1) 70%)',
          }}
        />
        
        {/* 3D Overlay Controls */}
        <div className="absolute top-4 right-4 z-10">
          <div className="glass-elite p-3 rounded-lg">
            <div className="flex items-center space-x-3 text-sm">
              <Sparkles className="h-4 w-4 text-neon-blue-primary animate-neon-glow" />
              <span className="text-neon-blue-primary">3D Mode Active</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`relative w-full h-full rounded-xl overflow-hidden border border-neon-blue-primary/20 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'radial-gradient(circle at center, rgba(0, 210, 255, 0.05) 0%, rgba(10, 10, 11, 0.95) 70%)',
      }}
    >
      <ReactFlow
        ref={canvasRef}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        style={{
          background: 'transparent',
        }}
      >
        {/* Elite Background with Neon Grid */}
        <Background 
          color="rgba(0, 210, 255, 0.1)" 
          gap={20}
          size={1}
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 210, 255, 0.02) 0%, transparent 70%)',
          }}
        />
        
        {/* Elite MiniMap */}
        <MiniMap 
          nodeColor={(node) => {
            if (node.data?.status === 'neon') return 'var(--neon-blue-primary)';
            return 'rgba(255, 255, 255, 0.3)';
          }}
          style={{
            background: 'rgba(26, 26, 27, 0.8)',
            border: '1px solid var(--neon-blue-primary)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
          }}
        />
        
        {/* Elite Controls */}
        <Controls 
          style={{
            background: 'transparent',
            border: 'none',
          }}
        />
        
        {/* Elite Canvas Stats Panel */}
        <Panel position="top-left">
          <motion.div 
            className="glass-elite p-4 rounded-lg border border-neon-blue-primary/30"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <Layers className="h-5 w-5 text-neon-blue-primary" />
              <h3 className="text-sm font-bold text-neon-blue-primary">Canvas Stats</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Nodes:</span>
                <span className="text-neon-blue-primary font-mono">{canvasStats.nodeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Connections:</span>
                <span className="text-neon-green-primary font-mono">{canvasStats.connectionCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Completion:</span>
                <span className="text-neon-purple font-mono">{canvasStats.completionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-dark-tertiary rounded-full h-2 mt-2">
                <motion.div 
                  className="h-2 rounded-full bg-gradient-green"
                  style={{ width: `${canvasStats.completionRate}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${canvasStats.completionRate}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        </Panel>
        
        {/* Elite Control Panel */}
        <Panel position="top-right">
          <motion.div 
            className="glass-elite p-3 rounded-lg border border-neon-green-primary/30"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleZoomIn}
                className="p-2 rounded bg-neon-blue-primary/20 hover:bg-neon-blue-primary/30 transition-colors neon-glow-blue"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4 text-neon-blue-primary" />
              </button>
              <button 
                onClick={handleZoomOut}
                className="p-2 rounded bg-neon-blue-primary/20 hover:bg-neon-blue-primary/30 transition-colors neon-glow-blue"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4 text-neon-blue-primary" />
              </button>
              <button 
                onClick={handleFitView}
                className="p-2 rounded bg-neon-green-primary/20 hover:bg-neon-green-primary/30 transition-colors neon-glow-green"
                title="Fit View"
              >
                <Maximize className="h-4 w-4 text-neon-green-primary" />
              </button>
              <button 
                onClick={handleReset}
                className="p-2 rounded bg-neon-purple/20 hover:bg-neon-purple/30 transition-colors neon-glow-purple"
                title="Reset View"
              >
                <RotateCcw className="h-4 w-4 text-neon-purple" />
              </button>
              <button 
                onClick={handleExport}
                className="p-2 rounded bg-neon-orange/20 hover:bg-neon-orange/30 transition-colors"
                title="Export Canvas"
              >
                <Download className="h-4 w-4 text-neon-orange" />
              </button>
            </div>
          </motion.div>
        </Panel>

        {/* Selection Info Panel */}
        {selectedNodes.length > 0 && (
          <Panel position="bottom-left">
            <motion.div 
              className="glass-elite p-4 rounded-lg border border-neon-purple/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="flex items-center space-x-3 mb-2">
                <Settings className="h-4 w-4 text-neon-purple" />
                <span className="text-sm font-bold text-neon-purple">
                  {selectedNodes.length} Node{selectedNodes.length > 1 ? 's' : ''} Selected
                </span>
              </div>
              <div className="text-xs text-text-muted">
                Right-click for context menu • Drag to move • Delete to remove
              </div>
            </motion.div>
          </Panel>
        )}
      </ReactFlow>
    </motion.div>
  );
};

const MagicCanvas = ({ className }: MagicCanvasProps) => {
  return (
    <ReactFlowProvider>
      <MagicCanvasCore className={className} />
    </ReactFlowProvider>
  );
};

export default React.memo(MagicCanvas);