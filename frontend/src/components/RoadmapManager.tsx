/**
 * Roadmap Manager Component
 * Demonstrates CRUD operations with the backend API
 *
 * Ref: CLAUDE.md Phase 2 - API Integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import ProtoThriveApi, { Roadmap, ApiError, useApiState } from '../../lib/api';

interface RoadmapFormData {
  json_graph: string;
  vibe_mode: boolean;
  status: 'draft' | 'active' | 'completed' | 'archived';
}

export default function RoadmapManager() {
  const { user, isAuthenticated } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { loading, error, execute } = useApiState();

  // Form state
  const [formData, setFormData] = useState<RoadmapFormData>({
    json_graph: '{"nodes":[{"id":"n1","label":"Start","status":"pending","position":{"x":0,"y":0,"z":0}}],"edges":[]}',
    vibe_mode: false,
    status: 'draft'
  });

  // Load roadmaps on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadRoadmaps();
    }
  }, [isAuthenticated]);

  const loadRoadmaps = async () => {
    try {
      const data = await execute(() => ProtoThriveApi.getRoadmaps());
      setRoadmaps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load roadmaps:', err);
    }
  };

  const handleCreateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newRoadmap = await execute(() => ProtoThriveApi.createRoadmap(formData));
      if (newRoadmap) {
        setRoadmaps(prev => [newRoadmap as Roadmap, ...prev]);
      }
      setShowCreateForm(false);
      setFormData({
        json_graph: '{"nodes":[{"id":"n1","label":"Start","status":"pending","position":{"x":0,"y":0,"z":0}}],"edges":[]}',
        vibe_mode: false,
        status: 'draft'
      });
    } catch (err) {
      console.error('Failed to create roadmap:', err);
    }
  };

  const handleDeleteRoadmap = async (id: string) => {
    if (!confirm('Are you sure you want to delete this roadmap?')) return;

    try {
      await execute(() => ProtoThriveApi.deleteRoadmap(id));
      setRoadmaps(prev => prev.filter(r => r.id !== id));
      if (selectedRoadmap?.id === id) {
        setSelectedRoadmap(null);
      }
    } catch (err) {
      console.error('Failed to delete roadmap:', err);
    }
  };

  const handleUpdateStatus = async (roadmap: Roadmap, newStatus: Roadmap['status']) => {
    try {
      const updated = await execute(() =>
        ProtoThriveApi.updateRoadmap(roadmap.id, { status: newStatus })
      );
      if (updated) {
        setRoadmaps(prev => prev.map(r => r.id === roadmap.id ? updated as Roadmap : r));
      }
      if (selectedRoadmap?.id === roadmap.id && updated) {
        setSelectedRoadmap(updated as Roadmap);
      }
    } catch (err) {
      console.error('Failed to update roadmap:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">Please log in to manage roadmaps.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">🗺️ Roadmap Manager</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create Roadmap'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Create New Roadmap</h3>
          <form onSubmit={handleCreateRoadmap} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                JSON Graph
              </label>
              <textarea
                value={formData.json_graph}
                onChange={(e) => setFormData(prev => ({ ...prev, json_graph: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Enter JSON graph structure"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Roadmap['status'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.vibe_mode}
                    onChange={(e) => setFormData(prev => ({ ...prev, vibe_mode: e.target.checked }))}
                    className="mr-2"
                  />
                  Vibe Mode
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded transition-colors"
              >
                {loading ? 'Creating...' : 'Create Roadmap'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roadmaps List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roadmaps List */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Your Roadmaps ({roadmaps.length})</h3>
          {loading && roadmaps.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading roadmaps...</span>
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No roadmaps found. Create your first roadmap!
            </div>
          ) : (
            <div className="space-y-3">
              {roadmaps.map((roadmap) => (
                <div
                  key={roadmap.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedRoadmap?.id === roadmap.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRoadmap(roadmap)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Roadmap {roadmap.id.slice(-8)}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded text-xs ${
                          roadmap.status === 'active' ? 'bg-green-100 text-green-800' :
                          roadmap.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          roadmap.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {roadmap.status}
                        </span>
                        {roadmap.vibe_mode && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            Vibe Mode
                          </span>
                        )}
                        <span>Score: {roadmap.thrive_score.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <select
                        value={roadmap.status}
                        onChange={(e) => handleUpdateStatus(roadmap, e.target.value as Roadmap['status'])}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoadmap(roadmap.id);
                        }}
                        className="text-red-500 hover:text-red-700 px-2 py-1 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Roadmap Details */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Roadmap Details</h3>
          {selectedRoadmap ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID</label>
                  <p className="text-sm text-gray-600">{selectedRoadmap.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-600">{selectedRoadmap.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thrive Score</label>
                  <p className="text-sm text-gray-600">{selectedRoadmap.thrive_score}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">JSON Graph</label>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(
                      typeof selectedRoadmap.json_graph === 'string'
                        ? JSON.parse(selectedRoadmap.json_graph)
                        : selectedRoadmap.json_graph,
                      null,
                      2
                    )}
                  </pre>
                </div>
                {selectedRoadmap.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedRoadmap.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
              Select a roadmap to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}