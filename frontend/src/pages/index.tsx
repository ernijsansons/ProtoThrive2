import Header from '@/components/Header';
import MagicCanvas from '@/components/MagicCanvas';
import InsightsPanel from '@/components/InsightsPanel';
import EliteSidebar from '@/components/EliteSidebar';
import {useStore} from '@/store';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Type definitions
interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
}

interface RoadmapItem {
  id: string;
  name: string;
  type: string;
  icon: string;
  status: string;
}

const Dashboard = () => {
  const {toggleMode, fetchRoadmap} = useStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedRoadmapItem, setSelectedRoadmapItem] = useState<RoadmapItem | null>(null);

  useEffect(() => {
    // Fetch a dummy roadmap for now. In a real app, this would come from user context.
    fetchRoadmap('uuid-thermo-1'); 
  }, [fetchRoadmap]);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    console.log('Template selected:', template);
    // Here you could integrate with your canvas or store
  };

  const handleRoadmapItemSelect = (item: RoadmapItem) => {
    setSelectedRoadmapItem(item);
    console.log('Roadmap item selected:', item);
    // Here you could navigate or update the view
  };

  return (
    <div className="min-h-screen bg-dark-primary">
      <Header />
      <div className="flex pt-16 h-screen">
        {/* Elite Sidebar */}
        <EliteSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onTemplateSelect={handleTemplateSelect}
          onRoadmapItemSelect={handleRoadmapItemSelect}
        />

        {/* Main Content Area */}
        <motion.main 
          className="flex-1 overflow-hidden"
          animate={{
            marginLeft: 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-full p-4 overflow-y-auto">
            {/* Canvas and Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
              {/* Main Canvas Area */}
              <div className="min-h-[600px] bg-dark-secondary/50 rounded-xl border border-neon-blue-primary/20 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-elite bg-gradient-neon-mix bg-clip-text text-transparent">
                    Magic Canvas
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={toggleMode} 
                      className="btn-elite text-sm px-4 py-2"
                    >
                      Toggle Mode
                    </button>
                  </div>
                </div>
                <div className="h-full">
                  <MagicCanvas />
                </div>
              </div>

              {/* Insights Panel */}
              <div className="min-h-[600px] bg-dark-secondary/50 rounded-xl border border-neon-green-primary/20 p-4 backdrop-blur-sm">
                <h2 className="text-lg font-bold text-neon-green-primary mb-4">
                  Insights Panel
                </h2>
                <InsightsPanel />
                
                {/* Selected Template Info */}
                {selectedTemplate && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-lg bg-neon-blue-primary/10 border border-neon-blue-primary/30"
                  >
                    <h3 className="text-sm font-bold text-neon-blue-primary mb-2">
                      Selected Template
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{selectedTemplate.thumbnail}</span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {selectedTemplate.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {selectedTemplate.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Selected Roadmap Item Info */}
                {selectedRoadmapItem && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-lg bg-neon-green-primary/10 border border-neon-green-primary/30"
                  >
                    <h3 className="text-sm font-bold text-neon-green-primary mb-2">
                      Selected Roadmap Item
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{selectedRoadmapItem.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {selectedRoadmapItem.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          Status: {selectedRoadmapItem.status}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Additional Content Row */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="card-elite">
                <h3 className="text-lg font-bold text-neon-blue-primary mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="btn-elite w-full text-sm">New Project</button>
                  <button className="btn-elite w-full text-sm">Import Template</button>
                  <button className="btn-elite w-full text-sm">Export Design</button>
                </div>
              </div>
              
              <div className="card-elite">
                <h3 className="text-lg font-bold text-neon-green-primary mb-2">Recent Activity</h3>
                <div className="space-y-2 text-sm text-text-muted">
                  <p>✅ Updated wireframes</p>
                  <p>🔄 In progress: High-Fi Mockups</p>
                  <p>📊 Completed user research</p>
                </div>
              </div>
              
              <div className="card-elite">
                <h3 className="text-lg font-bold text-neon-purple mb-2">Collaboration</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-text-primary">Team Members: 5</p>
                  <p className="text-text-primary">Active Sessions: 2</p>
                  <p className="text-text-primary">Last Sync: 2 min ago</p>
                </div>
              </div>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default Dashboard;