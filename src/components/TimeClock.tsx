
import React, { useState, useEffect, useMemo } from 'react';
import { Clock } from './Icons';
import { useAuth } from '../contexts/AuthContext';

type ClockStatus = 'in' | 'out';

const TimeClock: React.FC = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<ClockStatus>('out');
    const [clockInTime, setClockInTime] = useState<string | null>(null);

    const STORAGE_KEYS = useMemo(() => {
        if (!user) return null;
        return {
            STATUS: `${user.id}-timeClockStatus`,
            TIME: `${user.id}-timeClockTime`,
        };
    }, [user]);

    useEffect(() => {
        if (!STORAGE_KEYS) return;
        const storedStatus = localStorage.getItem(STORAGE_KEYS.STATUS) as ClockStatus;
        const storedTime = localStorage.getItem(STORAGE_KEYS.TIME);
        if (storedStatus) setStatus(storedStatus);
        if (storedTime) setClockInTime(JSON.parse(storedTime));
    }, [STORAGE_KEYS]);

    const handleClockIn = () => {
        if (!STORAGE_KEYS) return;
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setStatus('in');
        setClockInTime(timeString);
        localStorage.setItem(STORAGE_KEYS.STATUS, 'in');
        localStorage.setItem(STORAGE_KEYS.TIME, JSON.stringify(timeString));
    };

    const handleClockOut = () => {
        if (!STORAGE_KEYS) return;
        setStatus('out');
        setClockInTime(null);
        localStorage.setItem(STORAGE_KEYS.STATUS, 'out');
        localStorage.removeItem(STORAGE_KEYS.TIME);
    };

    const isClockedIn = status === 'in';

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-brand-primary-500" /> Time Clock
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                    <p className="font-semibold text-lg text-slate-800 dark:text-white">
                        You are currently clocked {isClockedIn ? 'in' : 'out'}.
                    </p>
                    {isClockedIn && clockInTime && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Clocked in at {clockInTime}.
                        </p>
                    )}
                </div>
                <div>
                    {!isClockedIn ? (
                        <button 
                            onClick={handleClockIn}
                            className="w-40 bg-green-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-green-700 transition-colors"
                        >
                            Clock In
                        </button>
                    ) : (
                        <button 
                            onClick={handleClockOut}
                            className="w-40 bg-red-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-red-700 transition-colors"
                        >
                            Clock Out
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimeClock;