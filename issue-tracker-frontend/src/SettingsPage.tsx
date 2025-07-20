import React from 'react';

const SettingsPage: React.FC = () => {
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile</h3>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" defaultValue="Pradip Pawar" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" defaultValue="pradip@gmail.com" />
                    </div>
                </form>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Current Password</label>
                        <input type="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input type="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                </form>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h3>
                <form className="space-y-4">
                    <div className="flex items-center">
                        <input id="email-notifications" type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded" defaultChecked />
                        <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-700">Email notifications</label>
                    </div>
                    <div className="flex items-center">
                        <input id="push-notifications" type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                        <label htmlFor="push-notifications" className="ml-2 block text-sm text-gray-700">Push notifications</label>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage; 