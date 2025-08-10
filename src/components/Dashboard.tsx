
import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import TaskManagement from './TaskManagement';
import OccupancyChart from './OccupancyChart';
import FeedbackAnalysis from './FeedbackAnalysis';
import TimeClock from './TimeClock';
import ManagerDirective from './ManagerDirective';
import { TrendingUp, UserCheck, Star, Sparkles, Zap, AlertTriangle, ClipboardList, ThumbsUp, PauseCircle, Check, ListTodo, MessageSquare, LayoutDashboard, Archive } from './Icons';
import { generateDashboardSummary, getOperationalInsights, analyzeTasksWithDirective } from '../services/geminiService';
import { OperationalAlert, UserRole, Task, SubTask, InventoryItem } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const priorityConfig = {
    'High': { icon: <AlertTriangle className="w-6 h-6 text-red-500" />, ring: 'ring-red-500/50' },
    'Medium': { icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />, ring: 'ring-yellow-500/50' },
    'Low': { icon: <AlertTriangle className="w-6 h-6 text-blue-500" />, ring: 'ring-blue-500/50' },
};

const aiStatusIcon = {
    'Approved': <ThumbsUp className="w-5 h-5 text-green-500" />,
    'On Hold': <PauseCircle className="w-5 h-5 text-yellow-500" />,
};

interface DashboardProps {
  currentUserRole: UserRole;
}

