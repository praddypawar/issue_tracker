import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useSubscription } from '@apollo/client';
import { useMemo } from 'react';
// If recharts is available, import it. Otherwise, fallback to a simple chart.
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const GET_REPORTS = gql`
  query GetReports {
    issueStats {
      totalIssues
      openIssues
      inProgressIssues
      closedIssues
      myAssignedIssues
      recentActivity {
        id
        activityType
        description
        createdAt
      }
    }
    userStats {
      totalUsers
      activeUsers
      newUsersThisMonth
      usersByRole {
        role
        count
      }
      recentActivity {
        id
        activityType
        description
        createdAt
      }
    }
  }
`;

const ISSUE_CREATED_SUBSCRIPTION = gql`
  subscription OnIssueCreated {
    issueCreated {
      id
      title
      status
      updatedAt
    }
  }
`;

const ISSUE_UPDATED_SUBSCRIPTION = gql`
  subscription OnIssueUpdated {
    issueUpdated {
      id
      title
      status
      updatedAt
    }
  }
`;

const ReportsPage: React.FC = () => {
    const { data, loading, error, refetch } = useQuery(GET_REPORTS, {
        fetchPolicy: 'network-only',
    });

    // Real-time: refetch on issue created/updated
    useSubscription(ISSUE_CREATED_SUBSCRIPTION, {
        onData: () => refetch(),
    });
    useSubscription(ISSUE_UPDATED_SUBSCRIPTION, {
        onData: () => refetch(),
    });

    // All hooks must be called before any return
    const issueStats = data?.issueStats || {};
    const userStats = data?.userStats || {};

    const issueStatusData = useMemo(() => [
        { name: 'Open', value: issueStats.openIssues || 0 },
        { name: 'In Progress', value: issueStats.inProgressIssues || 0 },
        { name: 'Closed', value: issueStats.closedIssues || 0 },
    ], [issueStats]);

    const recentActivities = useMemo(() => [
        ...(issueStats.recentActivity || []),
        ...(userStats.recentActivity || [])
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10), [issueStats, userStats]);

    const handleExport = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Total Issues', issueStats.totalIssues],
            ['Open Issues', issueStats.openIssues],
            ['In Progress Issues', issueStats.inProgressIssues],
            ['Closed Issues', issueStats.closedIssues],
            ['Total Users', userStats.totalUsers],
            ['Active Users', userStats.activeUsers],
            ['New Users This Month', userStats.newUsersThisMonth],
        ];
        const csvContent = rows.map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'report.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading reports...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-red-500">Error loading reports: {error.message}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                    <p className="text-gray-600 mt-2">Analytics and insights for your project</p>
                </div>
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors" onClick={handleExport}>
                    Export Report
                </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Issues</p>
                            <p className="text-2xl font-bold text-gray-900">{issueStats.totalIssues}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Open Issues</p>
                            <p className="text-2xl font-bold text-gray-900">{issueStats.openIssues}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">In Progress</p>
                            <p className="text-2xl font-bold text-gray-900">{issueStats.inProgressIssues}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Closed Issues</p>
                            <p className="text-2xl font-bold text-gray-900">{issueStats.closedIssues}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75M12 14v7m0 0H9m3 0h3" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Users</p>
                            <p className="text-2xl font-bold text-gray-900">{userStats.activeUsers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">New Users This Month</p>
                            <p className="text-2xl font-bold text-gray-900">{userStats.newUsersThisMonth}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Issues by Status Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Issues by Status</h3>
                <div className="flex space-x-6">
                    {issueStatusData.map((item) => (
                        <div key={item.name} className="flex flex-col items-center">
                            <div className="h-24 w-8 bg-indigo-100 rounded-t-lg flex items-end">
                                <div
                                    className="bg-indigo-600 w-8 rounded-t-lg"
                                    style={{ height: `${item.value * 10 || 2}px`, minHeight: '2px' }}
                                ></div>
                            </div>
                            <span className="mt-2 text-sm text-gray-700">{item.name}</span>
                            <span className="text-lg font-bold text-gray-900">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity Log */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <ul className="divide-y divide-gray-100">
                    {recentActivities.length === 0 && (
                        <li className="py-2 text-gray-400">No recent activity.</li>
                    )}
                    {recentActivities.map((activity, idx) => (
                        <li key={activity.id || idx} className="py-2 flex flex-col md:flex-row md:items-center md:space-x-4">
                            <span className="text-sm text-gray-700 font-medium">{activity.activityType || 'Activity'}</span>
                            <span className="text-gray-500 text-sm">{activity.description}</span>
                            <span className="text-xs text-gray-400 ml-auto">{new Date(activity.createdAt).toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            </div>

        </div>
    );
};

export default ReportsPage; 