import React, { useState, useRef, useEffect } from 'react';
import { Bot, Upload, Mic, Video, FileText, CheckCircle, ListTodo, Sparkles, CloudUpload } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { summarizeContent } from '../services/geminiService';
import { SessionSummaryResult } from '../types';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'text' | 'file' | 'record';

const SessionSummarizer: React.FC = () => {
    const { saveToDrive, isDriveApiReady } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('text');
    const [inputText, setInputText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [summary, setSummary] = useState<SessionSummaryResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [isRecording, setIsRecording] = useState(false);
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mediaType, setMediaType] = useState<'audio' | 'video' | null>(null);

    const cleanupStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setMediaType(null);
    };

    useEffect(() => {
        return () => cleanupStream();
    }, []);

    const handleSummarize = async () => {
        let content: string | File | null = null;
        if (activeTab === 'text' && inputText.trim()) {
            content = inputText;
        } else if (activeTab === 'file' && file) {
            content = file;
        } else if (activeTab === 'record' && mediaBlob) {
            const extension = mediaBlob.type.includes('video') ? 'webm' : 'ogg';
            content = new File([mediaBlob], `recording.${extension}`, { type: mediaBlob.type });
        }

        if (!content) {
            setError("Please provide content to summarize.");
            return;
        }

        setIsLoading(true);
        setError('');
        setSummary(null);

        try {
            const result = await summarizeContent(content);
            setSummary(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToDrive = () => {
        if (!summary) return;
        const dataToSave = `Summary:\n${summary.summary}\n\nKey Points:\n- ${summary.keyPoints.join('\n- ')}\n\nAction Items:\n- ${summary.actionItems.join('\n- ')}`;
        const date = new Date().toISOString().split('T')[0];
        saveToDrive(`session-summary-${date}.txt`, dataToSave, 'text/plain');
    };

    const handleStartMedia = async (useVideo: boolean) => {
        cleanupStream();
        setMediaBlob(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: useVideo, audio: true });
            streamRef.current = stream;
            setMediaType(useVideo ? 'video' : 'audio');
            if (useVideo && videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing media devices:", err);
            setError("Could not access media devices. Please check permissions.");
        }
    };
    
    const handleStartRecording = () => {
        if (!streamRef.current) return;
        setIsRecording(true);
        const recordedChunks: Blob[] = [];
        const mimeType = mediaType === 'video' ? 'video/webm' : 'audio/ogg; codecs=opus';
        const recorder = new MediaRecorder(streamRef.current, { mimeType });
        recorder.ondataavailable = event => event.data.size > 0 && recordedChunks.push(event.data);
        recorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: mimeType });
            setMediaBlob(blob);
            cleanupStream();
        };
        mediaRecorderRef.current = recorder;
        mediaRecorderRef.current.start();
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const TabButton: React.FC<{ tabId: Tab, label: string, icon: React.ReactNode }> = ({ tabId, label, icon }) => (
        <button
            onClick={() => {
                setActiveTab(tabId);
                setError('');
                setSummary(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium border-b-4 transition-colors ${
                activeTab === tabId
                    ? 'text-brand-primary-600 dark:text-brand-primary-400 border-brand-primary-500'
                    : 'text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
            }`}
        >
            {icon} {label}
        </button>
    );

    const renderTabs = () => (
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
            <TabButton tabId="text" label="Text" icon={<FileText className="w-5 h-5" />} />
            <TabButton tabId="file" label="Upload File" icon={<Upload className="w-5 h-5" />} />
            <TabButton tabId="record" label="Record" icon={<Mic className="w-5 h-5" />} />
        </div>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'text':
                return (
                    <textarea
                        rows={8}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste your meeting notes, transcript, or any text here..."
                        className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500 outline-none transition"
                    />
                );
            case 'file':
                return (
                    <div className="text-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8">
                        <Upload className="mx-auto h-12 w-12 text-slate-400" />
                        <label htmlFor="file-upload" className="mt-2 text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 cursor-pointer hover:underline">
                            Choose a file
                        </label>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} accept=".txt,.md,.pdf,.mp3,.wav,.mp4,.mov,.webm" />
                        <p className="mt-1 text-xs text-slate-500">TXT, PDF, MP3, WAV, MP4, WEBM</p>
                        {file && <p className="mt-4 font-medium text-sm text-slate-700 dark:text-slate-300">Selected: {file.name}</p>}
                    </div>
                );
            case 'record':
                 return (
                    <div className="space-y-4">
                        {!mediaType && !mediaBlob && (
                            <div className="flex gap-4">
                                <button onClick={() => handleStartMedia(false)} className="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                                    <Mic className="w-8 h-8"/> Record Audio
                                </button>
                                <button onClick={() => handleStartMedia(true)} className="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                                    <Video className="w-8 h-8"/> Record Video
                                </button>
                            </div>
                        )}
                        {mediaType === 'video' && <video ref={videoRef} autoPlay muted playsInline className="w-full bg-slate-900 rounded-md" />}
                        {mediaType === 'audio' && <div className="text-center p-8 bg-slate-100 dark:bg-slate-700 rounded-md">Recording audio...</div>}
                        
                        {mediaType && (
                            !isRecording
                            ? <button onClick={handleStartRecording} className="w-full bg-red-600 text-white font-bold py-3 rounded-md animate-pulse">Start Recording</button>
                            : <button onClick={handleStopRecording} className="w-full bg-red-800 text-white font-bold py-3 rounded-md">Stop Recording</button>
                        )}
                        
                        {mediaBlob && <p className="text-center font-medium text-green-600 dark:text-green-400">Recording complete. Ready to summarize.</p>}
                    </div>
                 );
        }
    };
    
    const renderResult = () => {
        if (isLoading) return <div className="flex justify-center items-center h-40 gap-4"><LoadingSpinner /><span className="text-slate-500">AI is analyzing...</span></div>;
        if (error) return <p className="text-red-500 text-center">{error}</p>;
        if (!summary) return null;

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-end">
                    <button 
                        onClick={handleSaveToDrive} 
                        disabled={!isDriveApiReady}
                        className="flex items-center gap-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-2 px-4 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        <CloudUpload className="w-5 h-5" /> Save to Drive
                    </button>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-white"><FileText className="w-5 h-5"/> Summary</h3>
                    <p className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 p-4 rounded-md">{summary.summary}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-600 dark:text-green-400"><CheckCircle className="w-5 h-5" /> Key Points</h3>
                        <ul className="space-y-2">
                            {summary.keyPoints.map((point, index) => <li key={index} className="flex items-start gap-2 bg-green-50 dark:bg-green-900/30 p-3 rounded-md text-sm text-slate-700 dark:text-slate-300"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />{point}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400"><ListTodo className="w-5 h-5" /> Action Items</h3>
                        <ul className="space-y-2">
                            {summary.actionItems.map((point, index) => <li key={index} className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md text-sm text-slate-700 dark:text-slate-300"><ListTodo className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />{point}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    const canSubmit = (activeTab === 'text' && inputText.trim()) || (activeTab === 'file' && file) || (activeTab === 'record' && mediaBlob);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-brand-primary-100 dark:bg-brand-primary-900/50 p-3 rounded-full">
                        <Bot className="w-8 h-8 text-brand-primary-600 dark:text-brand-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AI Session Summarizer</h2>
                        <p className="text-slate-500 dark:text-slate-400">Analyze notes, audio, or video to get key takeaways and action items.</p>
                    </div>
                </div>

                {renderTabs()}
                
                <div className="space-y-6">
                    {renderContent()}
                    
                    <div>
                        <button onClick={handleSummarize} disabled={!canSubmit || isLoading} className="w-full flex justify-center items-center gap-2 bg-brand-primary-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-brand-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition">
                            {isLoading ? <><LoadingSpinner /> Summarizing...</> : <><Sparkles className="w-5 h-5"/> Get Summary</>}
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                        {renderResult()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionSummarizer;