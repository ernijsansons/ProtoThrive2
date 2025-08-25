// Ref: CLAUDE.md Phase 2 - Dashboard with exact grid layout
import { useEffect } from 'react';
import MagicCanvas from '../components/MagicCanvas';
import InsightsPanel from '../components/InsightsPanel';
import { useStore } from '../store';
import { mockFetch } from '../utils/mocks';

const Dashboard = () => {
  console.log('Thermonuclear Dashboard Rendered');
  const { toggleMode, loadGraph, updateScore } = useStore();

  // Frontend to Backend Integration - Load data on mount
  useEffect(() => {
    const loadGraphFromBackend = async () => {
      try {
        console.log('Thermonuclear Frontend→Backend: Loading roadmap data...');
        // First, try to get existing roadmaps
        const res = await mockFetch('/api/roadmaps', {
          headers: { Authorization: 'Bearer mock' }
        });
        
        if (res.ok) {
          const roadmaps = await res.json();
          console.log('Available roadmaps:', roadmaps);
          
          // If we have roadmaps, load the first one
          if (roadmaps && roadmaps.length > 0) {
            const roadmapRes = await mockFetch(`/api/roadmaps/${roadmaps[0].id}`, {
              headers: { Authorization: 'Bearer mock' }
            });
            const data = await roadmapRes.json();
            
            // Parse the graph data
            const graphData = JSON.parse(data.json_graph || '{"nodes":[],"edges":[]}');
            const nodes = graphData.nodes || [];
            const edges = graphData.edges || [];
            const thriveScore = data.thrive_score || 0.45;
            
            console.log('Thermonuclear Frontend→Backend: Data received', { nodes: nodes.length, edges: edges.length, thriveScore });
            loadGraph(nodes, edges);
            updateScore(thriveScore);
            return;
          }
        }
        
        // If no roadmaps exist or fetch failed, use default data
        const nodes = [
          {id: 'n1', label: 'Thermo Start', status: 'gray' as const, position: {x: 0, y: 0, z: 0}},
          {id: 'n2', label: 'Middle', status: 'gray' as const, position: {x: 100, y: 100, z: 0}},
          {id: 'n3', label: 'End', status: 'gray' as const, position: {x: 200, y: 200, z: 0}}
        ];
        const edges = [{from: 'n1', to: 'n2'}, {from: 'n2', to: 'n3'}];
        loadGraph(nodes, edges);
        updateScore(0.45);
      } catch (e) {
        console.error('Thermonuclear Fetch Error:', e);
        // Fallback to dummy data
        handleDummyLoad();
      }
    };

    loadGraphFromBackend();
  }, [loadGraph, updateScore]);

  // Dummy load fallback
  const handleDummyLoad = () => {
    console.log('Thermonuclear Dummy Load Triggered');
    loadGraph([], []);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <div style={{height: '80%'}}>
        <MagicCanvas />
      </div>
      <InsightsPanel />
      <div className="flex gap-4">
        <button 
          onClick={toggleMode} 
          className="bg-blue-500 text-white p-2 rounded h-fit"
          onMouseEnter={() => console.log('Thermonuclear Toggle Button Hovered')}
        >
          Toggle Mode
        </button>
        <a 
          href="/admin-login" 
          className="bg-purple-600 text-white p-2 rounded h-fit text-center"
        >
          Admin Portal
        </a>
      </div>
    </div>
  );
};

export default Dashboard;