// Ref: CLAUDE.md Phase 2 - MagicCanvas with exact specs
// import ReactFlow, { ReactFlowProvider } from 'reactflow';
// import 'reactflow/dist/style.css';
// import Spline from '@splinetool/react-spline';
import { useStore } from '../store';

const MagicCanvas = () => {
  console.log('Thermonuclear MagicCanvas Rendered');
  const { nodes, edges, mode } = useStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'neon': return 'bg-cyan-400';
      case 'green': return 'bg-green-400';
      case 'red': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div style={{ width: '100%', height: '80vh' }} className="bg-gray-50 border rounded-lg p-4">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold">ProtoThrive Graph Visualization</h3>
        <p className="text-gray-600">Mode: {mode}</p>
      </div>
      
      <div className="bg-white rounded-lg p-4 h-full overflow-auto">
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Nodes ({nodes.length})</h4>
          <div className="space-y-2">
            {nodes.map((node) => (
              <div key={node.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`}></div>
                <span className="font-medium">{node.label}</span>
                <span className="text-sm text-gray-500">({node.status})</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Edges ({edges.length})</h4>
          <div className="space-y-1">
            {edges.map((edge, index) => (
              <div key={index} className="text-sm text-gray-600 p-1">
                {edge.from} → {edge.to}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicCanvas;