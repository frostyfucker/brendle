
import React, { useState } from 'react';
import { getRenovationAdvice } from '../services/geminiService';
import { RenovationAdvice } from '../types';
import { Lightbulb, Sparkles, AlertTriangle, CheckCircle, Tool } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

const RenovationAdvisor: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [advice, setAdvice] = useState<RenovationAdvice | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const samplePrompts = [
        "Modernize the lobby with an industrial-chic feel.",
        "Design guest rooms that are minimalist but warm and inviting.",
        "Create a rooftop bar area that is perfect for evening cocktails.",
        "Upgrade the bathrooms to feel like a luxury spa.",
    ];

    const handleGetAdvice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) {
            setError('Please enter a renovation goal.');
            return;
        }
        setError('');
        setIsLoading(true);
        setAdvice(null);

        try {
            const result = await getRenovationAdvice(prompt);
            setAdvice(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const AdviceCard: React.FC<{title: string, icon: React.ReactNode, items: string[]}> = ({title, icon, items}) => (
        <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-white">
                {icon}
                {title}
            </h3>
            <ul className="space-y-2">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-brand-primary-500 mt-1 flex-shrink-0" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-brand-primary-100 dark:bg-brand-primary-900/50 p-3 rounded-full">
                        <Lightbulb className="w-8 h-8 text-brand-primary-600 dark:text-brand-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AI Renovation Advisor</h2>
                        <p className="text-slate-500 dark:text-slate-400">Get expert design concepts and practical advice.</p>
                    </div>
                </div>

                <form onSubmit={handleGetAdvice} className="space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Describe your renovation goal</label>
                        <textarea
                            id="prompt"
                            rows={3}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., I want to upgrade the lobby to have a modern, industrial feel..."
                            className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500 outline-none transition"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs text-slate-500 mr-2">Try an example:</span>
                            {samplePrompts.map(p => (
                                <button key={p} type="button" onClick={() => setPrompt(p)} className="text-xs text-brand-primary-600 dark:text-brand-primary-400 hover:underline bg-brand-primary-50 dark:bg-slate-700 px-2 py-1 rounded-full">
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-2 bg-brand-primary-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-brand-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
                        >
                            {isLoading ? <><LoadingSpinner /> Getting Advice...</> : <><Sparkles className="w-5 h-5" /> Generate Ideas</>}
                        </button>
                    </div>
                </form>

                {advice && (
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-white"><Lightbulb className="w-5 h-5"/> Concept Summary</h3>
                            <p className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 p-4 rounded-md">{advice.conceptSummary}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AdviceCard title="Key Design Elements" icon={<CheckCircle className="w-5 h-5 text-green-500" />} items={advice.designElements} />
                            <AdviceCard title="Material Suggestions" icon={<Tool className="w-5 h-5 text-blue-500" />} items={advice.materialSuggestions} />
                        </div>
                        <div>
                             <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                                    <AlertTriangle className="w-5 h-5" />
                                    Potential Challenges
                                </h3>
                                <ul className="space-y-2">
                                    {advice.potentialChallenges.map((item, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" />
                                            <span className="text-sm text-yellow-700 dark:text-yellow-200">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RenovationAdvisor;
