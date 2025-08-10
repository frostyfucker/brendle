
import React, { useState, useEffect } from 'react';
import { Building, Room, RoomStatus, LocalGuideResult, Attraction, WorkOrderRecord, UserRole, HotelFloor, Task, User } from '../types';
import { Star, Hotel, User as UserIcon, Wrench, Sun, Camera, ClipboardList, CheckSquare, Square, History, AlertTriangle, DollarSign, Tool, X, Edit, Save, Plus, Trash2, Layout, Sparkles, MapPin, Search } from './Icons';
import { generateWelcomeMessage, recommendLocalAttractions } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const statusConfig: { [key in RoomStatus]: { label: string; bg: string; icon: React.ReactNode } } = {
    'occupied': { label: 'Occupied', bg: 'bg-blue-500/20 dark:bg-blue-500/30 border-blue-500', icon: <UserIcon className="w-4 h-4 text-blue-500" /> },
    'vip': { label: 'VIP', bg: 'bg-purple-500/20 dark:bg-purple-500/30 border-purple-500', icon: <Star className="w-4 h-4 text-purple-500" /> },
    'vacant-clean': { label: 'Clean', bg: 'bg-green-500/20 dark:bg-green-500/30 border-green-500', icon: <Sun className="w-4 h-4 text-green-500" /> },
    'vacant-dirty': { label: 'Needs Cleaning', bg: 'bg-yellow-500/20 dark:bg-yellow-500/30 border-yellow-500', icon: <Hotel className="w-4 h-4 text-yellow-500" /> },
    'maintenance': { label: 'Maintenance', bg: 'bg-red-500/20 dark:bg-red-500/30 border-red-500', icon: <Wrench className="w-4 h-4 text-red-500" /> },
    'under-construction': { label: 'Construction', bg: 'bg-slate-400/20 dark:bg-slate-600/30 border-slate-500', icon: <Tool className="w-4 h-4 text-slate-500" /> },
};

const priorityBadgeColors: Record<WorkOrderRecord['priority'], string> = {
    High: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
};

