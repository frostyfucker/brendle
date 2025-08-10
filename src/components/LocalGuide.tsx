
import React, { useState } from 'react';
import { recommendLocalAttractions } from '../services/geminiService';
import { LocalGuideResult, Attraction } from '../types';
import { MapPin, Search, Compass, Utensils, Landmark, TreePine } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

const AttractionIcon: React.FC<{type: string}> = ({ type }) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('restaurant') || lowerType.includes('food')) {
        return <Utensils className="w-6 h-6 text-amber-500" />;
    }
    if (lowerType.includes('museum') || lowerType.includes('art')) {
        return <Landmark className="w-6 h-6 text-indigo-500" />;
    }
    if (lowerType.includes('park') || lowerType.includes('nature')) {
        return <TreePine className="w-6 h-6 text-green-500" />;
    }
    return <Compass className="w-6 h-6 text-slate-500" />;
};

const LocalGuide: React.FC = () => {
  const [interests, setInterests] = useState('');
  const [recommendations, setRecommendations] = useState<LocalGuideResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interests) {
      setError('Please enter guest interests to get recommendations.');
      return;
    }
    setError('');
    setIsLoading(true);
    setRecommendations(null);

    try {
      const result = await recommendLocalAttractions(interests);
      setRecommendations(result);
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
            <MapPin className="w-8 h-8 text-brand-primary-600 dark:text-brand-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AI Local Guide</h2>
            <p className="text-slate-500 dark:text-slate-400">Provide tailored recommendations for your guests.</p>
          </div>
        </div>

        <form onSubmit={handleGetRecommendations} className="space-y-4">
          <div>
            <label htmlFor="interests" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Guest Interests</label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    id="interests"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g., modern art, spicy food, live music"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500 outline-none transition"
                />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-brand-primary-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-brand-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
            >
              {isLoading ? <><LoadingSpinner /> Searching...</> : <>Get Recommendations</>}
            </button>
          </div>
        </form>

        {recommendations && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Recommended Attractions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.attractions.map((attraction: Attraction, index: number) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-shrink-0"><AttractionIcon type={attraction.type} /></div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white">{attraction.name}</h4>
                        <p className="text-sm font-medium text-brand-primary-500">{attraction.type}</p>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">{attraction.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalGuide;
