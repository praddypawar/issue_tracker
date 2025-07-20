import React from 'react';

const ReportsPage: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
            </div>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Issue Statistics</h3>
                <div className="h-40 flex items-center justify-center text-gray-400">[Charts will appear here]</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Most issues are resolved within 3 days.</li>
                    <li>High priority issues are assigned promptly.</li>
                    <li>Team collaboration is strong this month.</li>
                </ul>
            </div>
        </div>
    );
};

export default ReportsPage; 