const statusBadgeColors: Record<WorkOrderRecord['status'], string> = {
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    Completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

type RoomDetailTab = 'status' | 'history';
type ViewMode = 'grid' | 'floorPlan';

const RoomDetailModal: React.FC<{
    room: Room;
    onClose: () => void;
    onSave: (updatedRoom: Room) => void;
    onDelete: (buildingName: string, floorLevel: number, roomId: string) => void;
    onUpdateWorkOrderStatus: (workOrderId: string, status: WorkOrderRecord['status']) => void;
    currentUserRole: UserRole;
    buildingName: string;
    floorLevel: number;
}> = ({ room, onClose, onSave, onDelete, onUpdateWorkOrderStatus, currentUserRole, buildingName, floorLevel }) => {
    const [activeTab, setActiveTab] = useState<RoomDetailTab>('status');
    const [isEditing, setIsEditing] = useState(false);
    const [editedRoom, setEditedRoom] = useState<Room>(room);
    const [showServiceModal, setShowServiceModal] = useState<'welcome' | 'guide' | null>(null);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (showServiceModal) {
                    setShowServiceModal(null);
                } else {
                    onClose();
                }
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose, showServiceModal]);

    useEffect(() => {
        setActiveTab('status');
        setIsEditing(false);
        setEditedRoom(room);
        setShowServiceModal(null);
    }, [room]);

    const handleSave = () => {
        onSave(editedRoom);
        setIsEditing(false);
    };
    
    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete room ${room.number}? This action cannot be undone.`)) {
            onDelete(buildingName, floorLevel, room.id);
        }
    }

    const TabButton: React.FC<{tabId: RoomDetailTab; children: React.ReactNode; icon: React.ReactNode}> = ({tabId, children, icon}) => (
        <button onClick={() => setActiveTab(tabId)} role="tab" aria-selected={activeTab === tabId} className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tabId ? 'text-brand-primary-600 dark:text-brand-primary-400 border-brand-primary-500' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'}`}>
          {icon}
          {children}
        </button>
    );

    const renderWorkOrderHistory = () => (
        <>
            {room.workOrders && room.workOrders.length > 0 ? (
                <div className="space-y-3">
                    {room.workOrders.map(record => (
                        <div key={record.id} className="bg-slate-50 dark:bg-slate-900/70 p-3 rounded-lg">
                            <div className='flex justify-between items-start mb-2'>
                                <p className="font-semibold text-sm text-slate-800 dark:text-white pr-2">{record.title}</p>
                                {currentUserRole === 'admin' ? (
                                    <select
                                        value={record.status}
                                        onChange={(e) => onUpdateWorkOrderStatus(record.id, e.target.value as WorkOrderRecord['status'])}
                                        className={`text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-brand-primary-500 ${statusBadgeColors[record.status]}`}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                ) : (
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadgeColors[record.status]}`}>{record.status}</span>
                                )}
                            </div>
                            <p className='text-xs text-slate-600 dark:text-slate-400 mb-2'>{record.description}</p>
                            {record.inventoryWarning && (
                                <div className="text-xs flex items-start gap-2 p-2 my-2 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {record.inventoryWarning}
                                </div>
                            )}
                            {(record.materials && record.materials.length > 0) && (
                                <div className="text-xs my-2">
                                    <h5 className="font-semibold">Materials:</h5>
                                    <ul className="list-disc list-inside text-slate-500 dark:text-slate-400">
                                        {record.materials.map(m => <li key={m}>{m}</li>)}
                                    </ul>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-1 border-t border-slate-200 dark:border-slate-700 pt-2">
                                <span className={`font-medium px-2 py-0.5 rounded-full ${priorityBadgeColors[record.priority]}`}>{record.priority} priority</span>
                                <span className='font-medium'>{record.date}</span>
                                {currentUserRole === 'admin' && <span className="flex items-center gap-1 font-medium"><DollarSign className="w-3 h-3"/> {record.estimatedCost.toFixed(2)}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No maintenance history for this room.</p>}
        </>
    );
    
    const renderEditForm = () => (
         <div className="space-y-4 animate-fade-in">
            <div>
                <label htmlFor="room-number" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Room Number</label>
                <input type="text" id="room-number" value={editedRoom.number} onChange={(e) => setEditedRoom({...editedRoom, number: e.target.value})} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-brand-primary-500 outline-none transition" />
            </div>
             <div>
                <label htmlFor="room-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select id="room-status" value={editedRoom.status} onChange={(e) => setEditedRoom({...editedRoom, status: e.target.value as RoomStatus})} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-brand-primary-500 outline-none transition">
                    {Object.entries(statusConfig).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="guest-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Guest Name (optional)</label>
                <input type="text" id="guest-name" value={editedRoom.guest || ''} onChange={(e) => setEditedRoom({...editedRoom, guest: e.target.value})} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-brand-primary-500 outline-none transition" />
            </div>
        </div>
    );
    
    const renderStatusView = () => (
         <>
            {currentUserRole === 'admin' && room.guest && (
                <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-800 dark:text-slate-200 text-lg font-semibold">{room.guest}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Current Guest</p>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button onClick={() => setShowServiceModal('welcome')} className="flex-1 text-sm flex items-center justify-center gap-2 bg-brand-primary-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-brand-primary-700 transition">
                           <Sparkles className="w-4 h-4"/> Create Welcome Note
                        </button>
                        <button onClick={() => setShowServiceModal('guide')} className="flex-1 text-sm flex items-center justify-center gap-2 bg-slate-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-slate-700 transition">
                            <MapPin className="w-4 h-4" /> Find Local Attractions
                        </button>
                    </div>
                </div>
            )}
            {room.status === 'maintenance' && room.maintenanceInfo ? (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-300">{room.maintenanceInfo.description}</p>
                </div>
            ) : (!room.guest) ? <p className="text-sm text-slate-500 text-center py-6">No active issues or guest assigned.</p> : null }
        </>
    );

    const renderServiceModal = () => {
        if (!showServiceModal || !room.guest) return null;

        if (showServiceModal === 'welcome') {
            return <ServiceSubModal title="Create Welcome Note" guestName={room.guest} onClose={() => setShowServiceModal(null)} service="welcome" />
        }
        if (showServiceModal === 'guide') {
            return <ServiceSubModal title="Find Local Attractions" guestName={room.guest} onClose={() => setShowServiceModal(null)} service="guide" />
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-30 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-primary-600 dark:text-brand-primary-400">Room {isEditing ? editedRoom.number : room.number}</h2>
                         <div className={`inline-flex items-center gap-2 px-3 py-1 mt-2 rounded-full text-sm font-medium ${statusConfig[room.status].bg.replace('border-', 'text-').replace('/20', '').replace('/30', '')}`}>
                            {statusConfig[room.status].icon} <span>{statusConfig[room.status].label}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                {!isEditing &&
                    <div className="border-b border-slate-200 dark:border-slate-700 flex" role="tablist">
                        <TabButton tabId="status" icon={<AlertTriangle className="w-4 h-4" />}>Current Status</TabButton>
                        <TabButton tabId="history" icon={<History className="w-4 h-4" />}>History</TabButton>
                    </div>
                }
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 relative">
                    {isEditing ? renderEditForm() : (activeTab === 'status' ? renderStatusView() : renderWorkOrderHistory())}
                    {renderServiceModal()}
                </div>
                {currentUserRole === 'admin' && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        {isEditing ?
                            <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> Delete Room
                            </button>
                         : <div></div>}
                        <div className="flex gap-2 ml-auto">
                            {isEditing ? (
                                <>
                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600">Cancel</button>
                                <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary-600 hover:bg-brand-primary-700 rounded-md flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                                </>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary-600 hover:bg-brand-primary-700 rounded-md flex items-center gap-2">
                                    <Edit className="w-4 h-4" /> Edit Room
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ServiceSubModal: React.FC<{
    title: string;
    guestName: string;
    onClose: () => void;
    service: 'welcome' | 'guide';
}> = ({ title, guestName, onClose, service }) => {
    const [interests, setInterests] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<string | LocalGuideResult | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setResult(null);
        try {
            if (service === 'welcome') {
                const message = await generateWelcomeMessage(guestName, interests);
                setResult(message);
            } else {
                const recommendations = await recommendLocalAttractions(interests);
                setResult(recommendations);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error has occurred.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm z-10 flex flex-col p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title} for {guestName}</h3>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                    <X className="w-5 h-5"/>
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="interests" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Guest Interests</label>
                    <input type="text" id="interests" value={interests} onChange={e => setInterests(e.target.value)} placeholder="e.g., hiking, fine dining" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary-500 outline-none transition" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-brand-primary-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary-700 disabled:bg-slate-400">
                    {isLoading ? <LoadingSpinner /> : (service === 'welcome' ? 'Generate Note' : 'Get Recommendations')}
                </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="mt-4 flex-1 overflow-y-auto">
                {result && service === 'welcome' && <div className="prose prose-sm dark:prose-invert bg-slate-100 dark:bg-slate-700 p-4 rounded-md"><p>{result as string}</p></div>}
                {result && service === 'guide' && (
                    <div className="space-y-3">
                        {(result as LocalGuideResult).attractions.map((att, i) => (
                             <div key={i} className="bg-slate-100 dark:bg-slate-700 p-3 rounded-md">
                                <h4 className="font-semibold text-slate-800 dark:text-white">{att.name} <span className="text-xs font-normal text-brand-primary-500">({att.type})</span></h4>
                                <p className="text-xs text-slate-600 dark:text-slate-300">{att.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

const HotelPulse: React.FC<{currentUserRole: UserRole}> = ({ currentUserRole }) => {
    const { user } = useAuth();
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [selectedRoomLocation, setSelectedRoomLocation] = useState<{buildingName: string, floorLevel: number} | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const loadHotelData = () => {
        if (!user) return;
        const data = localStorage.getItem(`${user.id}-hotelBrendleData`);
        if (data) {
            setBuildings(JSON.parse(data));
        }
    };

    useEffect(() => {
        loadHotelData();
        const handleStorageChange = (e: StorageEvent) => {
             if (e.key === `${user?.id}-hotelBrendleData`) {
                loadHotelData();
             }
        }
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [user]); 

    const handleUpdateRoom = (updatedRoom: Room) => {
        if (!user) return;
        setBuildings(prevBuildings => {
            const newBuildings = prevBuildings.map(b => ({
                ...b,
                floors: b.floors.map(f => ({
                    ...f,
                    rooms: f.rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r)
                }))
            }));
            localStorage.setItem(`${user.id}-hotelBrendleData`, JSON.stringify(newBuildings));
            return newBuildings;
        });
        setSelectedRoom(updatedRoom);
    };
    
    const handleDeleteRoom = (buildingName: string, floorLevel: number, roomId: string) => {
        if (!user) return;
        setBuildings(currentBuildings => {
            const newData = currentBuildings.map(building => {
                if (building.name !== buildingName) return building;
                return {
                    ...building,
                    floors: building.floors.map(floor => {
                        if (floor.level !== floorLevel) return floor;
                        return {
                            ...floor,
                            rooms: floor.rooms.filter(room => room.id !== roomId)
                        };
                    })
                };
            });
            localStorage.setItem(`${user.id}-hotelBrendleData`, JSON.stringify(newData));
            return newData;
        });
        setSelectedRoom(null); // Close modal
    };
    
    const handleAddRoom = (buildingName: string, floorLevel: number) => {
        if (!user) return;
        const newRoomNumber = prompt(`Enter new room number for Floor ${floorLevel}:`);
        if (!newRoomNumber || isNaN(parseInt(newRoomNumber))) {
            if (newRoomNumber) alert("Please enter a valid room number.");
            return;
        };

        const newRoom: Room = {
            id: `room-${Date.now()}`,
            number: newRoomNumber,
            status: 'vacant-clean',
            workOrders: []
        };

        setBuildings(currentBuildings => {
            const newData = currentBuildings.map(b => {
                if (b.name !== buildingName) return b;
                return {
                    ...b,
                    floors: b.floors.map(f => {
                        if (f.level !== floorLevel) return f;
                        return { ...f, rooms: [...f.rooms, newRoom].sort((a, b) => parseInt(a.number) - parseInt(b.number)) };
                    })
                };
            });
            localStorage.setItem(`${user.id}-hotelBrendleData`, JSON.stringify(newData));
            return newData;
        });
    };

    const handleUpdateWorkOrderStatus = (workOrderId: string, status: WorkOrderRecord['status']) => {
        if (!user) return;
        setBuildings(prevBuildings => {
            const updatedData = prevBuildings.map(b => ({
                ...b,
                floors: b.floors.map(f => ({
                    ...f,
                    rooms: f.rooms.map(r => ({
                        ...r,
                        workOrders: r.workOrders?.map(wo => wo.id === workOrderId ? {...wo, status} : wo)
                    }))
                }))
            }));
            localStorage.setItem(`${user.id}-hotelBrendleData`, JSON.stringify(updatedData));
            // Update selected room state if it's open
            if(selectedRoom) {
                const newSelectedRoom = updatedData
                    .flatMap(b => b.floors)
                    .flatMap(f => f.rooms)
                    .find(r => r.id === selectedRoom.id);
                if(newSelectedRoom) setSelectedRoom(newSelectedRoom);
            }
            return updatedData;
        });
    };

    const handleRoomClick = (room: Room, buildingName: string, floorLevel: number) => {
        setSelectedRoom(room);
        setSelectedRoomLocation({ buildingName, floorLevel });
    };

    const renderRooms = (rooms: Room[], buildingName: string, floorLevel: number) => {
        const baseClass = "p-3 rounded-lg border text-left transition-all duration-200 shadow-sm";
        const hoverClass = "hover:shadow-lg hover:-translate-y-0.5";
        
        if (viewMode === 'floorPlan') {
            return (
                 <div className="flex flex-nowrap gap-2 overflow-x-auto pb-4 -ml-2 pl-2">
                    {rooms.map(room => (
                         <button key={room.id} onClick={() => handleRoomClick(room, buildingName, floorLevel)} className={`w-32 h-24 flex-shrink-0 flex flex-col justify-between ${baseClass} ${hoverClass} ${statusConfig[room.status].bg}`}>
                            <div>
                                <span className="font-bold text-sm text-slate-800 dark:text-white">{room.number}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                {statusConfig[room.status].icon}
                                <span>{statusConfig[room.status].label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )
        }
        
        return (
            <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                {rooms.map(room => (
                    <button key={room.id} onClick={() => handleRoomClick(room, buildingName, floorLevel)} className={`${baseClass} ${statusConfig[room.status].bg} ${hoverClass}`}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-slate-800 dark:text-white">{room.number}</span>
                            {statusConfig[room.status].icon}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{statusConfig[room.status].label}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Hotel Pulse</h1>
                <div className="flex items-center gap-2 rounded-lg bg-slate-200 dark:bg-slate-800 p-1">
                    <button onClick={() => setViewMode('grid')} className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${viewMode === 'grid' ? 'bg-brand-primary-500 text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Grid</button>
                    <button onClick={() => setViewMode('floorPlan')} className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${viewMode === 'floorPlan' ? 'bg-brand-primary-500 text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Floor Plan</button>
                </div>
            </div>

            <div className="flex-grow space-y-8 overflow-y-auto pr-4 -mr-4">
                {buildings.map(building => (
                    <div key={building.name}>
                         <h2 className="text-2xl font-semibold mb-4 text-brand-primary-700 dark:text-brand-primary-300 sticky top-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm py-2">{building.name}</h2>
                         <div className="space-y-6">
                            {building.floors.map(floor => (
                                <div key={floor.level}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Floor {floor.level}</h3>
                                        {currentUserRole === 'admin' && (
                                            <button onClick={() => handleAddRoom(building.name, floor.level)} className="flex items-center gap-1 text-xs font-semibold text-brand-primary-600 dark:text-brand-primary-400 hover:text-brand-primary-800 dark:hover:text-brand-primary-200">
                                                <Plus className="w-4 h-4" /> Add Room
                                            </button>
                                        )}
                                    </div>
                                    {renderRooms(floor.rooms, building.name, floor.level)}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {selectedRoom && selectedRoomLocation && <RoomDetailModal 
                room={selectedRoom} 
                onClose={() => setSelectedRoom(null)} 
                onSave={handleUpdateRoom} 
                onDelete={handleDeleteRoom} 
                onUpdateWorkOrderStatus={handleUpdateWorkOrderStatus} 
                currentUserRole={currentUserRole}
                buildingName={selectedRoomLocation.buildingName}
                floorLevel={selectedRoomLocation.floorLevel}
             />}
        </div>
    );
};

export default HotelPulse;