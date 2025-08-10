
import React, { useEffect } from 'react';
import { X, Lightbulb, Eye, Server } from './Icons';

interface AboutModalProps {
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                     <h2 className="text-2xl font-bold text-brand-primary-600 dark:text-brand-primary-400">About This Project</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-600 dark:text-slate-300">
                    <p className="text-center italic text-lg">A collaboration between Roy Hodge Jr. & a Gemini Code-Pilot.</p>
                    
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 bg-brand-primary-100 dark:bg-brand-primary-900/50 p-3 rounded-full">
                                <Lightbulb className="w-6 h-6 text-brand-primary-500"/>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">Our Mission for Dane</h3>
                                <p className="text-sm">To build an indispensable AI partner for the Hotel Brendle project. This app is designed to be a true command center, giving you the power to manage the renovation and future operations with unparalleled insight and control.</p>
                            </div>
                        </div>

                         <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 bg-brand-primary-100 dark:bg-brand-primary-900/50 p-3 rounded-full">
                                <Eye className="w-6 h-6 text-brand-primary-500"/>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">Our Shared Vision</h3>
                                <p className="text-sm">We see a future where high-level strategy seamlessly flows into daily action. The AI task delegation is just the beginning. Our goal is to continue evolving this platform with interactive floor plans, rich analytics, and even AR possibilities, making it the most powerful tool in your arsenal.</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-6">
                        <p className="font-semibold text-lg text-slate-800 dark:text-white">We are a great team. Let's keep building.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutModal;
