import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Send } from './Icons';

interface Message {
    id: string;
    text: string;
    author: string;
    authorId: string;
    timestamp: any;
}

const BulletinBoard: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'bulletinBoard'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs: Message[] = [];
            querySnapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user) return;

        await addDoc(collection(db, 'bulletinBoard'), {
            text: newMessage,
            author: user.name,
            authorId: user.id,
            timestamp: serverTimestamp(),
        });

        setNewMessage('');
    };

    const handleDeleteMessage = async (id: string) => {
        await deleteDoc(doc(db, 'bulletinBoard', id));
    };

    return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-brand-primary-600 dark:text-brand-primary-400">Live Bulletin Board</h2>
            <div className="flex-grow overflow-y-auto mb-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                {messages.map((msg) => (
                    <div key={msg.id} className="mb-4 flex justify-between items-start">
                        <div>
                            <p className="font-bold">{msg.author}</p>
                            <p className="text-slate-700 dark:text-slate-300">{msg.text}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                {msg.timestamp?.toDate().toLocaleString()}
                            </p>
                        </div>
                        {user && user.id === msg.authorId && (
                            <button onClick={() => handleDeleteMessage(msg.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                />
                <button type="submit" className="bg-brand-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    <span>Send</span>
                </button>
            </form>
        </div>
    );
};

export default BulletinBoard;
