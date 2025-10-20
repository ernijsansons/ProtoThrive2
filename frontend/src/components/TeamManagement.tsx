// Ref: CLAUDE.md - Team Management Component for ProtoThrive
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  teamService,
  Team,
  TeamMember,
  Workspace,
  Invitation,
  Department,
  TeamActivity
} from '../services/teamService';
import {
  UserGroupIcon,
  PlusIcon,
  CogIcon,
  UserPlusIcon,
  TrashIcon,
  PencilIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

interface TeamManagementProps {
  workspaceId: string;
  currentUserId: string;
  className?: string;
}

interface TeamCreationForm {
  name: string;
  description: string;
  visibility: 'private' | 'internal' | 'public';
  defaultRole: 'editor' | 'viewer';
}

interface MemberInviteForm {
  email: string;
  role: TeamMember['role'];
  departmentId?: string;
  message?: string;
}

const TeamManagement: React.FC<TeamManagementProps> = ({
  workspaceId,
  currentUserId,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'teams' | 'members' | 'invitations' | 'departments' | 'analytics'>('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  const [showBulkInvite, setShowBulkInvite] = useState(false);

  // Form states
  const [teamForm, setTeamForm] = useState<TeamCreationForm>({
    name: '',
    description: '',
    visibility: 'internal',
    defaultRole: 'editor',
  });
  const [inviteForm, setInviteForm] = useState<MemberInviteForm>({
    email: '',
    role: 'editor',
  });
  const [bulkEmails, setBulkEmails] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [workspaceData, teamsData, invitationsData, departmentsData] = await Promise.all([
        teamService.getWorkspace(workspaceId),
        teamService.getTeams(workspaceId),
        teamService.getInvitations(workspaceId),
        teamService.getDepartments(workspaceId),
      ]);

      setWorkspace(workspaceData);
      setTeams(teamsData);
      setInvitations(invitationsData);
      setDepartments(departmentsData);

      // Load activity for first team
      if (teamsData.length > 0) {
        const activity = await teamService.getTeamActivity(teamsData[0].id);
        setActivities(activity);
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
      setError('Failed to load team management data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamForm.name.trim()) {
      setError('Team name is required');
      return;
    }

    setIsLoading(true);
    try {
      const newTeam = await teamService.createTeam(workspaceId, teamForm);
      setTeams(prev => [...prev, newTeam]);
      setShowCreateTeam(false);
      setTeamForm({
        name: '',
        description: '',
        visibility: 'internal',
        defaultRole: 'editor',
      });
      setSuccess('Team created successfully');
    } catch (error) {
      console.error('Failed to create team:', error);
      setError('Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTeam || !inviteForm.email.trim()) {
      setError('Team and email are required');
      return;
    }

    setIsLoading(true);
    try {
      const invitation = await teamService.createInvitation({
        email: inviteForm.email,
        teamId: selectedTeam.id,
        role: inviteForm.role,
        message: inviteForm.message,
      });

      setInvitations(prev => [...prev, invitation]);
      setShowInviteMember(false);
      setInviteForm({
        email: '',
        role: 'editor',
      });
      setSuccess('Invitation sent successfully');
    } catch (error) {
      console.error('Failed to send invitation:', error);
      setError('Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkInvite = async () => {
    if (!selectedTeam || !bulkEmails.trim()) {
      setError('Team and emails are required');
      return;
    }

    const emails = bulkEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emails.length === 0) {
      setError('No valid emails found');
      return;
    }

    setIsLoading(true);
    try {
      const invitations = emails.map(email => ({
        email,
        role: inviteForm.role,
        departmentId: inviteForm.departmentId,
      }));

      const result = await teamService.bulkInviteMembers(selectedTeam.id, invitations);

      setInvitations(prev => [...prev, ...result.successful]);
      setShowBulkInvite(false);
      setBulkEmails('');

      if (result.failed.length > 0) {
        setError(`${result.successful.length} invitations sent, ${result.failed.length} failed`);
      } else {
        setSuccess(`${result.successful.length} invitations sent successfully`);
      }
    } catch (error) {
      console.error('Failed to send bulk invitations:', error);
      setError('Failed to send bulk invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await teamService.deleteTeam(teamId);
      setTeams(prev => prev.filter(team => team.id !== teamId));
      setSuccess('Team deleted successfully');
    } catch (error) {
      console.error('Failed to delete team:', error);
      setError('Failed to delete team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    setIsLoading(true);
    try {
      await teamService.revokeInvitation(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      setSuccess('Invitation revoked successfully');
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
      setError('Failed to revoke invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-500';
      case 'admin': return 'bg-red-500';
      case 'editor': return 'bg-blue-500';
      case 'viewer': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'suspended': return 'bg-red-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Management</h2>
          {workspace && (
            <p className="text-gray-300 mt-1">
              {workspace.name} • {workspace.usage.membersCount}/{workspace.limits.maxMembers} members
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateTeam(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Team</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBulkInvite(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <UserPlusIcon className="w-4 h-4" />
            <span>Bulk Invite</span>
          </motion.button>
        </div>
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button onClick={clearMessages} className="text-red-300 hover:text-red-100">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>{success}</span>
            </div>
            <button onClick={clearMessages} className="text-green-300 hover:text-green-100">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-700 rounded-lg p-1">
        {[
          { key: 'teams', label: 'Teams', icon: UserGroupIcon },
          { key: 'members', label: 'Members', icon: UserPlusIcon },
          { key: 'invitations', label: 'Invitations', icon: EnvelopeIcon },
          { key: 'departments', label: 'Departments', icon: BuildingOfficeIcon },
          { key: 'analytics', label: 'Analytics', icon: ChartBarIcon },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-cyan-500 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-3 text-gray-300">Loading...</span>
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && !isLoading && (
        <div className="space-y-4">
          {teams.map(team => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-700 rounded-lg p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                    <p className="text-gray-300 text-sm">{team.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTeam(team);
                      setShowInviteMember(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg"
                    title="Invite Member"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTeam(team);
                      setShowTeamSettings(true);
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg"
                    title="Team Settings"
                  >
                    <CogIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                    title="Delete Team"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-cyan-400">{team.stats.memberCount}</div>
                  <div className="text-sm text-gray-300">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-400">{team.stats.activeMembers}</div>
                  <div className="text-sm text-gray-300">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-400">{team.stats.roadmapsCount}</div>
                  <div className="text-sm text-gray-300">Roadmaps</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-400">
                    {(team.stats.collaborationScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-300">Collaboration</div>
                </div>
              </div>

              {/* Team Members Preview */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Members</h4>
                <div className="flex -space-x-2">
                  {team.members.slice(0, 5).map(member => (
                    <div
                      key={member.id}
                      className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-gray-700"
                      title={member.name}
                    >
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {team.members.length > 5 && (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs border-2 border-gray-700">
                      +{team.members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {teams.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No teams yet</h3>
              <p className="text-gray-500 mb-4">Create your first team to get started with collaboration</p>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg"
              >
                Create Team
              </button>
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && !isLoading && (
        <div className="space-y-4">
          {teams.map(team => (
            <div key={team.id} className="bg-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-4">{team.name}</h3>
              <div className="space-y-3">
                {team.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{member.name}</div>
                        <div className="text-sm text-gray-300">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs text-white ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`}></span>
                      <button
                        className="text-gray-400 hover:text-white"
                        title="Edit Member"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && !isLoading && (
        <div className="space-y-4">
          {invitations.map(invitation => (
            <motion.div
              key={invitation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="w-8 h-8 text-gray-400" />
                <div>
                  <div className="font-medium text-white">{invitation.email}</div>
                  <div className="text-sm text-gray-300">
                    Role: {invitation.role} •
                    Status: <span className={`${
                      invitation.status === 'pending' ? 'text-yellow-400' :
                      invitation.status === 'accepted' ? 'text-green-400' :
                      invitation.status === 'declined' ? 'text-red-400' : 'text-gray-400'
                    }`}>{invitation.status}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {invitation.status === 'pending' && (
                  <button
                    onClick={() => handleRevokeInvitation(invitation.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Revoke
                  </button>
                )}
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite/${invitation.id}`)}
                  className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
                  title="Copy Invitation Link"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}

          {invitations.length === 0 && (
            <div className="text-center py-12">
              <EnvelopeIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No pending invitations</h3>
              <p className="text-gray-500">All team invitations will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Create New Team</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
                  <input
                    type="text"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                    placeholder="Enter team name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={teamForm.description}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                    rows={3}
                    placeholder="Describe your team's purpose"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Visibility</label>
                  <select
                    value={teamForm.visibility}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, visibility: e.target.value as any }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="private">Private</option>
                    <option value="internal">Internal</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Role</label>
                  <select
                    value={teamForm.defaultRole}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, defaultRole: e.target.value as any }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateTeam(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={isLoading}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  {isLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Invite Member to {selectedTeam?.name}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message (Optional)</label>
                  <textarea
                    value={inviteForm.message || ''}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                    rows={3}
                    placeholder="Personal message for the invitation"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteMember(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={isLoading}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Invite Modal */}
      <AnimatePresence>
        {showBulkInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Bulk Invite Members</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Addresses</label>
                  <textarea
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                    rows={8}
                    placeholder="Enter one email per line:&#10;user1@example.com&#10;user2@example.com&#10;user3@example.com"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Enter one email address per line
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBulkInvite(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkInvite}
                  disabled={isLoading}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  {isLoading ? 'Sending...' : 'Send Invitations'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamManagement;