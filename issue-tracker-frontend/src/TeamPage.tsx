import React from 'react';

const teamMembers = [
    { name: 'Alice', role: 'Frontend Developer', avatar: 'A' },
    { name: 'Bob', role: 'Backend Developer', avatar: 'B' },
    { name: 'Charlie', role: 'Project Manager', avatar: 'C' },
];

const TeamPage: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Team</h2>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium transition">+ Invite Member</button>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Members</h3>
                <ul className="divide-y divide-gray-200">
                    {teamMembers.map((member) => (
                        <li key={member.name} className="flex items-center py-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg mr-4">
                                {member.avatar}
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{member.name}</div>
                                <div className="text-gray-500 text-sm">{member.role}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TeamPage; 