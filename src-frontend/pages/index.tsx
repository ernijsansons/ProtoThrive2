// Ref: CLAUDE.md Phase 2 - Dashboard with exact grid layout
import { useEffect } from 'react';
import MagicCanvas from '../components/MagicCanvas';
import InsightsPanel from '../components/InsightsPanel';
import { useStore } from '../store';
import { mockFetch } from '../../utils/mocks';

const Dashboard = () => {
  console.log('Thermonuclear Dashboard Rendered');
  const { toggleMode, loadGraph, updateScore } = useStore();

  // Frontend to Backend Integration - Load data on mount
  useEffect(() => {
    const loadGraphFromBackend = async () => {
      try {
        console.log('Thermonuclear Frontend→Backend: Loading roadmap data...');
        const res = await mockFetch('/api/roadmaps/rm-thermo-1', {
          headers: { Authorization: 'Bearer mock' }
        });
        const data = await res.json();
        
        // Parse the graph data from backend response
        const graphData = JSON.parse(data.json_graph);
        const { nodes, edges } = graphData;
        const thriveScore = data.thrive_score || 0.45;
        
        console.log('Thermonuclear Frontend→Backend: Data received', { nodes: nodes.length, edges: edges.length, thriveScore });
        loadGraph(nodes, edges);
        updateScore(thriveScore);
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
      <button 
        onClick={toggleMode} 
        className="bg-blue-500 text-white p-2 rounded"
        onMouseEnter={() => console.log('Thermonuclear Toggle Button Hovered')}
      >
        Toggle Mode
      </button>
    </div>
  );
};

export default Dashboard;