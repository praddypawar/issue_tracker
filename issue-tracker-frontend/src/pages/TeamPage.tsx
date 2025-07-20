import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USERS, GET_USER_STATS, GET_USER_ACTIVITIES, GET_PERMISSIONS } from '../graphql/queries';
import { CREATE_USER, UPDATE_USER, UPDATE_USER_ROLE, DELETE_USER, INITIALIZE_PERMISSIONS } from '../graphql/mutations';
import {
    UserPlus,
    Edit,
    Trash2,
    Search,
    Filter,
    Activity,
    Shield,
    Users,
    TrendingUp,
    Clock,
    UserCheck,
    UserX,
    Crown,
    Settings,
    Eye,
    EyeOff,
    MoreVertical,
    Calendar,
    BarChart3,
    Target,
    Award,
    Zap
} from 'lucide-react';

interface User {
    id: number;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
    status: 'ACTIVE' | 'INACTIVE' | 'AWAY' | 'SUSPENDED';
    lastLogin?: string;
    createdAt: string;
    updatedAt?: string;
    assignedIssuesCount?: number;
    reportedIssuesCount?: number;
}

interface UserActivity {
    id: number;
    activityType: string;
    description: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

interface UserStats {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    usersByRole: Record<string, number>;
    recentActivity: UserActivity[];
}

interface Permission {
    id: number;
    role: string;
    permissionType: string;
    granted: boolean;
    createdAt: string;
    updatedAt: string;
}

const TeamPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'permissions' | 'analytics'>('members');

    // Queries
    const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(GET_USERS, {
        fetchPolicy: 'network-only',
    });
    const { data: statsData, loading: statsLoading } = useQuery(GET_USER_STATS, {
        fetchPolicy: 'network-only',
    });
    const { data: activitiesData, loading: activitiesLoading } = useQuery(GET_USER_ACTIVITIES, {
        variables: { limit: 20 }
    });
    const { data: permissionsData, loading: permissionsLoading } = useQuery(GET_PERMISSIONS);

