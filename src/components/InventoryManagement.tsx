
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { analyzeInventoryOrderVideo } from '../services/geminiService';
import { InventoryItem, OrderItem, OrderRequest } from '../types';
import { Archive, Camera, Sparkles, Save, Download, Video, VideoOff, CheckCircle } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

// Helper function to convert Blob to File
const blobToFile = (theBlob: Blob, fileName: string): File => {
  return new File([theBlob], fileName, {
    lastModified: new Date().getTime(),
    type: theBlob.type
  });
};

const InventoryManagement: React.FC = () => {
    const { user } = useAuth();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([]);
    
    // Video recording states
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Analysis states
    const [analysisResult, setAnalysisResult] = useState<OrderItem[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const STORAGE_KEYS = useMemo(() => {
        if (!user) return null;
        return {
            INVENTORY: `${user.id}-hotelBrendleInventory`,
            ORDER_REQUESTS: `${user.id}-hotelBrendleOrderRequests`,
        };
    }, [user]);

    const loadData = () => {
        if (!STORAGE_KEYS) return;
        const storedInventory = localStorage.getItem(STORAGE_KEYS.INVENTORY);
        if (storedInventory) setInventory(JSON.parse(storedInventory));
        
        const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDER_REQUESTS);
        if (storedOrders) setOrderRequests(JSON.parse(storedOrders));
    }

    useEffect(() => {
        loadData();
        return () => cleanupCamera();
    }, [STORAGE_KEYS]);

    const cleanupCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        streamRef.current = null;
        if(videoRef.current) videoRef.current.srcObject = null;
        setIsCameraEnabled(false);
        setIsRecording(false);
    };

    const handleEnableCamera = async () => {
        handleResetFlow();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraEnabled(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please check permissions.");
        }
    };

    const handleStartRecording = () => {
        if (!streamRef.current) return;
        setIsRecording(true);
        const recordedChunks: Blob[] = [];
        const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
        recorder.ondataavailable = event => event.data.size > 0 && recordedChunks.push(event.data);
        recorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            setVideoBlob(blob);
            cleanupCamera();
        };
        mediaRecorderRef.current = recorder;
        mediaRecorderRef.current.start();
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
    };
    
    const handleAnalyzeVideo = async () => {
        if (!videoBlob) return;
        setIsLoading(true);
        setError('');
        setAnalysisResult(null);
        try {
            const videoFile = blobToFile(videoBlob, `inventory-order-${Date.now()}.webm`);
            const result = await analyzeInventoryOrderVideo(videoFile);
            setAnalysisResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveOrder = () => {
        if (!analysisResult || analysisResult.length === 0 || !STORAGE_KEYS) return;
        const newOrder: OrderRequest = {
            id: `order-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            items: analysisResult,
            status: 'Pending',
        };
        const updatedOrders = [newOrder, ...orderRequests];
        setOrderRequests(updatedOrders);
        localStorage.setItem(STORAGE_KEYS.ORDER_REQUESTS, JSON.stringify(updatedOrders));
        handleResetFlow();
    };

    const handleExportCSV = () => {
        if (!analysisResult || analysisResult.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,Item Name,Quantity\n";
        analysisResult.forEach(item => {
            csvContent += `"${item.name}",${item.quantity}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inventory_order_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleResetFlow = () => {
        cleanupCamera();
        setVideoBlob(null);
        setAnalysisResult(null);
        setIsLoading(false);
        setError('');
    };
    
    const handleMarkAsOrdered = (orderId: string) => {
        if (!STORAGE_KEYS) return;
        const updatedOrders = orderRequests.map((order): OrderRequest => 
            order.id === orderId ? {...order, status: 'Ordered'} : order
        );
        setOrderRequests(updatedOrders);
        localStorage.setItem(STORAGE_KEYS.ORDER_REQUESTS, JSON.stringify(updatedOrders));
    };

    const StatusBadge: React.FC<{status: InventoryItem['status']}> = ({status}) => {
        const colors = {
            'Stocked': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'Low Stock': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            'Out of Stock': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[status]}`}>{status}</span>;
    };
    
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="bg-brand-primary-100 dark:bg-brand-primary-900/50 p-3 rounded-full">
                    <Archive className="w-8 h-8 text-brand-primary-600 dark:text-brand-primary-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Intelligent Inventory Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Use your voice to generate order lists, then track and manage stock.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Side: Verbal Order Creator */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Verbal Order Creator</h2>
                    
                    <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center aspect-video flex items-center justify-center">
                        <video ref={videoRef} className={`w-full h-full rounded-md bg-slate-900 ${isCameraEnabled ? '' : 'hidden'}`} autoPlay muted playsInline></video>

                        {!isCameraEnabled && !videoBlob && (
                             <div className="py-10">
                                <Camera className="mx-auto h-12 w-12 text-slate-400" />
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Record a video and state what you need to order.</p>
                                <button onClick={handleEnableCamera} className="mt-4 inline-flex items-center gap-2 bg-brand-primary-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary-700 transition">
                                    <Video className="w-5 h-5"/> Enable Camera
                                </button>
                            </div>
                        )}
                         {videoBlob && (
                             <div className="py-10">
                                <Video className="mx-auto h-12 w-12 text-green-500" />
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Video recorded. Ready for analysis.</p>
                                <div className="flex justify-center gap-4 mt-4">
                                    <button onClick={handleEnableCamera} className="inline-flex items-center gap-2 bg-slate-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-600 transition">
                                        <VideoOff className="w-5 h-5"/> Record Again
                                    </button>
                                    <button onClick={handleAnalyzeVideo} disabled={isLoading} className="inline-flex items-center gap-2 bg-fuchsia-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-fuchsia-700 disabled:bg-slate-400 transition">
                                        {isLoading ? <LoadingSpinner /> : <Sparkles className="w-5 h-5"/>} Analyze Video
                                    </button>
                                </div>
                            </div>
                        )}
                        {isCameraEnabled && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                {!isRecording ? (
                                    <button onClick={handleStartRecording} className="inline-flex items-center gap-2 bg-red-600 text-white font-bold py-3 px-6 rounded-full shadow-lg animate-pulse">
                                        <Video className="w-6 h-6"/> Start Recording
                                    </button>
                                ) : (
                                    <button onClick={handleStopRecording} className="inline-flex items-center gap-2 bg-red-800 text-white font-bold py-3 px-6 rounded-full shadow-lg">
                                        <div className="w-4 h-4 bg-white rounded-sm"></div> Stop Recording
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                     {error && <p className="text-red-500 bg-red-50 dark:bg-red-900/30 p-3 rounded-md text-sm">{error}</p>}
                     
                     {analysisResult && (
                        <div className="animate-fade-in space-y-4">
                            <h3 className="font-semibold text-slate-800 dark:text-white">Generated Order List:</h3>
                            <div className="max-h-40 overflow-y-auto pr-2">
                                <ul className="space-y-2">
                                    {analysisResult.length > 0 ? analysisResult.map(item => (
                                        <li key={item.name} className="flex justify-between items-center bg-slate-100 dark:bg-slate-700 p-2 rounded-md">
                                            <span className="font-medium text-slate-800 dark:text-white">{item.name}</span>
                                            <span className="text-sm font-bold">Qty: {item.quantity}</span>
                                        </li>
                                    )) : <p className="text-sm text-center text-slate-500">No items were clearly identified in the video.</p>}
                                </ul>
                            </div>
                           {analysisResult.length > 0 && (
                               <div className="flex flex-col sm:flex-row gap-2">
                                    <button onClick={handleSaveOrder} className="flex-1 inline-flex justify-center items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition">
                                        <Save className="w-5 h-5"/> Save Order
                                    </button>
                                    <button onClick={handleExportCSV} className="flex-1 inline-flex justify-center items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition">
                                        <Download className="w-5 h-5"/> Export as CSV
                                    </button>
                               </div>
                           )}
                        </div>
                     )}
                </div>

                {/* Right Side: Pending Orders & Stock Levels */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Pending Orders</h2>
                        <div className="max-h-60 overflow-y-auto space-y-3">
                            {orderRequests.filter(o => o.status === 'Pending').length > 0 ?
                             orderRequests.filter(o => o.status === 'Pending').map(order => (
                                <div key={order.id} className="bg-slate-50 dark:bg-slate-900/70 p-3 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">Order from {order.date}</p>
                                        <button onClick={() => handleMarkAsOrdered(order.id)} className="text-xs bg-green-100 text-green-700 dark:bg-green-900/80 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800/80 font-semibold px-2 py-1 rounded-md flex items-center justify-center gap-1 transition-colors">
                                            <CheckCircle className="w-3 h-3" /> Mark as Ordered
                                        </button>
                                    </div>
                                    <ul className="text-xs list-disc list-inside text-slate-600 dark:text-slate-400">
                                        {order.items.map(item => <li key={item.name}>{item.quantity}x {item.name}</li>)}
                                    </ul>
                                </div>
                            )) : <p className="text-sm text-center text-slate-500 py-4">No pending orders.</p>}
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Current Stock Levels</h2>
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Item</th>
                                        <th scope="col" className="px-4 py-3">Quantity</th>
                                        <th scope="col" className="px-4 py-3">Status</th>
                                        <th scope="col" className="px-4 py-3">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.sort((a,b) => a.name.localeCompare(b.name)).map(item => (
                                        <tr key={item.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/20">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                                            <td className="px-4 py-3">{item.quantity}</td>
                                            <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                                            <td className="px-4 py-3">{item.lastUpdated}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryManagement;