
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RenovationAdvisor from './components/RenovationAdvisor';
import BudgetTracker from './components/BudgetTracker';
import Maintenance from './components/Maintenance';
import HotelPulse from './components/HotelPulse';
import GuestServices from './components/GuestServices';
import LocalGuide from './components/LocalGuide';
import Inventory from './components/InventoryManagement';
import AboutModal from './components/About';
import TimeClock from './components/TimeClock';
import SessionSummarizer from './components/SessionSummarizer';
import BulletinBoard from './components/BulletinBoard';
import FileShare from './components/FileShare';
import Login from './components/Login';
import Toast from './components/Toast';
import { View, UserRole } from './types';
import { Moon, Sun, Palette, Menu } from './components/Icons';
import { useAuth } from './contexts/AuthContext';


type Theme = 'light' | 'dark' | 'brendle';

const ROLES_CONFIG: Record<UserRole, { views: View[], default: View }> = {
  admin: {
    views: ['dashboard', 'hotel-pulse', 'maintenance-repair', 'renovation-advisor', 'budget-tracker', 'inventory', 'session-summarizer', 'bulletin-board', 'file-share'],
    default: 'dashboard'
  },
  staff: {
    views: ['dashboard', 'hotel-pulse', 'maintenance-repair', 'time-clock', 'session-summarizer', 'bulletin-board', 'file-share'],
    default: 'dashboard'
  },
  guest: {
    views: ['guest-services', 'local-guide', 'bulletin-board', 'file-share'],
    default: 'guest-services'
  }
};

const App: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<Theme>('brendle');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'brendle-theme');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'brendle') {
      root.classList.add('brendle-theme');
    }

  }, [theme]);
  
  const handleSetView = (view: View) => {
    if (!user) return;
    const allowedViews = ROLES_CONFIG[user.role].views;
    if (allowedViews.includes(view)) {
      setActiveView(view);
    } else {
      setActiveView(ROLES_CONFIG[user.role].default);
    }
    setIsSidebarOpen(false); // Close sidebar on navigation
  };

  useEffect(() => {
    if (user) {
      const allowedViews = ROLES_CONFIG[user.role].views;
      if (!allowedViews.includes(activeView)) {
        setActiveView(ROLES_CONFIG[user.role].default);
      }
    }
  }, [user, activeView]);

  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard currentUserRole={user.role} />;
      case 'renovation-advisor':
        return <RenovationAdvisor />;
      case 'budget-tracker':
        return <BudgetTracker />;
      case 'maintenance-repair':
        return <Maintenance />;
      case 'hotel-pulse':
        return <HotelPulse currentUserRole={user.role}/>;
      case 'guest-services':
        return <GuestServices />;
      case 'local-guide':
        return <LocalGuide />;
      case 'time-clock':
          return <TimeClock />;
      case 'inventory':
          return <Inventory />;
      case 'session-summarizer':
          return <SessionSummarizer />;
      case 'bulletin-board':
          return <BulletinBoard />;
      case 'file-share':
          return <FileShare />;
      default:
        return <Dashboard currentUserRole={user.role}/>;
    }
  };

  const cycleTheme = () => {
    setTheme(prev => {
        if (prev === 'light') return 'dark';
        if (prev === 'dark') return 'brendle';
        return 'light';
    });
  };

  const ThemeIcon = () => {
    if (theme === 'light') return <Moon className="w-6 h-6" />;
    if (theme === 'dark') return <Sun className="w-6 h-6" />;
    return <Palette className="w-6 h-6" />;
  }
  
  return (
    <>
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
        <Sidebar activeView={activeView} setActiveView={handleSetView} onOpenAbout={() => setIsAboutModalOpen(true)} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm z-20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 rounded-full text-slate-500 dark:text-slate-400">
                  <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-brand-primary-600 dark:text-brand-primary-400">
                Hotel Brendle Orchestrator <span className="hidden sm:inline text-slate-400 dark:text-slate-500 font-normal text-lg">// Renovation Project</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={cycleTheme}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Cycle theme"
              >
                <ThemeIcon />
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8 relative">
            {renderView()}
          </main>
        </div>
      </div>
      {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}
      <Toast />
    </>
  );
};

export default App;