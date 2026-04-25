export const INITIAL_SERVICES = [
  { 
    id: 'bank', 
    name: 'Main Desk 01', 
    prefix: 'B', 
    currentServing: 104, 
    lastIssued: 110,
    staffName: 'Sarah Jenkins',
    staffAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&h=100&auto=format&fit=crop',
    status: 'active',
    type: 'counter_1'
  },
  { 
    id: 'radeema', 
    name: 'Support Hub', 
    prefix: 'R', 
    currentServing: 210, 
    lastIssued: 215,
    staffName: 'Marcus Chen',
    staffAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&h=100&auto=format&fit=crop',
    status: 'active',
    type: 'counter_2'
  },
  { 
    id: 'admin', 
    name: 'VIP Counter', 
    prefix: 'A', 
    currentServing: 52, 
    lastIssued: 55,
    staffName: 'Elena Rodriguez',
    staffAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&h=100&auto=format&fit=crop',
    status: 'active',
    type: 'star'
  },
  { 
    id: 'kiosk-offline', 
    name: 'Regional Kiosk', 
    prefix: 'K', 
    currentServing: 0, 
    lastIssued: 0,
    staffName: 'Offline',
    staffAvatar: null,
    status: 'maintenance',
    type: 'counter_3'
  }
];

export const INITIAL_TICKETS = [
  { id: 'mock-1', serviceId: 'bank', number: 'B-101', userId: 'mock@example.com', status: 'done', createdAt: Date.now() - 1000000 },
  { id: 'mock-2', serviceId: 'bank', number: 'B-104', userId: 'sarah@test.com', status: 'called', createdAt: Date.now() - 500000 },
  { id: 'mock-3', serviceId: 'radeema', number: 'R-210', userId: 'marcus@test.com', status: 'called', createdAt: Date.now() - 300000 },
  { id: 'mock-4', serviceId: 'admin', number: 'A-052', userId: 'elena@test.com', status: 'called', createdAt: Date.now() - 100000 },
  { id: 'mock-5', serviceId: 'bank', number: 'B-105', userId: 'john@test.com', status: 'waiting', createdAt: Date.now() - 400000 },
  { id: 'mock-6', serviceId: 'bank', number: 'B-106', userId: 'anna@test.com', status: 'waiting', createdAt: Date.now() - 350000 },
  { id: 'mock-7', serviceId: 'radeema', number: 'R-211', userId: 'li@test.com', status: 'waiting', createdAt: Date.now() - 200000 },
];