    // Mutations
    const [createUser] = useMutation(CREATE_USER);
    const [updateUser] = useMutation(UPDATE_USER);
    const [updateUserRole] = useMutation(UPDATE_USER_ROLE);
    const [deleteUser] = useMutation(DELETE_USER);
    const [initializePermissions] = useMutation(INITIALIZE_PERMISSIONS);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'MEMBER' as 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'AWAY' | 'SUSPENDED'
    });

    // WebSocket connection
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws');

        ws.onopen = () => {
            setIsConnected(true);
            console.log('WebSocket connected');
        };

        ws.onclose = () => {
            setIsConnected(false);
            console.log('WebSocket disconnected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'USER_UPDATED' || data.type === 'USER_CREATED' || data.type === 'USER_DELETED') {
                refetchUsers();
            }
        };

        return () => ws.close();
    }, [refetchUsers]);

    const handleCreateUser = async () => {
        try {
            await createUser({
                variables: {
                    input: {
                        email: formData.email,
                        username: formData.username,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        password: formData.password,
                        role: formData.role,
                        status: formData.status
                    }
                }
            });
            await refetchUsers(); // Refetch users after create
            setShowAddModal(false);
            setFormData({
                email: '',
                username: '',
                firstName: '',
                lastName: '',
                password: '',
                role: 'MEMBER' as 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER',
                status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'AWAY' | 'SUSPENDED'
            });
        } catch (error) {
            console.error('Error creating user:', error);
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        try {
            await updateUser({
                variables: {
                    input: {
                        id: selectedUser.id,
                        email: formData.email,
                        username: formData.username,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        role: formData.role,
                        status: formData.status
                    }
                }
            });
            await refetchUsers(); // Refetch users after update
            setShowEditModal(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleUpdateRole = async (userId: number, newRole: string) => {
        try {
            await updateUserRole({
                variables: {
                    userId,
                    role: newRole
                }
            });
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUser({
                    variables: { id: userId }
                });
                await refetchUsers(); // Refetch users after delete
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const handleInitializePermissions = async () => {
        try {
            await initializePermissions();
            alert('Permissions initialized successfully!');
        } catch (error) {
            console.error('Error initializing permissions:', error);
        }
    };

    const filteredUsers = usersData?.users?.filter((user: User) => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    }) || [];

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-red-100 text-red-800';
            case 'MANAGER': return 'bg-blue-100 text-blue-800';
            case 'MEMBER': return 'bg-green-100 text-green-800';
            case 'VIEWER': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800';
            case 'INACTIVE': return 'bg-gray-100 text-gray-800';
            case 'AWAY': return 'bg-yellow-100 text-yellow-800';
            case 'SUSPENDED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ADMIN': return <Crown className="w-4 h-4" />;
            case 'MANAGER': return <Settings className="w-4 h-4" />;
            case 'MEMBER': return <Users className="w-4 h-4" />;
            case 'VIEWER': return <Eye className="w-4 h-4" />;
            default: return <Users className="w-4 h-4" />;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACTIVE': return <UserCheck className="w-4 h-4" />;
            case 'INACTIVE': return <UserX className="w-4 h-4" />;
            case 'AWAY': return <Clock className="w-4 h-4" />;
            case 'SUSPENDED': return <UserX className="w-4 h-4" />;
            default: return <Users className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActivityIcon = (activityType: string) => {
        switch (activityType) {
            case 'LOGIN': return <UserCheck className="w-4 h-4" />;
            case 'USER_CREATED': return <UserPlus className="w-4 h-4" />;
            case 'USER_UPDATED': return <Edit className="w-4 h-4" />;
            case 'ROLE_CHANGED': return <Shield className="w-4 h-4" />;
            case 'ISSUE_CREATED': return <Target className="w-4 h-4" />;
            case 'ISSUE_UPDATED': return <Edit className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    if (usersLoading || statsLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                    <p className="text-gray-600 mt-2">Manage team members, roles, and permissions</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                            {isConnected ? 'Live' : 'Offline'}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Add Member</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{statsData?.userStats?.totalUsers || 0}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Users</p>
                            <p className="text-2xl font-bold text-gray-900">{statsData?.userStats?.activeUsers || 0}</p>
                        </div>
                        <UserCheck className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">New This Month</p>
                            <p className="text-2xl font-bold text-gray-900">{statsData?.userStats?.newUsersThisMonth || 0}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Activity</p>
                            <p className="text-2xl font-bold text-gray-900">{statsData?.userStats?.recentActivity?.length || 0}</p>
                        </div>
                        <Activity className="w-8 h-8 text-orange-600" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'members'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Team Members
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'activity'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Activity Feed
                        </button>
                        <button
                            onClick={() => setActiveTab('permissions')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'permissions'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Permissions
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Analytics
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {/* Team Members Tab */}
                    {activeTab === 'members' && (
                        <div className="space-y-6">
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="ALL">All Roles</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="MEMBER">Member</option>
                                    <option value="VIEWER">Viewer</option>
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="AWAY">Away</option>
                                    <option value="SUSPENDED">Suspended</option>
                                </select>
                            </div>

                            {/* Users Table */}
                            <div className="bg-white rounded-lg border">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Activity
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Last Login
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredUsers.map((user: User) => (
                                                <tr key={user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                                                    <span className="text-white font-medium">
                                                                        {user.firstName?.[0] || user.username[0]}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {user.firstName} {user.lastName}
                                                                </div>
                                                                <div className="text-sm text-gray-500">{user.email}</div>
                                                                <div className="text-xs text-gray-400">@{user.username}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center space-x-2">
                                                            {getRoleIcon(user.role)}
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                                                                {user.role}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center space-x-2">
                                                            {getStatusIcon(user.status)}
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                                                                {user.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center space-x-2">
                                                                <Target className="w-4 h-4 text-blue-600" />
                                                                <span>{user.assignedIssuesCount || 0} assigned</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <BarChart3 className="w-4 h-4 text-green-600" />
                                                                <span>{user.reportedIssuesCount || 0} reported</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setFormData({
                                                                        email: user.email,
                                                                        username: user.username,
                                                                        firstName: user.firstName || '',
                                                                        lastName: user.lastName || '',
                                                                        password: '',
                                                                        role: user.role,
                                                                        status: user.status
                                                                    });
                                                                    setShowEditModal(true);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <div className="relative">
                                                                <button className="text-gray-600 hover:text-gray-900">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Activity Feed Tab */}
                    {activeTab === 'activity' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                                <button
                                    onClick={() => setShowActivityModal(true)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    View All
                                </button>
                            </div>

                            <div className="space-y-4">
                                {statsData?.userStats?.recentActivity?.slice(0, 10).map((activity: UserActivity) => (
                                    <div key={activity.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-shrink-0">
                                            {getActivityIcon(activity.activityType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                            <p className="text-sm text-gray-500">{formatDate(activity.createdAt)}</p>
                                            {activity.details && (
                                                <p className="text-xs text-gray-400 mt-1">{activity.details}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Permissions Tab */}
                    {activeTab === 'permissions' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Role Permissions</h3>
                                <button
                                    onClick={handleInitializePermissions}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Initialize Permissions
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'].map((role) => (
                                    <div key={role} className="bg-white p-6 rounded-lg border">
                                        <div className="flex items-center space-x-2 mb-4">
                                            {getRoleIcon(role)}
                                            <h4 className="text-lg font-medium text-gray-900">{role}</h4>
                                        </div>

                                        <div className="space-y-2">
                                            {permissionsData?.permissions
                                                ?.filter((perm: Permission) => perm.role === role)
                                                .map((perm: Permission) => (
                                                    <div key={perm.id} className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">{perm.permissionType}</span>
                                                        <div className={`w-3 h-3 rounded-full ${perm.granted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Users by Role */}
                                <div className="bg-white p-6 rounded-lg border">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Users by Role</h4>
                                    <div className="space-y-3">
                                        {Object.entries(statsData?.userStats?.usersByRole || {}).map(([role, count]) => (
                                            <div key={role} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    {getRoleIcon(role)}
                                                    <span className="text-sm font-medium text-gray-700">{role}</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">{count as number}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Activity Summary */}
                                <div className="bg-white p-6 rounded-lg border">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Activity Summary</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Total Users</span>
                                            <span className="text-sm font-bold text-gray-900">{statsData?.userStats?.totalUsers || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Active Users</span>
                                            <span className="text-sm font-bold text-gray-900">{statsData?.userStats?.activeUsers || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">New This Month</span>
                                            <span className="text-sm font-bold text-gray-900">{statsData?.userStats?.newUsersThisMonth || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="MEMBER">Member</option>
                                            <option value="MANAGER">Manager</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="VIEWER">Viewer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                            <option value="AWAY">Away</option>
                                            <option value="SUSPENDED">Suspended</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateUser}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Create User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="MEMBER">Member</option>
                                            <option value="MANAGER">Manager</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="VIEWER">Viewer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                            <option value="AWAY">Away</option>
                                            <option value="SUSPENDED">Suspended</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateUser}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Update User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamPage; 