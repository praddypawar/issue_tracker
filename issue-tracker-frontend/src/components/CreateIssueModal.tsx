import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_ISSUE } from '../graphql/mutations';
import { GET_ISSUES, GET_TAGS } from '../graphql/queries';

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

interface CreateIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    users: User[];
}

interface CreateIssueForm {
    title: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT';
    assigneeId: number | null;
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ isOpen, onClose, onSuccess, users }) => {
    const [formData, setFormData] = useState<CreateIssueForm>({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assigneeId: null
    });
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const { data: tagsData } = useQuery(GET_TAGS);
    const tags: Tag[] = tagsData?.tags || [];

    const [createIssue, { loading }] = useMutation(CREATE_ISSUE, {
        refetchQueries: [{ query: GET_ISSUES }],
        onCompleted: () => {
            setFormData({
                title: '',
                description: '',
                priority: 'MEDIUM',
                assigneeId: null
            });
            onSuccess?.();
            onClose();
        },
        onError: (error) => {
            console.error('Error creating issue:', error);
            alert(`Error creating issue: ${error.message}`);
        }
    });

    const handleTagToggle = (tagId: string) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.description.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await createIssue({
                variables: {
                    input: {
                        title: formData.title.trim(),
                        description: formData.description.trim(),
                        priority: formData.priority,
                        assigneeId: formData.assigneeId || undefined,
                        reporterId: 1, // Mock user ID for now
                        tagIds: selectedTagIds.map(id => parseInt(id)),
                    }
                }
            });
        } catch (error) {
            console.error('Failed to create issue:', error);
        }
    };

    const handleInputChange = (field: keyof CreateIssueForm, value: string | number | null) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Issue</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter issue title"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Describe the issue in detail"
                            required
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                        </label>
                        <select
                            id="priority"
                            value={formData.priority}
                            onChange={(e) => handleInputChange('priority', e.target.value as any)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>

                    {/* Assignee */}
                    <div>
                        <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-2">
                            Assignee (Optional)
                        </label>
                        <select
                            id="assignee"
                            value={formData.assigneeId || ''}
                            onChange={(e) => handleInputChange('assigneeId', e.target.value ? parseInt(e.target.value) : null)}
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

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Issue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateIssueModal; 