const StaffDashboard: React.FC = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [directive, setDirective] = useState('');
    const [analyzedTasks, setAnalyzedTasks] = useState<Task[]>([]);

    const loadData = async () => {
        if (!user) return;
        setIsLoading(true);
        const storedTasks = JSON.parse(localStorage.getItem(`${user.id}-hotelBrendleTasks`) || '[]');
        const storedDirective = localStorage.getItem(`${user.id}-hotelBrendleDirective`) || '';
        
        setTasks(storedTasks);
        setDirective(storedDirective);

        if (storedDirective && storedTasks.length > 0) {
            const results = await analyzeTasksWithDirective(storedDirective, storedTasks);
            setAnalyzedTasks(results);
        } else {
            setAnalyzedTasks(storedTasks);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
        // Listen for changes from the admin directive component
        const handleStorageChange = (event: StorageEvent) => {
             if (event.key === `${user?.id}-hotelBrendleDirective` || event.key === `${user?.id}-hotelBrendleTasks`) {
                loadData();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => window.removeEventListener('storage', handleStorageChange);
    }, [user]);

    const toggleSubTask = (taskId: number, subTaskIndex: number) => {
        if (!user) return;
        const newTasks = analyzedTasks.map(task => {
            if (task.id === taskId && task.subTasks) {
                const newSubTasks = task.subTasks.map((st, i) => i === subTaskIndex ? {...st, completed: !st.completed} : st);
                return {...task, subTasks: newSubTasks};
            }
            return task;
        });
        setAnalyzedTasks(newTasks);
        localStorage.setItem(`${user.id}-hotelBrendleTasks`, JSON.stringify(newTasks));
    };

    return (
        <div className="space-y-8 animate-fade-in">
             <TimeClock />

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Manager's Directive for Today</h2>
                <p className="text-slate-600 dark:text-slate-300 italic">"{directive || 'No directive set yet.'}"</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-brand-primary-500"/> Your Daily Tasks
                </h2>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <LoadingSpinner />
                        <span className="ml-4">Analyzing tasks...</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {analyzedTasks.map((task) => (
                            <div key={task.id} className={`p-4 rounded-lg border ${task.isNew ? 'border-brand-primary-500 bg-brand-primary-50 dark:bg-brand-primary-900/20' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent'}`}>
                                <h3 className="font-bold text-slate-800 dark:text-white">{task.text}</h3>
                                {task.note && (
                                    <div className="flex items-center gap-2 mt-2 text-sm">
                                        {aiStatusIcon[task.aiStatus!]}
                                        <span className={`font-semibold ${task.aiStatus === 'On Hold' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>{task.aiStatus}:</span>
                                        <span className="text-slate-500 dark:text-slate-400">{task.note}</span>
                                    </div>
                                )}
                                {task.subTasks && task.subTasks.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                        <h4 className="text-sm font-semibold flex items-center gap-2"><ListTodo className="w-4 h-4" /> Action Steps:</h4>
                                        {task.subTasks.map((st, index) => (
                                             <div key={index} className="flex items-center gap-3 pl-2">
                                                <input
                                                    type="checkbox"
                                                    id={`subtask-${task.id}-${index}`}
                                                    checked={st.completed}
                                                    onChange={() => toggleSubTask(task.id, index)}
                                                    className="h-4 w-4 rounded border-gray-300 text-brand-primary-600 focus:ring-brand-primary-500 cursor-pointer"
                                                />
                                                <label htmlFor={`subtask-${task.id}-${index}`} className={`text-sm ${st.completed ? 'line-through text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    <span className="font-medium text-brand-primary-600 dark:text-brand-primary-400">@{st.assignee}:</span> {st.text}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const InventoryAlerts: React.FC = () => {
    const { user } = useAuth();
    const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

    const loadInventory = () => {
        if (!user) return;
        const inventory = JSON.parse(localStorage.getItem(`${user.id}-hotelBrendleInventory`) || '[]');
        const lowItems = inventory.filter((i: InventoryItem) => i.status === 'Low Stock' || i.status === 'Out of Stock');
        setLowStockItems(lowItems);
    }

    useEffect(() => {
        loadInventory();
        const handleStorage = (e: StorageEvent) => {
            if (e.key === `${user?.id}-hotelBrendleInventory`) {
                loadInventory();
            }
        }
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [user]);

    if (lowStockItems.length === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
                <Archive className="w-6 h-6 text-brand-primary-500" /> Inventory Alerts
            </h2>
            <div className="space-y-3">
                {lowStockItems.map(item => (
                     <div key={item.id} className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-900/70 ring-1 ${item.status === 'Out of Stock' ? 'ring-red-500/50' : 'ring-yellow-500/50'}`}>
                        <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 pt-0.5">
                                <AlertTriangle className={`w-5 h-5 ${item.status === 'Out of Stock' ? 'text-red-500' : 'text-yellow-500'}`} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-slate-800 dark:text-white">{item.name}</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                    Status: <span className="font-bold">{item.status}</span> (Quantity: {item.quantity})
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const AdminDashboard: React.FC = () => {
    const [summary, setSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(true);
    const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
    const [isAlertsLoading, setIsAlertsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'feedback'>('overview');

    useEffect(() => {
        const fetchSummary = async () => {
            setIsSummaryLoading(true);
            try {
                const result = await generateDashboardSummary();
                setSummary(result);
            } catch (error) {
                console.error(error);
                setSummary("Could not load AI summary. Please check your connection or API key.");
            } finally {
                setIsSummaryLoading(false);
            }
        };
        const fetchAlerts = async () => {
            setIsAlertsLoading(true);
            try {
                const result = await getOperationalInsights();
                setAlerts(result);
            } catch (error) {
                console.error(error);
            } finally {
                setIsAlertsLoading(false);
            }
        };

        fetchSummary();
        fetchAlerts();
    }, []);

    const TabButton: React.FC<{tabId: typeof activeTab, label: string, icon: React.ReactNode}> = ({ tabId, label, icon}) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                activeTab === tabId
                ? 'text-brand-primary-600 dark:text-brand-primary-400 border-brand-primary-500'
                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
            }`}
        >
            {icon} {label}
        </button>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="border-b border-slate-200 dark:border-slate-700 flex">
                <TabButton tabId="overview" label="Overview & Command" icon={<LayoutDashboard className="w-5 h-5"/>} />
                <TabButton tabId="feedback" label="Guest Feedback" icon={<MessageSquare className="w-5 h-5"/>} />
            </div>

            {activeTab === 'overview' && (
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-brand-primary-500" /> AI Daily Briefing
                        </h2>
                        {isSummaryLoading ? (
                            <div className="space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 animate-pulse"></div>
                            </div>
                        ) : (
                            <p className="text-slate-600 dark:text-slate-300">{summary}</p>
                        )}
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                            <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
                            <Zap className="w-6 h-6 text-brand-primary-500" /> AI Renovation Alerts
                        </h2>
                        {isAlertsLoading ? (
                            <div className="space-y-2">
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3 animate-pulse"></div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alerts.map(alert => (
                                    <div key={alert.id} className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-900/70 ring-1 ${priorityConfig[alert.priority].ring} ring-opacity-50`}>
                                        <div className="flex items-start gap-2">
                                            <div className="flex-shrink-0 pt-0.5">{priorityConfig[alert.priority].icon}</div>
                                            <div>
                                                <h3 className="font-semibold text-sm text-slate-800 dark:text-white">{alert.title}</h3>
                                                <p className="text-xs text-slate-600 dark:text-slate-300">{alert.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <InventoryAlerts />

                <ManagerDirective />
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                     <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Delegate New High-Level Task</h2>
                     <TaskManagement />
                </div>
            </div>
            )}
            {activeTab === 'feedback' && (
                <FeedbackAnalysis />
            )}
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ currentUserRole }) => {
    if (currentUserRole === 'staff') {
        return <StaffDashboard />;
    }
    // Guests are redirected, so we only need to handle admin here
    return <AdminDashboard />;
};

export default Dashboard;