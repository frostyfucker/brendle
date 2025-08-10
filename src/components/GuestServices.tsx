
import React, { useState } from 'react';
import { generateWelcomeMessage } from '../services/geminiService';
import { Sparkles, MessageCircle, User, ThumbsUp } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

const GuestServices: React.FC = () => {
  const [guestName, setGuestName] = useState('');
  const [interests, setInterests] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !interests) {
      setError('Please fill in both guest name and their interests.');
      return;
    }
    setError('');
    setIsLoading(true);
    setWelcomeMessage('');

    try {
      const message = await generateWelcomeMessage(guestName, interests);
      setWelcomeMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-brand-primary-100 dark:bg-brand-primary-900/50 p-3 rounded-full">
            <Sparkles className="w-8 h-8 text-brand-primary-600 dark:text-brand-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AI-Powered Welcome Message</h2>
            <p className="text-slate-500 dark:text-slate-400">Create a personal touch for arriving guests.</p>
          </div>
        </div>

        <form onSubmit={handleGenerateMessage} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="guestName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Guest Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g., Jane Doe"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500 outline-none transition"
                />
              </div>
            </div>
            <div>
              <label htmlFor="interests" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Guest Interests</label>
              <div className="relative">
                <ThumbsUp className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  id="interests"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g., hiking, fine dining, museums"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500 outline-none transition"
                />
              </div>
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-brand-primary-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-brand-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
            >
              {isLoading ? <><LoadingSpinner /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate Message</>}
            </button>
          </div>
        </form>

        {welcomeMessage && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-brand-primary-500" /> Generated Welcome Note</h3>
            <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-lg prose prose-slate dark:prose-invert">
              <p>{welcomeMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestServices;
