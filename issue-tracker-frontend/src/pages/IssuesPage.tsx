import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import KanbanBoard from '../components/KanbanBoard';
import CreateIssueModal from '../components/CreateIssueModal';
import { useWebSocket } from '../services/websocket';
import { createTestUsers } from '../utils/createTestUsers';
import { createTestIssues } from '../utils/createTestIssues';
import { useApolloClient } from '@apollo/client';
import { GET_ISSUES, GET_TAGS, GET_USERS } from '../graphql/queries';
import { ISSUE_UPDATED_SUBSCRIPTION } from '../graphql/queries';

interface Issue {
    id: string;
    title: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT';
    assigneeId?: number;
    reporterId: number;
    createdAt: string;
    updatedAt: string;
    tags?: { id: string; name: string; color?: string }[];
}

interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    createdAt: string;
}

const IssuesPage: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
    const [tagFilter, setTagFilter] = useState('');

    const { data: issuesData, loading: issuesLoading, error: issuesError, refetch: refetchIssues } = useQuery(GET_ISSUES);
    const { data: usersData, loading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery(GET_USERS);
    const { data: tagsData } = useQuery(GET_TAGS);
    const client = useApolloClient();
    const { subscribe, isConnected } = useWebSocket();

    // Apollo GraphQL subscription for real-time issue updates
    useSubscription(ISSUE_UPDATED_SUBSCRIPTION, {
        onSubscriptionData: () => {
            refetchIssues();
        }
    });

    const issues = issuesData?.issues || [];
    const users = usersData?.users || [];
    const tags = tagsData?.tags || [];

    // Real-time WebSocket updates
    useEffect(() => {
        // Subscribe to issue created events
        const unsubscribeCreated = subscribe('issue_created', (data) => {
            console.log('Issue created via WebSocket:', data);
            refetchIssues();
        });

        // Subscribe to issue updated events
        const unsubscribeUpdated = subscribe('issue_updated', (data) => {
            console.log('Issue updated via WebSocket:', data);
            refetchIssues();
        });

        // Subscribe to issue deleted events
        const unsubscribeDeleted = subscribe('issue_deleted', (data) => {
            console.log('Issue deleted via WebSocket:', data);
            refetchIssues();
        });

        // Cleanup subscriptions on unmount
        return () => {
            unsubscribeCreated();
            unsubscribeUpdated();
            unsubscribeDeleted();
        };
    }, [subscribe, refetchIssues]);

    const handleCreateTestData = async () => {
        await createTestIssues(client);
        refetchIssues();
    };

    const handleCreateTestUsers = async () => {
        await createTestUsers(client);
        refetchUsers();
    };

    const handleCreateSuccess = () => {
        refetchIssues();
    };

    // Helper function to get user name by ID
    const getUserName = (userId: number) => {
        const user = users.find((u: User) => parseInt(u.id) === userId);
        if (!user) return 'Unknown User';
        return user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username || user.email;
    };

    // Filter issues based on search and filters
    const filteredIssues = useMemo(() => issues.filter((issue: Issue) => {
        const matchesSearch = !searchTerm ||
            issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPriority = !priorityFilter ||
            issue.priority.toLowerCase() === priorityFilter.toLowerCase();

        const matchesStatus = !statusFilter ||
            (statusFilter === 'in_progress' && issue.status === 'IN_PROGRESS') ||
            (statusFilter === 'open' && issue.status === 'OPEN') ||
            (statusFilter === 'closed' && issue.status === 'CLOSED');

        const matchesAssignee = !assigneeFilter ||
            (assigneeFilter === 'unassigned' && !issue.assigneeId) ||
            (assigneeFilter !== 'unassigned' && issue.assigneeId?.toString() === assigneeFilter);

        const matchesTag = !tagFilter || (issue.tags && issue.tags.some((tag: any) => String(tag.id) === String(tagFilter)));

        return matchesSearch && matchesPriority && matchesStatus && matchesAssignee && matchesTag;
    }), [issues, searchTerm, priorityFilter, statusFilter, assigneeFilter, tagFilter]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'bg-red-100 text-red-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            case 'LOW': return 'bg-green-100 text-green-800';
            case 'URGENT': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800';
            case 'CLOSED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (issuesLoading || usersLoading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading issues...</div>
                </div>
            </div>
        );
    }

    if (issuesError || usersError) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-red-500">
                        Error loading data: {issuesError?.message || usersError?.message}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Issues</h1>
                        <p className="text-gray-600">Manage and track your project issues</p>
                    </div>
                    {/* Real-time connection status */}
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                            {isConnected() ? 'Real-time connected' : 'Real-time disconnected'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Test Data Button */}
            {/* <div className="mb-6 flex gap-4">
                <button
                    onClick={handleCreateTestData}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Create Test Issues
                </button>
                <button
                    onClick={handleCreateTestUsers}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                    Create Test Users
                </button>
            </div> */}

            {/* Filters Bar */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search issues..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="urgent">Urgent</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select
                        value={assigneeFilter}
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All Assignees</option>
                        <option value="unassigned">Unassigned</option>
                        {users.map((user: User) => (
                            <option key={user.id} value={user.id}>
                                {user.firstName && user.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user.username || user.email}
                            </option>
                        ))}
                    </select>
                    <select
                        value={tagFilter}
                        onChange={e => setTagFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ml-2"
                    >
                        <option value="">All Tags</option>
                        {tags.map((tag: any) => (
                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        + New Issue
                    </button>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">View:</span>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'kanban'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Kanban Board
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'table'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Table View
                    </button>
                </div>
            </div>

            {/* Workflow Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Workflow Instructions</h3>
                <p className="text-blue-700 text-sm">
                    {viewMode === 'kanban'
                        ? 'Drag issues between columns to update their status. The workflow follows: Open → In Progress → Closed'
                        : 'Click on any issue to view details and edit. Use the filters above to find specific issues.'
                    }
                </p>
            </div>

            {/* Content */}
            {viewMode === 'kanban' ? (
                <KanbanBoard filteredIssues={filteredIssues} onRefetch={refetchIssues} />
            ) : (
                /* Table View */
                <div className="bg-white rounded-xl shadow-sm">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            All Issues ({filteredIssues.length})
                        </h3>

                        {filteredIssues.length === 0 ? (
                            <div className="text-center py-8">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-gray-500">No issues found</p>
                                <p className="text-sm text-gray-400">Try adjusting your filters or create a new issue</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Issue
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Priority
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Assignee
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Reporter
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredIssues.map((issue: Issue) => (
                                            <tr key={issue.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {issue.title}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {issue.description}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(issue.status)}`}>
                                                        {issue.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(issue.priority)}`}>
                                                        {issue.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {issue.assigneeId ? getUserName(issue.assigneeId) : 'Unassigned'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {getUserName(issue.reporterId)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(issue.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {issue.tags && issue.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {issue.tags.map((tag: any) => (
                                                                <span key={tag.id} className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-xs font-medium" style={tag.color ? { backgroundColor: tag.color, color: '#fff' } : {}}>
                                                                    {tag.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Issue Modal */}
            <CreateIssueModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                users={users}
            />
        </div>
    );
};

export default IssuesPage; 