import React, { useState, useEffect, useMemo } from 'react';
import { Expense } from '../types';
import { getBudgetInsight } from '../services/geminiService';
import { PiggyBank, DollarSign, Sparkles, CloudUpload } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';


const BudgetTracker: React.FC = () => {
    const { user, showToast, saveToDrive, isDriveApiReady } = useAuth();
    const [totalBudget, setTotalBudget] = useState<number>(0);
    const [budgetInput, setBudgetInput] = useState<string>('');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [insight, setInsight] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const STORAGE_KEYS = useMemo(() => {
        if (!user) return null;
        return {
            BUDGET: `${user.id}-renovationTotalBudget`,
            EXPENSES: `${user.id}-renovationExpenses`
        };
    }, [user]);

    const loadDataFromStorage = () => {
        if (!STORAGE_KEYS) return;
        try {
            const storedBudget = localStorage.getItem(STORAGE_KEYS.BUDGET);
            const storedExpensesJSON = localStorage.getItem(STORAGE_KEYS.EXPENSES);

            const budgetValue = storedBudget ? parseFloat(JSON.parse(storedBudget)) : 250000;
            setTotalBudget(budgetValue);
            setBudgetInput(String(budgetValue));
            
            if (storedExpensesJSON) {
                setExpenses(JSON.parse(storedExpensesJSON));
            }

        } catch (error) {
            console.error("Error loading from localStorage", error);
        }
    };

    useEffect(() => {
        loadDataFromStorage();
        
        const handleStorageChange = (e: StorageEvent) => {
            if (!STORAGE_KEYS || (e.key !== STORAGE_KEYS.BUDGET && e.key !== STORAGE_KEYS.EXPENSES)) return;
            loadDataFromStorage();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [STORAGE_KEYS]);

    useEffect(() => {
        const fetchInsight = async () => {
            if (totalBudget > 0 && expenses.length > 0) {
                setIsLoading(true);
                try {
                    const result = await getBudgetInsight(totalBudget, expenses);
                    setInsight(result);
                } catch (error) {
                    console.error(error);
                    setInsight("Could not load AI insight.");
                } finally {
                    setIsLoading(false);
                }
            } else {
                 setIsLoading(false);
                 setInsight("Not enough data for an AI insight.");
            }
        };
        fetchInsight();
    }, [totalBudget, expenses]);

    const { totalSpent, remainingBudget, spentPercentage } = useMemo(() => {
        const spent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const remaining = totalBudget - spent;
        const percentage = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
        return {
            totalSpent: spent,
            remainingBudget: remaining,
            spentPercentage: Math.min(percentage, 100)
        };
    }, [expenses, totalBudget]);
    
    const handleBudgetUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!STORAGE_KEYS) return;
        const newBudget = parseFloat(budgetInput);
        if (!isNaN(newBudget) && newBudget > 0) {
            setTotalBudget(newBudget);
            localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(newBudget));
            showToast("Budget updated successfully!");
        }
    };

    const handleSaveToDrive = () => {
        const dataToSave = JSON.stringify({ totalBudget, expenses }, null, 2);
        const date = new Date().toISOString().split('T')[0];
        saveToDrive(`hotel-brendle-budget-${date}.json`, dataToSave, 'application/json');
    }
    
    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-primary-100 dark:bg-brand-primary-900/50 p-3 rounded-full">
                            <PiggyBank className="w-8 h-8 text-brand-primary-600 dark:text-brand-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Renovation Budget Tracker</h2>
                            <p className="text-slate-500 dark:text-slate-400">Monitor expenses and stay on track.</p>
                        </div>
                    </div>
                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <form onSubmit={handleBudgetUpdate} className="flex items-center gap-2">
                            <label htmlFor="totalBudget" className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Budget:</label>
                            <input
                                type="number"
                                id="totalBudget"
                                value={budgetInput}
                                onChange={(e) => setBudgetInput(e.target.value)}
                                className="w-32 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 focus:ring-2 focus:ring-brand-primary-500 outline-none"
                            />
                            <button type="submit" className="bg-brand-primary-600 text-white text-sm font-semibold py-1.5 px-3 rounded-md hover:bg-brand-primary-700">Set</button>
                        </form>
                        <button 
                            onClick={handleSaveToDrive} 
                            disabled={!isDriveApiReady}
                            className="flex items-center justify-center gap-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-1.5 px-3 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                            <CloudUpload className="w-4 h-4" /> Save to Drive
                        </button>
                    </div>
                </div>

                {/* Stats and Progress */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Total Budget" value={`$${totalBudget.toLocaleString()}`} icon={<DollarSign className="w-8 h-8 text-blue-500" />} />
                    <StatCard title="Total Spent" value={`$${totalSpent.toLocaleString()}`} icon={<DollarSign className="w-8 h-8 text-red-500" />} />
                    <StatCard title="Remaining" value={`$${remainingBudget.toLocaleString()}`} icon={<DollarSign className="w-8 h-8 text-green-500" />} />
                </div>
                
                <div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 mb-2">
                        <div 
                            className={`h-4 rounded-full transition-all duration-500 ${spentPercentage > 90 ? 'bg-red-500' : spentPercentage > 75 ? 'bg-yellow-500' : 'bg-brand-primary-600'}`} 
                            style={{ width: `${spentPercentage}%` }}>
                        </div>
                    </div>
                    <p className="text-right text-sm font-bold text-slate-700 dark:text-slate-200">{spentPercentage.toFixed(1)}% of budget spent</p>
                </div>

                {/* AI Insight */}
                 <div className="mt-8 bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-slate-800 dark:text-white">
                        <Sparkles className="w-5 h-5 text-fuchsia-500" />
                        AI Budget Insight
                    </h3>
                    {isLoading ? (
                         <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                    ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-300 italic">{insight}</p>
                    )}
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Recent Expenses</h2>
                 <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                                <tr key={expense.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/20">
                                    <td className="px-6 py-4 whitespace-nowrap">{expense.date}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{expense.title}</td>
                                    <td className="px-6 py-4">{expense.category}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white text-right">${expense.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
}

// Reusing StatCard but making it less flashy on hover for this page
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-6">
        <div className="bg-slate-200 dark:bg-slate-700 p-3 rounded-full">
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
        </div>
      </div>
    );
  };

export default BudgetTracker;