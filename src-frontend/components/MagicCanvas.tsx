// Ref: CLAUDE.md Phase 2 - MagicCanvas with exact specs
import ReactFlow from 'reactflow';
import Spline from '@splinetool/react-spline';
import { useStore } from '../store';

const MagicCanvas = () => {
  console.log('Thermonuclear MagicCanvas Rendered');
  const { nodes, edges, mode } = useStore();

  const rfNodes = nodes.map(n => ({
    id: n.id,
    data: { label: `${n.label} (${n.status})` },
    position: { x: n.position.x, y: n.position.y },
    style: n.status === 'neon' ? { border: '2px solid #00ffff' } : {}
  }));

  const rfEdges = edges.map(e => ({
    id: `e-${e.from}-${e.to}`,
    source: e.from,
    target: e.to
  }));

  const handleSplineLoad = () => {
    console.log('Thermonuclear 3D Loaded - Map Nodes to Positions:', nodes.map(n => n.position));
  };

  return (
    <div style={{ width: '100vw', height: '80vh' }}>
      {mode === '2d' ? (
        <ReactFlow 
          nodes={rfNodes} 
          edges={rfEdges} 
          fitView 
          onLoad={() => console.log('Thermonuclear ReactFlow Loaded')}
        />
      ) : (
        <Spline
          scene={process.env.SPLINE_SCENE || 'https://prod.spline.design/neon-cube/scene.splinecode'}
          onLoad={handleSplineLoad}
        />
      )}
    </div>
  );
};

export default MagicCanvas;