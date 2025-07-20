import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import IssueDetailModal from '../components/IssueDetailModal';
import { useWebSocket } from '../services/websocket';

// GraphQL Queries
const GET_ISSUES = gql`
  query GetIssues {
    issues {
      id
      title
      description
      status
      priority
      assigneeId
      reporterId
      createdAt
      updatedAt
    }
  }
`;

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      email
      username
      firstName
      lastName
      createdAt
    }
  }
`;

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
}

interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    createdAt: string;
}

const DashboardPage: React.FC = () => {
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: issuesData, loading: issuesLoading, error: issuesError, refetch: refetchIssues } = useQuery(GET_ISSUES);
    const { data: usersData, loading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery(GET_USERS);
    const { subscribe, isConnected } = useWebSocket();

    const issues = issuesData?.issues || [];
    const users = usersData?.users || [];

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

    // Calculate statistics
    const totalIssues = issues.length;
    const openIssues = issues.filter((issue: Issue) => issue.status === 'OPEN').length;
    const inProgressIssues = issues.filter((issue: Issue) => issue.status === 'IN_PROGRESS').length;
    const closedIssues = issues.filter((issue: Issue) => issue.status === 'CLOSED').length;
    const highPriorityIssues = issues.filter((issue: Issue) => issue.priority === 'HIGH' || issue.priority === 'URGENT').length;

    // Get recent issues (last 5)
    const recentIssues = [...issues]
        .sort((a: Issue, b: Issue) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

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

    const handleViewIssue = (issue: Issue) => {
        setSelectedIssue(issue);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedIssue(null);
    };

    const handleCreateTestData = async () => {
        // This would typically call a mutation to create test data
        // For now, we'll just show an alert
        alert('Test data creation would be implemented here. Currently using existing test data.');
    };

    if (issuesLoading || usersLoading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading dashboard...</div>
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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your issues.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Real-time connection status */}
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                            {isConnected() ? 'Real-time connected' : 'Real-time disconnected'}
                        </span>
                    </div>
                    <div className="flex gap-3">
                        {/* <button
                            onClick={handleCreateTestData}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Create Test Data
                        </button> */}
                        <Link
                            to="/issues"
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            View All Issues
                        </Link>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/issues'}>
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Issues</p>
                            <p className="text-2xl font-bold text-gray-900">{totalIssues}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/issues?status=OPEN'}>
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Open</p>
                            <p className="text-2xl font-bold text-gray-900">{openIssues}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/issues?status=IN_PROGRESS'}>
                    <div className="flex items-center">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">In Progress</p>
                            <p className="text-2xl font-bold text-gray-900">{inProgressIssues}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/issues?status=CLOSED'}>
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Closed</p>
                            <p className="text-2xl font-bold text-gray-900">{closedIssues}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/issues?priority=HIGH'}>
                    <div className="flex items-center">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">High Priority</p>
                            <p className="text-2xl font-bold text-gray-900">{highPriorityIssues}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Issues and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Issues */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Issues</h3>
                        {recentIssues.length === 0 ? (
                            <div className="text-center py-8">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-gray-500">No issues yet</p>
                                <p className="text-sm text-gray-400">Create your first issue to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentIssues.map((issue: Issue) => (
                                    <div key={issue.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{issue.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(issue.status)}`}>
                                                    {issue.status.replace('_', ' ')}
                                                </span>
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(issue.priority)}`}>
                                                    {issue.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleViewIssue(issue)}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1 rounded hover:bg-indigo-50 transition-colors"
                                        >
                                            View
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link
                                to="/issues"
                                className="flex items-center p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span className="text-indigo-700 font-medium">Create New Issue</span>
                            </Link>

                            <Link
                                to="/issues"
                                className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-green-700 font-medium">View All Issues</span>
                            </Link>

                            <Link
                                to="/team"
                                className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                                <span className="text-purple-700 font-medium">Manage Team</span>
                            </Link>

                            <Link
                                to="/reports"
                                className="flex items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="text-orange-700 font-medium">View Reports</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Overview</h3>
                    {users.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No team members found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {users.map((user: User) => (
                                <div key={user.id} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => window.location.href = '/team'}>
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span className="text-indigo-600 font-semibold">
                                            {user.firstName?.charAt(0) || user.username?.charAt(0) || 'U'}
                                        </span>
                                    </div>
                                    <div className="ml-3">
                                        <p className="font-medium text-gray-900">
                                            {user.firstName && user.lastName
                                                ? `${user.firstName} ${user.lastName}`
                                                : user.username || user.email}
                                        </p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Issue Detail Modal */}
            <IssueDetailModal
                issue={selectedIssue}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                users={users}
            />
        </div>
    );
};

export default DashboardPage; 