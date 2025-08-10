
import React, { useState } from 'react';
import { Task } from '../types';
import { Plus, Sparkles } from './Icons';
import { breakdownAndAssignTask } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const TaskManagement: React.FC = () => {
  const { user } = useAuth();
  const [newTaskText, setNewTaskText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim() === '' || !user) return;

    setIsProcessing(true);
    setError('');

    try {
        const brokenDownTask = await breakdownAndAssignTask(newTaskText);
        
        const userTasksKey = `${user.id}-hotelBrendleTasks`;
        const existingTasksJSON = localStorage.getItem(userTasksKey);
        const existingTasks: Task[] = existingTasksJSON ? JSON.parse(existingTasksJSON) : [];
        
        const newTaskItem: Task = {
            id: Date.now(),
            completed: false,
            ...brokenDownTask
        };
        
        // Unset 'isNew' flag on older tasks
        const updatedOldTasks = existingTasks.map(t => ({...t, isNew: false}));

        const newTaskList = [newTaskItem, ...updatedOldTasks];
        localStorage.setItem(userTasksKey, JSON.stringify(newTaskList));

        // Manually dispatch a storage event so other components (like Staff Dashboard) can react
        window.dispatchEvent(new StorageEvent('storage', { key: userTasksKey }));

        setNewTaskText('');

    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div>
        <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="e.g., Repaint room 112"
            className="flex-grow w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500 outline-none transition"
          />
          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full sm:w-auto bg-brand-primary-600 text-white p-2.5 rounded-md hover:bg-brand-primary-700 transition flex items-center justify-center gap-2 font-semibold disabled:bg-slate-400 disabled:cursor-wait"
           >
            {isProcessing ? <><LoadingSpinner />Processing...</> : <><Sparkles className="w-5 h-5"/> Delegate Task</>}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default TaskManagement;