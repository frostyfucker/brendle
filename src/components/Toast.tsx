import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle } from './Icons';

const Toast: React.FC = () => {
    const { toast } = useAuth();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (toast) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 2800); // Start fade out before it's removed
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [toast]);

    if (!toast) return null;

    return (
        <div
            className={`fixed bottom-5 right-5 bg-slate-800 text-white p-4 rounded-lg shadow-2xl flex items-center gap-3 z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            role="alert"
            aria-live="assertive"
        >
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="font-medium">{toast.message}</span>
        </div>
    );
};

export default Toast;
