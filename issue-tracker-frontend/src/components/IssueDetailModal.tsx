import React, { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { UPDATE_ISSUE, DELETE_ISSUE } from '../graphql/mutations';
import { GET_ISSUES, GET_TAGS } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

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
    tags?: Tag[];
    enhancedDescription?: string; // Added enhancedDescription to the Issue interface
}

interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    createdAt: string;
}

interface Tag {
    id: string;
    name: string;
    color?: string;
}

interface IssueDetailModalProps {
    issue: Issue | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    users: User[];
}

const GET_COMMENTS = gql`
  query GetComments($issueId: Int!) {
    comments(issueId: $issueId) {
      id
      issueId
      userId
      content
      createdAt
    }
  }
`;

const ADD_COMMENT = gql`
  mutation AddComment($input: CommentCreateInput!) {
    addComment(input: $input) {
      id
      issueId
      userId
      content
      createdAt
    }
  }
`;

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({ issue, isOpen, onClose, onSuccess, users }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Issue>>({});
    const { user } = useAuth();
    const { data: commentsData, refetch: refetchComments } = useQuery(GET_COMMENTS, {
        variables: { issueId: issue ? parseInt(issue.id) : 0 },
        skip: !issue,
        fetchPolicy: 'network-only',
    });
    const { data: tagsData } = useQuery(GET_TAGS);
    const tags: Tag[] = tagsData?.tags || [];
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(issue?.tags?.map((t: Tag) => t.id) || []);
    const [addComment] = useMutation(ADD_COMMENT);
    const [commentText, setCommentText] = useState('');
    const [commentError, setCommentError] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    const [updateIssue, { loading: updating }] = useMutation(UPDATE_ISSUE, {
        refetchQueries: [{ query: GET_ISSUES }],
        onCompleted: () => {
            setIsEditing(false);
            onSuccess?.();
        },
        onError: (error) => {
            console.error('Error updating issue:', error);
            alert(`Error updating issue: ${error.message}`);
        }
    });

    const [deleteIssue, { loading: deleting }] = useMutation(DELETE_ISSUE, {
        refetchQueries: [{ query: GET_ISSUES }],
        onCompleted: () => {
            onSuccess?.();
            onClose();
        },
        onError: (error) => {
            console.error('Error deleting issue:', error);
            alert(`Error deleting issue: ${error.message}`);
        }
    });

    const handleEdit = () => {
        if (issue) {
            setEditData({
                title: issue.title,
                description: issue.description,
                priority: issue.priority,
                status: issue.status,
                assigneeId: issue.assigneeId,
            });
            setSelectedTagIds(issue.tags?.map((t: Tag) => t.id) || []);
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        if (!issue || !editData.title?.trim() || !editData.description?.trim()) {
            alert('Please fill in all required fields');
            return;
        }
        try {
            await updateIssue({
                variables: {
                    input: {
                        id: parseInt(issue.id),
                        title: editData.title.trim(),
                        description: editData.description.trim(),
                        priority: editData.priority,
                        status: editData.status,
                        assigneeId: editData.assigneeId,
                        tagIds: selectedTagIds.map(id => parseInt(id)),
                    }
                }
            });
        } catch (error) {
            console.error('Failed to update issue:', error);
        }
    };

    const handleDelete = () => {
        if (!issue) return;

        if (window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
            deleteIssue({
                variables: {
                    id: parseInt(issue.id)
                }
            });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData({});
    };

    const handleAddComment = async () => {
        setCommentError('');
        if (!commentText.trim()) {
            setCommentError('Comment cannot be empty.');
            return;
        }
        if (!user || !issue) {
            setCommentError('You must be logged in to comment.');
            return;
        }
        setCommentLoading(true);
        try {
            await addComment({
                variables: {
                    input: {
                        issueId: parseInt(issue.id),
                        userId: user.id ? parseInt(user.id) : 1, // fallback to 1 if missing
                        content: commentText.trim(),
                    },
                },
            });
            setCommentText('');
            refetchComments();
        } catch (e) {
            setCommentError('Failed to add comment.');
        } finally {
            setCommentLoading(false);
        }
    };

    const handleTagToggle = (tagId: string) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUserName = (userId: number) => {
        const user = users.find((u: User) => parseInt(u.id) === userId);
        if (!user) return 'Unknown User';
        return user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username || user.email;
    };

    if (!isOpen || !issue) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {isEditing ? 'Edit Issue' : 'Issue Details'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {isEditing ? (
                        /* Edit Form */
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={editData.title || ''}
                                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    value={editData.description || ''}
                                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={editData.priority || issue.priority}
                                        onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value as any }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={editData.status || issue.status}
                                        onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as any }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="OPEN">Open</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assignee
                                </label>
                                <select
                                    value={editData.assigneeId || ''}
                                    onChange={(e) => setEditData(prev => ({ ...prev, assigneeId: e.target.value ? parseInt(e.target.value) : undefined }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Unassigned</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.firstName && user.lastName
                                                ? `${user.firstName} ${user.lastName}`
                                                : user.username || user.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map(tag => (
                                        <button
                                            type="button"
                                            key={tag.id}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${selectedTagIds.includes(tag.id)
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-indigo-50'} `}
                                            style={tag.color ? { backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : undefined, color: selectedTagIds.includes(tag.id) ? '#fff' : undefined, borderColor: tag.color } : {}}
                                            onClick={() => handleTagToggle(tag.id)}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                                {selectedTagIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {tags.filter(tag => selectedTagIds.includes(tag.id)).map(tag => (
                                            <span key={tag.id} className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-xs font-medium" style={tag.color ? { backgroundColor: tag.color, color: '#fff' } : {}}>
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* View Mode */
                        <>
                            {/* Issue Title and Status Labels */}
                            <div className="flex items-center gap-4 mb-2">
                                <h2 className="text-2xl font-bold flex-1 truncate">{issue.title}</h2>
                                <div className="flex gap-2 items-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200`}>{issue.status}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200`}>{issue.priority}</span>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                                    {issue.description}
                                </p>
                            </div>

                            {/* Enhanced Description */}
                            {issue.enhancedDescription && (
                                <div>
                                    <h4 className="text-sm font-medium text-indigo-700 mb-2 mt-4">AI-Enhanced Description</h4>
                                    <div
                                        className="prose prose-indigo bg-indigo-50 p-4 rounded-lg border border-indigo-100"
                                        dangerouslySetInnerHTML={{ __html: issue.enhancedDescription }}
                                    />
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Issue ID</h4>
                                    <p className="text-gray-900">#{issue.id}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Reporter</h4>
                                    <p className="text-gray-900">{getUserName(issue.reporterId)}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Assignee</h4>
                                    <p className="text-gray-900">
                                        {issue.assigneeId ? getUserName(issue.assigneeId) : 'Unassigned'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Created</h4>
                                    <p className="text-gray-900">{formatDate(issue.createdAt)}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Last Updated</h4>
                                    <p className="text-gray-900">{formatDate(issue.updatedAt)}</p>
                                </div>
                            </div>
                            {/* Tags */}
                            {issue.tags && issue.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {issue.tags.map((tag: Tag) => (
                                        <span key={tag.id} className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-xs font-medium" style={tag.color ? { backgroundColor: tag.color, color: '#fff' } : {}}>
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Comments Section */}
                <div className="mt-8 w-full">
                    <h3 className="text-lg font-semibold mb-2 pl-6">Comments</h3>
                    <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto space-y-4 border border-gray-200">
                        {commentsData?.comments?.length === 0 && (
                            <div className="text-gray-400">No comments yet.</div>
                        )}
                        {commentsData?.comments?.map((comment: any) => (
                            <div key={comment.id} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center font-bold text-purple-700 text-lg shadow-sm">
                                    {getUserName(comment.userId)[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900 text-sm truncate">
                                            {getUserName(comment.userId)}
                                        </span>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="text-gray-800 text-sm bg-white rounded-lg px-4 py-2 shadow border border-gray-100 break-words">
                                        {comment.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="sticky bottom-0 bg-white pt-4 flex gap-2 border-t border-gray-200 mt-2 z-10 w-full">
                        <input
                            type="text"
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-gray-50"
                            placeholder="Add a comment..."
                            disabled={commentLoading}
                        />
                        <button
                            onClick={handleAddComment}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-indigo-700 transition-colors"
                            disabled={commentLoading}
                        >
                            {commentLoading ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                    {commentError && <div className="text-red-500 text-sm mt-1">{commentError}</div>}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                disabled={updating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={updating}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete Issue'}
                            </button>
                            <button
                                onClick={handleEdit}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Edit Issue
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IssueDetailModal; 