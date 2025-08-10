
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type UserRole = 'admin' | 'staff' | 'guest';
export type View = 'dashboard' | 'renovation-advisor' | 'budget-tracker' | 'maintenance-repair' | 'hotel-pulse' | 'guest-services' | 'local-guide' | 'time-clock' | 'inventory' | 'session-summarizer' | 'bulletin-board' | 'file-share';

export interface SubTask {
    text: string;
    assignee: string;
    completed: boolean;
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  isNew?: boolean;
  aiStatus?: 'Approved' | 'On Hold';
  note?: string;
  subTasks?: SubTask[];
  materials?: string[];
  tools?: string[];
}

export interface RenovationAdvice {
    conceptSummary: string;
    designElements: string[];
    materialSuggestions: string[];
    potentialChallenges: string[];
}

export interface Expense {
    id: string;
    title: string;
    date: string;
    amount: number;
    category: 'Repair' | 'Materials' | 'Labor' | 'Other';
}

export interface WorkOrder {
    title: string;
    priority: 'Low' | 'Medium' | 'High';
    description: string;
    location: string;
    tools: string[];
    materials: string[];
    estimatedCost: {
      materials: number;
      labor: number;
    }
}

export interface WorkOrderRecord {
    id: string;
    title: string;
    date: string;
    estimatedCost: number;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Pending' | 'In Progress' | 'Completed';
    description: string;
    materials?: string[];
    inventoryWarning?: string;
}

// Types for Hotel Pulse feature
export type RoomStatus = 'occupied' | 'vacant-clean' | 'vacant-dirty' | 'maintenance' | 'vip' | 'under-construction';

export interface MaintenanceTask {
    id: string;
    text: string;
    completed: boolean;
}

export interface MaintenanceInfo {
    description: string;
    progress: number; // A value from 0 to 100
    photos: string[]; // URLs to images
    videos: string[]; // URLs to videos
    tasks: MaintenanceTask[];
}

export interface Room {
  id: string;
  number: string;
  status: RoomStatus;
  guest?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  maintenanceInfo?: MaintenanceInfo;
  workOrders?: WorkOrderRecord[];
}

export interface HotelFloor {
  level: number;
  rooms: Room[];
}

export interface Building {
  name: string;
  floors: HotelFloor[];
}

export interface OperationalAlert {
    id:string;
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
}

export interface FeedbackAnalysisResult {
    summary: string;
    positives: string[];
    negatives: string[];
}

export interface Attraction {
    name: string;
    type: string;
    description: string;
}

export interface LocalGuideResult {
    attractions: Attraction[];
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  status: 'Stocked' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

export interface OrderItem {
    name: string;
    quantity: number;
}

export interface OrderRequest {
    id: string;
    date: string;
    items: OrderItem[];
    status: 'Pending' | 'Ordered';
}

export interface SessionSummaryResult {
    summary: string;
    keyPoints: string[];
    actionItems: string[];
}