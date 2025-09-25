// Ref: CLAUDE.md - Integration Hub Component for ProtoThrive
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gitService, GitRepository } from '../services/gitService';
import { jiraService, JiraProject, JiraIssue } from '../services/jiraService';
import { slackService, SlackChannel, SlackWorkspace } from '../services/slackService';

export interface IntegrationStatus {
  github: {
    connected: boolean;
    repositories: number;
    lastSync?: string;
    rateLimitRemaining?: number;
  };
  jira: {
    connected: boolean;
    projects: number;
    issues: number;
    lastSync?: string;
    rateLimitRemaining?: number;
  };
  slack: {
    connected: boolean;
    channels: number;
    workspace?: string;
    lastSync?: string;
    rateLimitRemaining?: number;
  };
}

export interface SyncProgress {
  service: 'github' | 'jira' | 'slack';
  status: 'idle' | 'syncing' | 'success' | 'error';
  progress: number;
  message: string;
  error?: string;
}

interface IntegrationHubProps {
  onRoadmapSync?: (data: { nodes: any[]; edges: any[]; metadata: any }) => void;
  className?: string;
}

const IntegrationHub: React.FC<IntegrationHubProps> = ({
  onRoadmapSync,
  className = ''
}) => {
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    github: { connected: false, repositories: 0 },
    jira: { connected: false, projects: 0, issues: 0 },
    slack: { connected: false, channels: 0 },
  });

  const [syncProgress, setSyncProgress] = useState<SyncProgress[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [availableRepos, setAvailableRepos] = useState<GitRepository[]>([]);
  const [availableProjects, setAvailableProjects] = useState<JiraProject[]>([]);
  const [availableChannels, setAvailableChannels] = useState<SlackChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize integrations and check status
  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    setIsLoading(true);
    try {
      // Check GitHub
      try {
        const repos = await gitService.getUserRepositories();
        const rateLimits = gitService.getRateLimitStatus();
        setIntegrationStatus(prev => ({
          ...prev,
          github: {
            connected: true,
            repositories: repos.length,
            lastSync: new Date().toISOString(),
            rateLimitRemaining: rateLimits.github_api_general || 5000,
          },
        }));
        setAvailableRepos(repos);
      } catch (error) {
        console.log('GitHub not connected or error:', error);
      }

      // Check Jira
      try {
        const projects = await jiraService.getProjects();
        const rateLimits = jiraService.getRateLimitStatus();
        setIntegrationStatus(prev => ({
          ...prev,
          jira: {
            connected: true,
            projects: projects.length,
            issues: 0, // Would need to count across all projects
            lastSync: new Date().toISOString(),
            rateLimitRemaining: rateLimits.jira_api_general || 10000,
          },
        }));
        setAvailableProjects(projects);
      } catch (error) {
        console.log('Jira not connected or error:', error);
      }

      // Check Slack
      try {
        const [workspace, channels] = await Promise.all([
          slackService.getWorkspaceInfo(),
          slackService.getChannels({ exclude_archived: true }),
        ]);
        const rateLimits = slackService.getRateLimitStatus();
        setIntegrationStatus(prev => ({
          ...prev,
          slack: {
            connected: true,
            channels: channels.length,
            workspace: workspace.name,
            lastSync: new Date().toISOString(),
            rateLimitRemaining: rateLimits.slack_api_general || 100,
          },
        }));
        setAvailableChannels(channels);
      } catch (error) {
        console.log('Slack not connected or error:', error);
      }
    } catch (error) {
      console.error('Failed to check integration status:', error);
      setError('Failed to check integration status');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSyncProgress = useCallback((
    service: 'github' | 'jira' | 'slack',
    status: SyncProgress['status'],
    progress: number,
    message: string,
    error?: string
  ) => {
    setSyncProgress(prev => {
      const filtered = prev.filter(p => p.service !== service);
      return [...filtered, { service, status, progress, message, error }];
    });
  }, []);

  const syncGitHubRepository = async (repoFullName: string) => {
    try {
      updateSyncProgress('github', 'syncing', 25, `Fetching ${repoFullName}...`);

      const [owner, repo] = repoFullName.split('/');
      updateSyncProgress('github', 'syncing', 50, 'Analyzing repository structure...');

      const roadmapData = await gitService.syncRepositoryToRoadmap(owner, repo);
      updateSyncProgress('github', 'syncing', 75, 'Generating roadmap nodes...');

      onRoadmapSync?.(roadmapData);
      updateSyncProgress('github', 'success', 100, `Successfully synced ${repoFullName}`);

      // Update last sync time
      setIntegrationStatus(prev => ({
        ...prev,
        github: {
          ...prev.github,
          lastSync: new Date().toISOString(),
        },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateSyncProgress('github', 'error', 0, 'Sync failed', errorMessage);
    }
  };

  const syncJiraProject = async (projectKey: string) => {
    try {
      updateSyncProgress('jira', 'syncing', 25, `Fetching project ${projectKey}...`);

      updateSyncProgress('jira', 'syncing', 50, 'Analyzing project structure...');

      const roadmapData = await jiraService.syncProjectToRoadmap(projectKey);
      updateSyncProgress('jira', 'syncing', 75, 'Generating roadmap nodes...');

      onRoadmapSync?.(roadmapData);
      updateSyncProgress('jira', 'success', 100, `Successfully synced ${projectKey}`);

      // Update last sync time
      setIntegrationStatus(prev => ({
        ...prev,
        jira: {
          ...prev.jira,
          lastSync: new Date().toISOString(),
        },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateSyncProgress('jira', 'error', 0, 'Sync failed', errorMessage);
    }
  };

  const syncSlackWorkspace = async () => {
    try {
      updateSyncProgress('slack', 'syncing', 25, 'Fetching workspace data...');

      updateSyncProgress('slack', 'syncing', 50, 'Analyzing channels and users...');

      const roadmapData = await slackService.syncWorkspaceToRoadmap(false);
      updateSyncProgress('slack', 'syncing', 75, 'Generating roadmap nodes...');

      onRoadmapSync?.(roadmapData);
      updateSyncProgress('slack', 'success', 100, 'Successfully synced workspace');

      // Update last sync time
      setIntegrationStatus(prev => ({
        ...prev,
        slack: {
          ...prev.slack,
          lastSync: new Date().toISOString(),
        },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateSyncProgress('slack', 'error', 0, 'Sync failed', errorMessage);
    }
  };

  const clearSyncProgress = (service: 'github' | 'jira' | 'slack') => {
    setSyncProgress(prev => prev.filter(p => p.service !== service));
  };

  const getSyncStatus = (service: 'github' | 'jira' | 'slack') => {
    return syncProgress.find(p => p.service === service);
  };

  const getStatusColor = (connected: boolean) => {
    return connected ? 'bg-green-500' : 'bg-gray-500';
  };

  const getStatusText = (connected: boolean) => {
    return connected ? 'Connected' : 'Not Connected';
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Integration Hub</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={checkIntegrationStatus}
          disabled={isLoading}
          className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {isLoading ? 'Checking...' : 'Refresh Status'}
        </motion.button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6"
        >
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-300 hover:text-red-100"
          >
            ×
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GitHub Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-700 rounded-lg p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">GitHub</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(integrationStatus.github.connected)}`}></div>
                  <span className="text-sm text-gray-300">{getStatusText(integrationStatus.github.connected)}</span>
                </div>
              </div>
            </div>
          </div>

          {integrationStatus.github.connected && (
            <>
              <div className="text-sm text-gray-300 mb-4">
                <div>Repositories: {integrationStatus.github.repositories}</div>
                <div>Rate Limit: {integrationStatus.github.rateLimitRemaining}/5000</div>
                {integrationStatus.github.lastSync && (
                  <div>Last Sync: {new Date(integrationStatus.github.lastSync).toLocaleString()}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Repository to Sync
                </label>
                <select
                  value={selectedRepos[0] || ''}
                  onChange={(e) => setSelectedRepos([e.target.value])}
                  className="w-full bg-gray-600 text-white rounded px-3 py-2 text-sm"
                >
                  <option value="">Choose a repository...</option>
                  {availableRepos.map(repo => (
                    <option key={repo.id} value={repo.fullName}>
                      {repo.fullName} ({repo.language})
                    </option>
                  ))}
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectedRepos[0] && syncGitHubRepository(selectedRepos[0])}
                disabled={!selectedRepos[0] || getSyncStatus('github')?.status === 'syncing'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                {getSyncStatus('github')?.status === 'syncing' ? 'Syncing...' : 'Sync to Roadmap'}
              </motion.button>

              {getSyncStatus('github') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <div className="text-xs text-gray-300 mb-2">{getSyncStatus('github')!.message}</div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getSyncStatus('github')!.status === 'error' ? 'bg-red-500' :
                        getSyncStatus('github')!.status === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${getSyncStatus('github')!.progress}%` }}
                    />
                  </div>
                  {getSyncStatus('github')!.error && (
                    <div className="text-xs text-red-300 mt-1">{getSyncStatus('github')!.error}</div>
                  )}
                  {getSyncStatus('github')!.status !== 'syncing' && (
                    <button
                      onClick={() => clearSyncProgress('github')}
                      className="text-xs text-gray-400 hover:text-gray-200 mt-2"
                    >
                      Clear
                    </button>
                  )}
                </motion.div>
              )}
            </>
          )}
        </motion.div>

        {/* Jira Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-700 rounded-lg p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Jira</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(integrationStatus.jira.connected)}`}></div>
                  <span className="text-sm text-gray-300">{getStatusText(integrationStatus.jira.connected)}</span>
                </div>
              </div>
            </div>
          </div>

          {integrationStatus.jira.connected && (
            <>
              <div className="text-sm text-gray-300 mb-4">
                <div>Projects: {integrationStatus.jira.projects}</div>
                <div>Issues: {integrationStatus.jira.issues}</div>
                <div>Rate Limit: {integrationStatus.jira.rateLimitRemaining}/10000</div>
                {integrationStatus.jira.lastSync && (
                  <div>Last Sync: {new Date(integrationStatus.jira.lastSync).toLocaleString()}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Project to Sync
                </label>
                <select
                  value={selectedProjects[0] || ''}
                  onChange={(e) => setSelectedProjects([e.target.value])}
                  className="w-full bg-gray-600 text-white rounded px-3 py-2 text-sm"
                >
                  <option value="">Choose a project...</option>
                  {availableProjects.map(project => (
                    <option key={project.id} value={project.key}>
                      {project.name} ({project.key})
                    </option>
                  ))}
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectedProjects[0] && syncJiraProject(selectedProjects[0])}
                disabled={!selectedProjects[0] || getSyncStatus('jira')?.status === 'syncing'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                {getSyncStatus('jira')?.status === 'syncing' ? 'Syncing...' : 'Sync to Roadmap'}
              </motion.button>

              {getSyncStatus('jira') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <div className="text-xs text-gray-300 mb-2">{getSyncStatus('jira')!.message}</div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getSyncStatus('jira')!.status === 'error' ? 'bg-red-500' :
                        getSyncStatus('jira')!.status === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${getSyncStatus('jira')!.progress}%` }}
                    />
                  </div>
                  {getSyncStatus('jira')!.error && (
                    <div className="text-xs text-red-300 mt-1">{getSyncStatus('jira')!.error}</div>
                  )}
                  {getSyncStatus('jira')!.status !== 'syncing' && (
                    <button
                      onClick={() => clearSyncProgress('jira')}
                      className="text-xs text-gray-400 hover:text-gray-200 mt-2"
                    >
                      Clear
                    </button>
                  )}
                </motion.div>
              )}
            </>
          )}
        </motion.div>

        {/* Slack Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-700 rounded-lg p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">#</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Slack</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(integrationStatus.slack.connected)}`}></div>
                  <span className="text-sm text-gray-300">{getStatusText(integrationStatus.slack.connected)}</span>
                </div>
              </div>
            </div>
          </div>

          {integrationStatus.slack.connected && (
            <>
              <div className="text-sm text-gray-300 mb-4">
                <div>Workspace: {integrationStatus.slack.workspace}</div>
                <div>Channels: {integrationStatus.slack.channels}</div>
                <div>Rate Limit: {integrationStatus.slack.rateLimitRemaining}/100</div>
                {integrationStatus.slack.lastSync && (
                  <div>Last Sync: {new Date(integrationStatus.slack.lastSync).toLocaleString()}</div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={syncSlackWorkspace}
                disabled={getSyncStatus('slack')?.status === 'syncing'}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                {getSyncStatus('slack')?.status === 'syncing' ? 'Syncing...' : 'Sync Workspace'}
              </motion.button>

              {getSyncStatus('slack') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <div className="text-xs text-gray-300 mb-2">{getSyncStatus('slack')!.message}</div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getSyncStatus('slack')!.status === 'error' ? 'bg-red-500' :
                        getSyncStatus('slack')!.status === 'success' ? 'bg-green-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${getSyncStatus('slack')!.progress}%` }}
                    />
                  </div>
                  {getSyncStatus('slack')!.error && (
                    <div className="text-xs text-red-300 mt-1">{getSyncStatus('slack')!.error}</div>
                  )}
                  {getSyncStatus('slack')!.status !== 'syncing' && (
                    <button
                      onClick={() => clearSyncProgress('slack')}
                      className="text-xs text-gray-400 hover:text-gray-200 mt-2"
                    >
                      Clear
                    </button>
                  )}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Integration Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-gray-700 rounded-lg p-5"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Integration Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {integrationStatus.github.repositories + integrationStatus.jira.projects + integrationStatus.slack.channels}
            </div>
            <div className="text-sm text-gray-300">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {[integrationStatus.github.connected, integrationStatus.jira.connected, integrationStatus.slack.connected].filter(Boolean).length}
            </div>
            <div className="text-sm text-gray-300">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              {syncProgress.filter(p => p.status === 'success').length}
            </div>
            <div className="text-sm text-gray-300">Synced Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {syncProgress.filter(p => p.status === 'error').length}
            </div>
            <div className="text-sm text-gray-300">Errors</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default IntegrationHub;