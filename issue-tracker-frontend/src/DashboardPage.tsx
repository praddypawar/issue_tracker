import React from 'react';

const DashboardPage: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back, Pradip!</h2>
                    <p className="mt-1 text-gray-600">Here’s a quick overview of your project status.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                    <span className="text-3xl font-bold text-indigo-600">12</span>
                    <span className="mt-2 text-gray-700">Open Issues</span>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                    <span className="text-3xl font-bold text-green-600">34</span>
                    <span className="mt-2 text-gray-700">Closed Issues</span>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                    <span className="text-3xl font-bold text-blue-600">5</span>
                    <span className="mt-2 text-gray-700">Team Members</span>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <ul className="divide-y divide-gray-200">
                    <li className="py-2 flex items-center justify-between">
                        <span className="text-gray-700">Issue <span className="font-medium text-indigo-600">#123</span> was closed by <span className="font-medium">Alice</span></span>
                        <span className="text-xs text-gray-400">2 hours ago</span>
                    </li>
                    <li className="py-2 flex items-center justify-between">
                        <span className="text-gray-700">New issue <span className="font-medium text-indigo-600">#124</span> created by <span className="font-medium">Bob</span></span>
                        <span className="text-xs text-gray-400">3 hours ago</span>
                    </li>
                    <li className="py-2 flex items-center justify-between">
                        <span className="text-gray-700">Team member <span className="font-medium">Charlie</span> joined</span>
                        <span className="text-xs text-gray-400">5 hours ago</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default DashboardPage; 