import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Google } from './Icons';

const Login: React.FC = () => {
    const { login } = useAuth();

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
            <div className="text-center">
                <span className="text-6xl">🏨</span>
                <h1 className="text-4xl sm:text-5xl font-bold text-brand-primary-600 dark:text-brand-primary-400 mt-4">
                    Hotel Brendle Orchestrator
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">
                    Your AI-Powered Hotel Management Dashboard. Sign in to continue.
                </p>
            </div>

            <div className="mt-12 flex flex-col items-center justify-center min-h-[70px]">
                <button
                    onClick={login}
                    className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-3 px-8 rounded-full shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <Google className="w-6 h-6" />
                    <span>Sign in with Google</span>
                </button>
            </div>

            <div className="absolute bottom-4 text-center text-xs text-slate-400 dark:text-slate-500">
                <p>&copy; 2025 Hotel Brendle Renovation Project.</p>
            </div>
        </div>
    );
};

export default Login;
