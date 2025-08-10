
import React, { useState } from 'react';
import { View } from '../types';
import { LayoutDashboard, Lightbulb, PiggyBank, Wrench, Activity, Sparkles, MapPin, Info, ChevronDown, Clock, Archive, Bot, LogOut, X, MessageSquare, CloudUpload } from './Icons';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onOpenAbout: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{
  id: View;
  label: string;
  icon: React.ReactNode;
  activeView: View;
  setActiveView: (view: View) => void;
  colorClass: string;
}> = ({ id, label, icon, activeView, setActiveView, colorClass }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setActiveView(id);
      }}
      className={`flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
        activeView === id
          ? 'bg-brand-primary-600 text-white shadow-md'
          : `text-slate-500 dark:text-slate-400 hover:bg-brand-primary-50 dark:hover:bg-slate-700/50 hover:text-brand-primary-600 dark:hover:text-white`
      }`}
    >
      <span className={colorClass}>{icon}</span>
      <span className="font-medium">{label}</span>
    </a>
  </li>
);

const NavCategory: React.FC<{
  label: string;
  emoji: string;
  children: React.ReactNode;
}> = ({ label, emoji, children }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-2 text-left text-xs font-bold uppercase text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-md">
                <span>{emoji} {label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <ul className="mt-1 space-y-1">{children}</ul>}
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onOpenAbout, isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  if (!user) return null; // Should not happen if App component logic is correct
  const currentUserRole = user.role;

  const operationsViews = (
     <NavCategory label="Operations" emoji="🏨">
      <NavLink id="dashboard" label="Dashboard" icon={<LayoutDashboard className="w-5 h-5"/>} colorClass="text-sky-500" {...{activeView, setActiveView}} />
      <NavLink id="hotel-pulse" label="Hotel Pulse" icon={<Activity className="w-5 h-5"/>} colorClass="text-red-500" {...{activeView, setActiveView}} />
      <NavLink id="maintenance-repair" label="Maintenance" icon={<Wrench className="w-5 h-5"/>} colorClass="text-orange-500" {...{activeView, setActiveView}} />
      {currentUserRole === 'staff' && <NavLink id="time-clock" label="Time Clock" icon={<Clock className="w-5 h-5"/>} colorClass="text-indigo-500" {...{activeView, setActiveView}} />}
    </NavCategory>
  );

  const managementViews = (
    <NavCategory label="Management" emoji="💼">
        <NavLink id="budget-tracker" label="Budget Tracker" icon={<PiggyBank className="w-5 h-5"/>} colorClass="text-green-500" {...{activeView, setActiveView}} />
        <NavLink id="inventory" label="Inventory" icon={<Archive className="w-5 h-5"/>} colorClass="text-cyan-500" {...{activeView, setActiveView}} />
    </NavCategory>
  );
  
  const aiToolsViews = (
    <NavCategory label="AI Tools" emoji="✨">
        {currentUserRole === 'admin' && (
            <NavLink id="renovation-advisor" label="Renovation Advisor" icon={<Lightbulb className="w-5 h-5"/>} colorClass="text-yellow-500" {...{activeView, setActiveView}} />
        )}
        <NavLink id="session-summarizer" label="Session Summarizer" icon={<Bot className="w-5 h-5"/>} colorClass="text-purple-500" {...{activeView, setActiveView}} />
        <NavLink id="bulletin-board" label="Bulletin Board" icon={<MessageSquare className="w-5 h-5"/>} colorClass="text-blue-500" {...{activeView, setActiveView}} />
        <NavLink id="file-share" label="File Share" icon={<CloudUpload className="w-5 h-5"/>} colorClass="text-teal-500" {...{activeView, setActiveView}} />
    </NavCategory>
  );

  const guestViews = (
    <NavCategory label="Guest Experience" emoji="❤️">
      <NavLink id="guest-services" label="Guest Welcome" icon={<Sparkles className="w-5 h-5"/>} colorClass="text-fuchsia-500" {...{activeView, setActiveView}} />
      <NavLink id="local-guide" label="Local Guide" icon={<MapPin className="w-5 h-5"/>} colorClass="text-lime-500" {...{activeView, setActiveView}} />
    </NavCategory>
  );

  return (
    <>
        {/* Overlay for mobile view */}
        <div onClick={() => setIsOpen(false)} className={`fixed inset-0 bg-black/30 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}></div>

        <nav className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col p-4 shadow-lg z-40 transform transition-transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🏨</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-white">Hotel Brendle</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
            </div>
            <div className="flex flex-col gap-4 flex-grow overflow-y-auto pr-2 -mr-2">
                {currentUserRole === 'admin' && (
                    <>
                        {operationsViews}
                        {managementViews}
                        {aiToolsViews}
                    </>
                )}
                {currentUserRole === 'staff' && (
                    <>
                        {operationsViews}
                        {aiToolsViews}
                    </>
                )}
                {currentUserRole === 'guest' && guestViews}
            </div>
            
            <div className="mt-auto space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="px-4 py-2">
                        <div className="flex items-center gap-3">
                            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                            <div>
                                <p className="font-semibold text-sm text-slate-800 dark:text-white">{user.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onOpenAbout}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm text-slate-500 dark:text-slate-400 hover:bg-brand-primary-50 dark:hover:bg-slate-700 hover:text-brand-primary-600 dark:hover:text-white`}
                    >
                        <Info className="w-5 h-5" />
                        <span className="font-medium">About This Project</span>
                    </button>
                    <button
                        onClick={logout}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`}
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                    <div className="text-center pt-2">
                        <p className="text-xs text-slate-400 dark:text-slate-500">&copy; 2025 Hotel Brendle Renovation Project.</p>
                    </div>
            </div>
        </nav>
    </>
  );
};

export default Sidebar;