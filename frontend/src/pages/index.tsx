import Header from '@/components/Header';
import MagicCanvas from '@/components/MagicCanvas';
import InsightsPanel from '@/components/InsightsPanel';
import {useStore} from '@/store';
import { useEffect } from 'react';

const Dashboard = () => {
  const {toggleMode, fetchRoadmap} = useStore();

  useEffect(() => {
    // Fetch a dummy roadmap for now. In a real app, this would come from user context.
    fetchRoadmap('uuid-thermo-1'); 
  }, [fetchRoadmap]);

  return (
    <div className="min-h-screen bg-dark-primary">
      <Header />
      <main className="pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <MagicCanvas />
          <InsightsPanel />
          <button onClick={toggleMode} className="btn-elite">Toggle Mode</button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;