import React, { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplineDemoProps {
  className?: string;
}

const SplineFallback: React.FC = () => (
  <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mx-auto mb-4"
      />
      <p className="text-gray-600 font-medium">Loading 3D Experience...</p>
      <p className="text-sm text-gray-500 mt-2">Preparing your interactive demo</p>
    </div>
  </div>
);

const MockInteractive3D: React.FC = () => {
  const [activeNode, setActiveNode] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const nodes = [
    { id: 0, label: 'Idea', color: 'from-yellow-400 to-orange-500', x: 20, y: 20 },
    { id: 1, label: 'Design', color: 'from-blue-400 to-purple-500', x: 60, y: 30 },
    { id: 2, label: 'Prototype', color: 'from-green-400 to-teal-500', x: 40, y: 70 },
    { id: 3, label: 'Deploy', color: 'from-pink-400 to-rose-500', x: 80, y: 80 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % nodes.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [nodes.length]);

  const handleNodeClick = (nodeId: number) => {
    setActiveNode(nodeId);
    setIsAnimating(false);
    setTimeout(() => setIsAnimating(true), 500);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-lg overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * 400,
              y: Math.random() * 300,
              opacity: 0
            }}
            animate={{
              x: Math.random() * 400,
              y: Math.random() * 300,
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Interactive nodes */}
      <div className="relative w-full h-full p-8">
        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            className="absolute cursor-pointer group"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => handleNodeClick(node.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Connection lines */}
            {index < nodes.length - 1 && (
              <motion.div
                className="absolute top-1/2 left-full w-20 h-0.5 bg-gradient-to-r from-white/40 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: activeNode >= index ? 1 : 0.3 }}
                transition={{ duration: 0.8, delay: activeNode >= index ? 0.2 : 0 }}
                style={{ transformOrigin: 'left' }}
              />
            )}

            {/* Node circle */}
            <motion.div
              className={`w-16 h-16 bg-gradient-to-r ${node.color} rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20`}
              animate={{
                scale: activeNode === index ? [1, 1.2, 1] : 1,
                boxShadow: activeNode === index
                  ? ['0 0 0 0 rgba(255,255,255,0.3)', '0 0 0 20px rgba(255,255,255,0)', '0 0 0 0 rgba(255,255,255,0)']
                  : '0 8px 32px rgba(0,0,0,0.3)'
              }}
              transition={{
                duration: 0.6,
                repeat: activeNode === index && isAnimating ? Infinity : 0,
                repeatDelay: 1
              }}
            >
              <span className="text-white font-bold text-xs">{index + 1}</span>
            </motion.div>

            {/* Node label */}
            <motion.div
              className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: activeNode === index ? 1 : 0.7,
                y: activeNode === index ? 0 : 10
              }}
              transition={{ duration: 0.3 }}
            >
              {node.label}
            </motion.div>

            {/* Hover tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap pointer-events-none">
              Click to interact
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
            </div>
          </motion.div>
        ))}

        {/* Central pulse effect */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/60 rounded-full"
          animate={{
            scale: [0, 2, 0],
            opacity: [1, 0, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      </div>

      {/* Interactive overlay */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">Interactive 3D Roadmap</h4>
              <p className="text-sm text-gray-300">
                Currently viewing: {nodes[activeNode].label}
              </p>
            </div>
            <motion.div
              className="flex space-x-1"
              layout
            >
              {nodes.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= activeNode ? 'bg-white' : 'bg-white/30'
                  }`}
                  animate={{ scale: index === activeNode ? 1.2 : 1 }}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Feature callouts */}
      <motion.div
        className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Live Collaboration
      </motion.div>

      <motion.div
        className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        AI-Powered
      </motion.div>
    </div>
  );
};

const SplineDemo: React.FC<SplineDemoProps> = ({ className }) => {
  const [use3D, setUse3D] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // For now, we'll use the mock interactive demo
  // In production, this would load the actual Spline scene
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setIsLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return <SplineFallback />;
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <MockInteractive3D />
    </div>
  );
};

export default SplineDemo;