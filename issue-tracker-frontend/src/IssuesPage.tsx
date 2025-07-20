import React from 'react';
import KanbanBoard from '../components/KanbanBoard';

const IssuesPage: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Issues</h2>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium transition">+ New Issue</button>
            </div>
            {/* Kanban board section */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Kanban Board</h3>
                <KanbanBoard />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">All Issues</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            <tr>
                                <td className="px-4 py-2">Fix login bug</td>
                                <td className="px-4 py-2"><span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Open</span></td>
                                <td className="px-4 py-2">High</td>
                                <td className="px-4 py-2">Alice</td>
                                <td className="px-4 py-2">
                                    <button className="text-indigo-600 hover:underline">View</button>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2">Update docs</td>
                                <td className="px-4 py-2"><span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Closed</span></td>
                                <td className="px-4 py-2">Medium</td>
                                <td className="px-4 py-2">Bob</td>
                                <td className="px-4 py-2">
                                    <button className="text-indigo-600 hover:underline">View</button>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2">Add Kanban board</td>
                                <td className="px-4 py-2"><span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">In Progress</span></td>
                                <td className="px-4 py-2">Low</td>
                                <td className="px-4 py-2">Charlie</td>
                                <td className="px-4 py-2">
                                    <button className="text-indigo-600 hover:underline">View</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IssuesPage; 