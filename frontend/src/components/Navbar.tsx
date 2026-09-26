import React from 'react';
import { LogOut, User as UserIcon, Shield, Layers, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { NotificationsDropdown } from './NotificationsDropdown';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeUsersCount, isConnected } = useSocket();

  if (!user) return null;

  const roleColors = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    PROJECT_MANAGER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    DEVELOPER: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const roleLabels = {
    ADMIN: 'Administrator',
    PROJECT_MANAGER: 'Project Manager',
    DEVELOPER: 'Developer',
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                VELOZITY
              </span>
              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
                Enterprise
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Sync & Presence Indicator */}
        <div className="hidden md:flex items-center gap-2.5 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200 text-xs shadow-inner">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-700 font-bold tracking-wide">
            {isConnected ? 'Live Sync' : 'Offline'}
          </span>
          {user.role === 'ADMIN' && (
            <>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                {activeUsersCount} Online
              </span>
            </>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <NotificationsDropdown />

          {/* User Info */}
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="p-1.5 bg-slate-100 rounded-full border border-slate-200 text-slate-600">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900">{user.name}</div>
              <span
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  roleColors[user.role]
                }`}
              >
                {roleLabels[user.role]}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
