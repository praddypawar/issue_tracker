import React from 'react';
import Sidebar from '../Common/Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                {/* Topbar */}
                <header className="h-16 bg-white shadow flex items-center px-6">
                    <h1 className="text-xl font-bold text-gray-800">Mini Issue Tracker</h1>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
};

export default Layout; 