import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Issues', path: '/issues', icon: '📋' },
    { name: 'Team', path: '/team', icon: '👥' },
    { name: 'Reports', path: '/reports', icon: '📈' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
];

const Sidebar: React.FC = () => {
    const location = useLocation();

    return (
        <aside className="w-72 bg-gray-900 text-white flex flex-col min-h-screen">
            <div className="flex items-center justify-center h-16 border-b border-gray-700">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    🎯 Issue Tracker
                </span>
            </div>
            <nav className="flex-1 py-4 px-5">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-300 font-medium ${isActive || location.pathname === item.path
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                                    }`
                                }
                                aria-current={location.pathname === item.path ? 'page' : undefined}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-5 border-t border-gray-700">
                <button className="w-full py-3 px-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 font-medium transition-all">
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar; 