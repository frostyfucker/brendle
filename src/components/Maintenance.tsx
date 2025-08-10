
import React, { useState, useRef, useEffect } from 'react';
import { analyzeMaintenanceVideo } from '../services/geminiService';
import { WorkOrder, Expense, Building, WorkOrderRecord, InventoryItem } from '../types';
import { Camera, Video, VideoOff, Send, Wrench, AlertTriangle, Tool, ClipboardList, Zap, DollarSign, Sparkles, CheckCircle } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';

// Helper function to convert Blob to File
const blobToFile = (theBlob: Blob, fileName: string): File => {
  return new File([theBlob], fileName, {
    lastModified: new Date().getTime(),
    type: theBlob.type
  });
};

type AnalysisResultState = (Omit<WorkOrder, 'location'> & { inventoryWarning?: string }) | null;


const Maintenance: React.FC = () => {
    const { user, showToast } = useAuth();
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResultState>(null);
    const [location, setLocation] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const cleanupCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
        // Cleanup on component unmount
        return () => {
            cleanupCamera();
        };
    }, []);

    const handleEnableCamera = async () => {
        if (streamRef.current) {
            cleanupCamera();
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraEnabled(true);
            setVideoBlob(null);
            setAnalysisResult(null);
            setError('');
            setSubmitted(false);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please check permissions.");
            setIsCameraEnabled(false);
        }
    };
    
    const handleStartRecording = () => {
        if (!streamRef.current) return;
        setIsRecording(true);
        const recordedChunks: Blob[] = [];
        const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            setVideoBlob(blob);
            cleanupCamera();
            setIsCameraEnabled(false);
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

    const handleAnalyzeVideo = async () => {
        if (!videoBlob || !user) return;
        
        setIsLoading(true);
        setError('');
        setAnalysisResult(null);
        
        try {
            const videoFile = blobToFile(videoBlob, `maintenance-report-${Date.now()}.webm`);
            const result = await analyzeMaintenanceVideo(videoFile);
            
            const userInventoryKey = `${user.id}-hotelBrendleInventory`;
            const inventoryQuery = query(collection(db, 'inventory'));
            const inventorySnapshot = await getDocs(inventoryQuery);
            const inventory: InventoryItem[] = inventorySnapshot.docs.map(doc => doc.data() as InventoryItem);
            let inventoryWarning = '';

            if (result.materials && result.materials.length > 0) {
                const lowStockItems = result.materials.map(materialName => {
                    const item = inventory.find(inv => inv.name.toLowerCase() === materialName.toLowerCase());
                    return item && (item.status === 'Low Stock' || item.status === 'Out of Stock') ? item.name : null;
                }).filter(Boolean);

                if (lowStockItems.length > 0) {
                    inventoryWarning = `Inventory alert: The following items are low/out of stock: ${lowStockItems.join(', ')}.`;
                }
            }

            setAnalysisResult({ ...result, inventoryWarning });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitWorkOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!location || !analysisResult || !user) {
            setError("Please specify a location for the work order.");
            return;
        }

        try {
            // 1. Add Work Order to Firestore
            const newWorkOrder: WorkOrderRecord = {
                id: '', // Firestore will generate this
                title: analysisResult.title,
                date: new Date().toISOString().split('T')[0],
                estimatedCost: analysisResult.estimatedCost.materials + analysisResult.estimatedCost.labor,
                priority: analysisResult.priority,
                status: 'Pending',
                description: analysisResult.description,
                materials: analysisResult.materials,
                inventoryWarning: analysisResult.inventoryWarning || '',
            };

            const docRef = await addDoc(collection(db, 'workOrders'), newWorkOrder);
            newWorkOrder.id = docRef.id; // Update with Firestore ID

            // 2. Update Room Status and add Work Order to Room in Firestore
            const roomsQuery = query(collection(db, 'rooms'), where('number', '==', location));
            const roomSnapshot = await getDocs(roomsQuery);

            if (roomSnapshot.empty) {
                setError(`Room "${location}" not found. Please check the room number.`);
                return;
            }

            roomSnapshot.forEach(async (roomDoc) => {
                const roomData = roomDoc.data();
                const updatedWorkOrders = roomData.workOrders ? [...roomData.workOrders, newWorkOrder] : [newWorkOrder];
                await updateDoc(doc(db, 'rooms', roomDoc.id), {
                    status: 'maintenance',
                    workOrders: updatedWorkOrders,
                });
            });

            // 3. Add Expense to Firestore
            const newExpense: Expense = {
                id: '', // Firestore will generate this
                title: `${analysisResult.title} (${location})`,
                date: new Date().toISOString().split('T')[0],
                amount: analysisResult.estimatedCost.materials + analysisResult.estimatedCost.labor,
                category: 'Repair'
            };
            await addDoc(collection(db, 'expenses'), newExpense);

            setSubmitted(true);
            setError('');
            showToast("Work order successfully submitted!");

        } catch (firestoreError) {
            console.error("Failed to update data in Firestore", firestoreError);
            setError(firestoreError instanceof Error ? firestoreError.message : "A critical database error occurred.");
            return;
        }
    };

    const handleReset = () => {
        cleanupCamera();
        setVideoBlob(null);
        setAnalysisResult(null);
        setIsCameraEnabled(false);
        setIsRecording(false);
        setIsLoading(false);
        setLocation('');
        setError('');
        setSubmitted(false);
    }

    const PriorityBadge: React.FC<{priority: 'Low'|'Medium'|'High'}> = ({priority}) => {
        const colors = {
            Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        }
        return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colors[priority]}`}>{priority}</span>
    }

    return (
        <div className="max-w-4xl mx-auto">
             <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-brand-primary-100 dark:bg-brand-primary-900/50 p-3 rounded-full">
                        <Wrench className="w-8 h-8 text-brand-primary-600 dark:text-brand-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AI Repair & Renovation Reporter</h2>
                        <p className="text-slate-500 dark:text-slate-400">Report issues, get instant analysis and cost estimates.</p>
                    </div>
                </div>

                {submitted ? (
                    <div className="text-center p-8 bg-green-50 dark:bg-green-900/30 rounded-lg animate-fade-in">
                        <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center bg-green-100 dark:bg-green-800 rounded-full">
                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Work Order Submitted!</h3>
                        <p className="text-slate-600 dark:text-slate-300 mt-2">The work order has been created, room status updated, and budget adjusted.</p>
                        <button
                            onClick={handleReset}
                            className="mt-6 bg-brand-primary-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary-700 transition"
                        >
                            Create Another Report
                        </button>
                    </div>
                ) : (
                <div className="space-y-6">
                    {/* Step 1: Video recording */}
                    <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center">
                        <video ref={videoRef} className={`w-full rounded-md bg-slate-900 ${isCameraEnabled ? '' : 'hidden'}`} autoPlay muted playsInline></video>
                        {!isCameraEnabled && !videoBlob && (
                            <div className="py-10">
                                <Camera className="mx-auto h-12 w-12 text-slate-400" />
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enable your camera to record a video report.</p>
                                <button onClick={handleEnableCamera} className="mt-4 inline-flex items-center gap-2 bg-brand-primary-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary-700 transition">
                                    <Camera className="w-5 h-5"/>
                                    Enable Camera
                                </button>
                            </div>
                        )}
                        {videoBlob && !isCameraEnabled && (
                            <div className="py-10">
                                <Video className="mx-auto h-12 w-12 text-green-500" />
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Video recorded. Ready for analysis.</p>
                                <div className="flex justify-center gap-4 mt-4">
                                    <button onClick={handleEnableCamera} className="inline-flex items-center gap-2 bg-slate-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-600 transition">
                                        <VideoOff className="w-5 h-5"/>
                                        Record Again
                                    </button>
                                    <button onClick={handleAnalyzeVideo} disabled={isLoading} className="inline-flex items-center gap-2 bg-fuchsia-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-fuchsia-700 disabled:bg-slate-400 transition">
                                        {isLoading ? <LoadingSpinner /> : <Sparkles className="w-5 h-5"/>}
                                        Analyze Video
                                    </button>
                                </div>
                            </div>
                        )}
                        {isCameraEnabled && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                {!isRecording ? (
                                    <button onClick={handleStartRecording} className="inline-flex items-center gap-2 bg-red-600 text-white font-bold py-3 px-6 rounded-full shadow-lg animate-pulse">
                                        <Video className="w-6 h-6"/>
                                        Start Recording
                                    </button>
                                ) : (
                                    <button onClick={handleStopRecording} className="inline-flex items-center gap-2 bg-red-800 text-white font-bold py-3 px-6 rounded-full shadow-lg">
                                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                                        Stop Recording
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 2 & 3: Analysis and submission */}
                    {isLoading && (
                        <div className="text-center p-6 flex flex-col items-center gap-4">
                            <LoadingSpinner />
                            <p className="text-slate-500 dark:text-slate-400">Analyzing video... this may take a moment.</p>
                        </div>
                    )}

                    {error && <p className="text-red-500 bg-red-50 dark:bg-red-900/30 p-3 rounded-md text-sm">{error}</p>}

                    {analysisResult && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Zap className="w-6 h-6 text-brand-primary-500" />
                                AI Analysis Complete
                            </h3>

                             {analysisResult.inventoryWarning && (
                                <div className="p-3 rounded-md flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800/50">
                                    <AlertTriangle className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Inventory Warning</h4>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{analysisResult.inventoryWarning}</p>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-100 dark:bg-slate-900/70 p-6 rounded-lg space-y-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-lg font-semibold text-slate-800 dark:text-white">{analysisResult.title}</h4>
                                    <PriorityBadge priority={analysisResult.priority} />
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{analysisResult.description}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <div>
                                        <h5 className="font-semibold mb-2 flex items-center gap-2"><Tool className="w-4 h-4"/> Suggested Tools</h5>
                                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                                            {analysisResult.tools.map(tool => <li key={tool}>{tool}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold mb-2 flex items-center gap-2"><ClipboardList className="w-4 h-4"/> Suggested Materials</h5>
                                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                                            {analysisResult.materials.map(mat => <li key={mat}>{mat}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Estimated Cost</h5>
                                        <p>Materials: <span className="font-medium">${analysisResult.estimatedCost.materials.toFixed(2)}</span></p>
                                        <p>Labor: <span className="font-medium">${analysisResult.estimatedCost.labor.toFixed(2)}</span></p>
                                        <p className="font-bold border-t border-slate-300 dark:border-slate-600 mt-1 pt-1">Total: <span className="font-extrabold">${(analysisResult.estimatedCost.materials + analysisResult.estimatedCost.labor).toFixed(2)}</span></p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitWorkOrder} className="space-y-4">
                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location / Room Number</label>
                                    <input
                                        type="text"
                                        id="location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g., Room 103, Lobby restroom"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <button type="submit" className="w-full flex justify-center items-center gap-2 bg-green-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                        <Send className="w-5 h-5"/>
                                        Submit Work Order
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
                )}
            </div>
        </div>
    );
};

export default Maintenance;