import React from 'react';
import { useStore } from '../store';

export default function Home() {
  const { thriveScore, vibeMode, toggleMode } = useStore();
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">ProtoThrive Thermonuclear</h1>
      
      <div className="mb-4">
        <button
          onClick={toggleMode}
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          Toggle Mode: {vibeMode ? 'Vibe' : 'Standard'}
        </button>
      </div>
      
      <div className="mb-4">
        <h2 className="text-2xl mb-2">Thrive Score</h2>
        <div className="w-full bg-gray-800 rounded-full h-4">
          <div
            className="h-4 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full"
            style={{ width: `${thriveScore * 100}%` }}
          />
        </div>
        <p className="mt-2">{(thriveScore * 100).toFixed(1)}%</p>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded">Node 1</div>
        <div className="bg-gray-800 p-4 rounded">Node 2</div>
        <div className="bg-gray-800 p-4 rounded">Node 3</div>
      </div>
    </div>
  );
}

