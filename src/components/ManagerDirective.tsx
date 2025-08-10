
import React, { useState, useEffect } from 'react';
import { Sparkles } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const ManagerDirective: React.FC = () => {
    const { user } = useAuth();
    const [directive, setDirective] = useState('');
    const [lastSetDirective, setLastSetDirective] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    const userDirectiveKey = user ? `${user.id}-hotelBrendleDirective` : null;

    useEffect(() => {
        if (userDirectiveKey) {
            const storedDirective = localStorage.getItem(userDirectiveKey) || '';
            setDirective(storedDirective);
            setLastSetDirective(storedDirective);
        }
    }, [userDirectiveKey]);

    const handleSetDirective = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userDirectiveKey) return;
        setIsProcessing(true);
        
        localStorage.setItem(userDirectiveKey, directive);
        window.dispatchEvent(new StorageEvent('storage', { key: userDirectiveKey }));

        await new Promise(resolve => setTimeout(resolve, 1000));
        setLastSetDirective(directive);
        setIsProcessing(false);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-white">Set Today's Directive</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Enter your main goal for the team today. The AI will analyze the task list and provide guidance to the staff based on your directive.
            </p>
            <form onSubmit={handleSetDirective} className="space-y-4">
                <textarea
                    value={directive}
                    onChange={(e) => setDirective(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary-500 outline-none transition"
                    placeholder="e.g., Prioritize guest-facing areas. All other tasks are secondary."
                />
                <button
                    type="submit"
                    disabled={isProcessing || directive === lastSetDirective}
                    className="w-full sm:w-auto flex justify-center items-center gap-2 bg-brand-primary-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-brand-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
                >
                    {isProcessing ? <><LoadingSpinner /> Setting Directive...</> : <><Sparkles className="w-5 h-5"/> Set Directive & Analyze Tasks</>}
                </button>
            </form>
        </div>
    );
};

export default ManagerDirective;