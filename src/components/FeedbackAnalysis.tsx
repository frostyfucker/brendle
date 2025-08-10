
import React, { useState } from 'react';
import { analyzeGuestFeedback } from '../services/geminiService';
import { FeedbackAnalysisResult, Task } from '../types';
import { MessageSquare, CheckCircle, XCircle, FileText, Plus } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const FeedbackAnalysis: React.FC = () => {
  const { user, showToast } = useAuth();
  const [feedbackText, setFeedbackText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<FeedbackAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const sampleFeedback = "The room was spacious and clean, and the bed was incredibly comfortable. We loved the breakfast buffet! The staff at the front desk were also very helpful. However, the Wi-Fi was a bit slow in the evening, and the pool was too crowded on Saturday.";

  const handleAnalyzeFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText) {
      setError('Please enter some feedback text to analyze.');
      return;
    }
    setError('');
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const result = await analyzeGuestFeedback(feedbackText);
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTaskFromFeedback = (negativePoint: string) => {
    if (!user) {
        setError('You must be logged in to create a task.');
        return;
    }
    try {
        const newTask: Task = {
            id: Date.now(),
            text: `Address Guest Feedback: "${negativePoint}"`,
            completed: false,
            isNew: true, // Mark as new for highlighting
            aiStatus: 'On Hold',
            note: 'Generated from guest feedback analysis. Please review and approve.',
            subTasks: [],
            materials: [],
            tools: []
        };
        
        const userTasksKey = `${user.id}-hotelBrendleTasks`;
        const existingTasksJSON = localStorage.getItem(userTasksKey);
        const existingTasks: Task[] = existingTasksJSON ? JSON.parse(existingTasksJSON) : [];
        
        const updatedOldTasks = existingTasks.map(t => ({...t, isNew: false}));
        const newTaskList = [newTask, ...updatedOldTasks];
        
        localStorage.setItem(userTasksKey, JSON.stringify(newTaskList));
        // Manually dispatch event for other components like Dashboard to update
        window.dispatchEvent(new StorageEvent('storage', { key: userTasksKey }));

        showToast(`Task created for: "${negativePoint}"`);
    } catch (e) {
        setError('Failed to create task in local storage.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-brand-primary-100 dark:bg-brand-primary-900/50 p-3 rounded-full">
            <MessageSquare className="w-8 h-8 text-brand-primary-600 dark:text-brand-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Guest Feedback Analysis</h2>
            <p className="text-slate-500 dark:text-slate-400">Leverage AI to quickly understand guest sentiment.</p>
          </div>
        </div>

        <form onSubmit={handleAnalyzeFeedback} className="space-y-4">
          <div>
            <label htmlFor="feedbackText" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Paste Guest Review</label>
            <textarea
              id="feedbackText"
              rows={6}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter guest feedback here..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500 outline-none transition"
            />
             <button type="button" onClick={() => setFeedbackText(sampleFeedback)} className="text-xs text-brand-primary-600 dark:text-brand-primary-400 hover:underline mt-1">Use sample text</button>
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-brand-primary-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-brand-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
            >
              {isLoading ? <><LoadingSpinner /> Analyzing...</> : <>Analyze Feedback</>}
            </button>
          </div>
        </form>

        {analysisResult && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-500" /> Summary</h3>
              <p className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 p-4 rounded-md">{analysisResult.summary}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-600 dark:text-green-400"><CheckCircle className="w-5 h-5" /> Positives</h3>
                <ul className="space-y-2">
                  {analysisResult.positives.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 bg-green-50 dark:bg-green-900/30 p-3 rounded-md">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400"><XCircle className="w-5 h-5" /> Actionable Negatives</h3>
                <ul className="space-y-2">
                  {analysisResult.negatives.map((point, index) => (
                    <li key={index} className="flex flex-col gap-2 bg-red-50 dark:bg-red-900/30 p-3 rounded-md">
                        <div className="flex items-start gap-2">
                            <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                            <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{point}</span>
                        </div>
                        <button onClick={() => handleCreateTaskFromFeedback(point)} className="ml-auto w-full sm:w-auto text-xs bg-brand-primary-100 text-brand-primary-700 dark:bg-brand-primary-900/80 dark:text-brand-primary-200 hover:bg-brand-primary-200 dark:hover:bg-brand-primary-800/80 font-semibold px-2 py-1 rounded-md flex items-center justify-center gap-1 transition-colors">
                            <Plus className="w-3 h-3" /> Create Task
                        </button>
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

export default FeedbackAnalysis;