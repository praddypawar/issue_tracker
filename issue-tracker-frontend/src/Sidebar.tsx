import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Issues', path: '/issues' },
    { name: 'Team', path: '/team' },
    { name: 'Reports', path: '/reports' },
    { name: 'Settings', path: '/settings' },
];

const Sidebar: React.FC = () => {
    const location = useLocation();

    return (
        <aside className="w-64 bg-white shadow-lg flex flex-col min-h-screen">
            <div className="flex items-center justify-center h-16 border-b">
                <span className="text-lg font-bold text-indigo-600">Issue Tracker</span>
            </div>
            <nav className="flex-1 py-4">
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `block px-6 py-3 rounded-l-full text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition font-medium ${isActive || location.pathname === item.path ? 'bg-indigo-100 text-indigo-700 font-semibold' : ''
                                    }`
                                }
                                aria-current={location.pathname === item.path ? 'page' : undefined}
                            >
                                {item.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t">
                <button
                    className="w-full py-2 px-4 bg-red-100 text-red-600 rounded hover:bg-red-200 font-medium transition"
                // TODO: Add logout logic
                >
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar; 