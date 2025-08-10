
import { Building, RoomStatus, Task, InventoryItem } from '../types';

function generateRooms(start: number, end: number, status: RoomStatus = 'vacant-clean'): any[] {
    const rooms = [];
    for (let i = start; i <= end; i++) {
        rooms.push({
            id: String(i),
            number: String(i),
            status: status,
            workOrders: [],
        });
    }
    return rooms;
}

export const hotelData: Building[] = [
    {
        name: "Building #2 (Attached)",
        floors: [
            {
                level: 1,
                rooms: [
                    ...generateRooms(100, 100, 'vacant-clean'),
                    { 
                        id: '101',
                        number: '101', 
                        status: 'occupied', 
                        guest: 'John Smith',
                        workOrders: [
                            { id: 'wo-hist-101-1', title: 'Replaced shower head', date: '2023-11-15', estimatedCost: 125.50, priority: 'Low', status: 'Completed', description: 'Replaced old shower head with a new water-efficient model.' },
                            { id: 'wo-hist-101-2', title: 'Fixed stuck window latch', date: '2024-02-01', estimatedCost: 75.00, priority: 'Medium', status: 'Completed', description: 'Lubricated and realigned the window locking mechanism.' },
                        ]
                    },
                    { id: '102', number: '102', status: 'vacant-clean' },
                    { 
                      id: '103', 
                      number: '103', 
                      status: 'maintenance', 
                      guest: '',
                      maintenanceInfo: {
                        description: "Reported leaky faucet in the bathroom sink and flickering overhead lights. Parts have been ordered.",
                        progress: 60,
                        photos: [
                            "https://images.unsplash.com/photo-158258435210-3fa595085348?q=80&w=800&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1604707675985-4ae6365a6396?q=80&w=800&auto=format&fit=crop"
                        ],
                        videos: [],
                        tasks: [
                            { id: 'maint-1', text: "Diagnose faucet leak", completed: true },
                            { id: 'maint-2', text: "Replace faucet washer", completed: true },
                            { id: 'maint-3', text: "Test light fixture wiring", completed: true },
                            { id: 'maint-4', text: "Install new light ballast", completed: false },
                            { id: 'maint-5', text: "Final clean-up", completed: false },
                        ]
                      },
                      workOrders: [
                        { id: 'wo-curr-103-1', title: 'Leaky Faucet & Flickering Lights', date: '2024-07-25', estimatedCost: 275.00, priority: 'High', status: 'In Progress', description: "Reported leaky faucet in the bathroom sink and flickering overhead lights. Parts have been ordered." },
                      ]
                    },
                    { id: '104', number: '104', status: 'vacant-dirty' },
                    { id: '105', number: '105', status: 'vip', guest: 'Dr. Evelyn Reed' },
                    ...generateRooms(106, 120, 'vacant-clean'),
                ]
            },
            {
                level: 2,
                rooms: [
                    { id: '200', number: '200', status: 'occupied', guest: 'Maria Garcia' },
                    ...generateRooms(201, 220, 'vacant-clean')
                ]
            }
        ]
    },
    {
        name: "Building #1 (Main)",
        floors: [
            {
                level: 2,
                rooms: generateRooms(221, 299, 'under-construction'),
            },
            {
                level: 3,
                rooms: generateRooms(300, 330, 'under-construction'),
            }
        ]
    }
];

export const initialTasks: Task[] = [
  { 
    id: 1, 
    text: 'Inspect fire extinguishers in Building #2',
    completed: false,
    isNew: false,
    subTasks: [
        { text: 'Check pressure gauges on all floor 1 extinguishers.', assignee: 'Roy', completed: false },
        { text: 'Verify inspection tags are up to date.', assignee: 'Roy', completed: false },
        { text: 'Document findings for compliance report.', assignee: 'Dane', completed: false },
    ],
    materials: ['Inspection tags'],
    tools: ['Flashlight', 'Rag']
  },
  { 
    id: 2, 
    text: 'Deep clean lobby furniture', 
    completed: true,
    isNew: false,
    subTasks: [
         { text: 'Vacuum all upholstered chairs and sofas.', assignee: 'Roy', completed: true },
         { text: 'Shampoo fabric surfaces.', assignee: 'Roy', completed: true },
    ],
    materials: ['Upholstery shampoo', 'Microfiber cloths'],
    tools: ['Commercial vacuum', 'Upholstery cleaner machine']
  },
];

export const initialInventory: InventoryItem[] = [
    { id: 'inv-1', name: 'Bath Towels', quantity: 85, status: 'Stocked', lastUpdated: '2024-07-24' },
    { id: 'inv-2', name: 'Hand Towels', quantity: 120, status: 'Stocked', lastUpdated: '2024-07-24' },
    { id: 'inv-3', name: 'Shampoo (travel size)', quantity: 250, status: 'Stocked', lastUpdated: '2024-07-23' },
    { id: 'inv-4', name: 'Conditioner (travel size)', quantity: 7, status: 'Low Stock', lastUpdated: '2024-07-23' },
    { id: 'inv-5', name: 'Lightbulbs (A19 LED)', quantity: 45, status: 'Stocked', lastUpdated: '2024-07-22' },
    { id: 'inv-6', name: 'AAA Batteries', quantity: 8, status: 'Low Stock', lastUpdated: '2024-07-22' },
    { id: 'inv-7', name: 'Coffee Pods (Regular)', quantity: 150, status: 'Stocked', lastUpdated: '2024-07-25' },
];
