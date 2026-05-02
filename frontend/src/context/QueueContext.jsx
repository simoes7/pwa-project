/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { INITIAL_SERVICES, INITIAL_TICKETS } from './mockData';

const QueueContext = createContext();

export const useQueue = () => useContext(QueueContext);

const getInitialServices = () => {
  try {
    const stored = localStorage.getItem('sq_services');
    return stored ? JSON.parse(stored) : INITIAL_SERVICES;
  } catch {
    return INITIAL_SERVICES;
  }
};

const getInitialTickets = () => {
  try {
    const stored = localStorage.getItem('sq_tickets');
    return stored ? JSON.parse(stored) : INITIAL_TICKETS;
  } catch {
    return INITIAL_TICKETS;
  }
};

export const QueueProvider = ({ children }) => {
  const { user } = useAuth();
  const [services, setServices] = useState(getInitialServices);
  const [tickets, setTickets] = useState(getInitialTickets);
  const [queueError, setQueueError] = useState('');

  const persist = (newServices, newTickets) => {
    localStorage.setItem('sq_services', JSON.stringify(newServices));
    localStorage.setItem('sq_tickets', JSON.stringify(newTickets));
  };

  const takeTicket = (serviceId) => {
    setQueueError('');
    if (!user) {
      setQueueError('You must be logged in to take a ticket.');
      return null;
    }

    // Checking constraint: One active ticket per service
    const activeTicket = tickets.find(
      (t) => t.userId === user.id && t.serviceId === serviceId && ['waiting', 'called', 'paused'].includes(t.status)
    );

    if (activeTicket) {
      setQueueError(`You already have an active ticket (${activeTicket.number}) for this service.`);
      return null;
    }

    const serviceIndex = services.findIndex((s) => s.id === serviceId);
    if (serviceIndex === -1) return null;

    const service = services[serviceIndex];
    const nextNum = service.lastIssued + 1;
    const ticketNumber = `${service.prefix}-${nextNum}`;
    
    const newTicket = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId,
      number: ticketNumber,
      userId: user.id,
      status: 'waiting',
      createdAt: Date.now()
    };

    const newTickets = [...tickets, newTicket];
    
    const newServices = [...services];
    newServices[serviceIndex] = { ...service, lastIssued: nextNum };

    setTickets(newTickets);
    setServices(newServices);
    persist(newServices, newTickets);
    
    return newTicket;
  };

  const cancelTicket = (ticketId) => {
    const newTickets = tickets.map(t => t.id === ticketId ? { ...t, status: 'cancelled' } : t);
    setTickets(newTickets);
    persist(services, newTickets);
  };

  const pauseTicket = (ticketId) => {
    const newTickets = tickets.map(t => t.id === ticketId ? { ...t, status: 'paused' } : t);
    setTickets(newTickets);
    persist(services, newTickets);
  };
  
  // Re-activate a paused ticket
  const resumeTicket = (ticketId) => {
    const newTickets = tickets.map(t => t.id === ticketId ? { ...t, status: 'waiting' } : t);
    setTickets(newTickets);
    persist(services, newTickets);
  };

  const callNext = (serviceId) => {
    if (!user || user.role !== 'admin') return;
    
    // Find next waiting ticket for this service (oldest first)
    const waitingTickets = tickets
      .filter(t => t.serviceId === serviceId && t.status === 'waiting')
      .sort((a, b) => a.createdAt - b.createdAt);
      
    // find currently called ticket and mark as done
    const currentlyCalled = tickets.find(t => t.serviceId === serviceId && t.status === 'called');
    
    let updatedTickets = [...tickets];
    
    if (currentlyCalled) {
      updatedTickets = updatedTickets.map(t => t.id === currentlyCalled.id ? { ...t, status: 'done' } : t);
    }
    
    if (waitingTickets.length > 0) {
      const nextTicket = waitingTickets[0];
      updatedTickets = updatedTickets.map(t => t.id === nextTicket.id ? { ...t, status: 'called' } : t);
      
      const newServices = services.map(s => 
        s.id === serviceId ? { ...s, currentServing: parseInt(nextTicket.number.split('-')[1]) } : s
      );
      setServices(newServices);
      setTickets(updatedTickets);
      persist(newServices, updatedTickets);
    } else {
      setTickets(updatedTickets);
      persist(services, updatedTickets);
    }
  };

  const getUserTickets = () => {
    if (!user) return [];
    return tickets.filter(t => t.userId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  };

  const getActiveUserTickets = () => {
    if (!user) return [];
    return tickets.filter(t => t.userId === user.id && ['waiting', 'called', 'paused'].includes(t.status));
  };

  const getServiceTickets = (serviceId) => {
    return tickets.filter(t => t.serviceId === serviceId).sort((a, b) => a.createdAt - b.createdAt);
  };

  const completeTicket = (ticketId) => {
    if (!user || user.role !== 'admin') return;
    const newTickets = tickets.map(t => t.id === ticketId ? { ...t, status: 'done' } : t);
    setTickets(newTickets);
    persist(services, newTickets);
  };

  return (
    <QueueContext.Provider value={{ 
      services, 
      tickets, 
      queueError, 
      takeTicket, 
      cancelTicket, 
      pauseTicket, 
      resumeTicket,
      callNext,
      completeTicket,
      getUserTickets,
      getActiveUserTickets,
      getServiceTickets,
      setQueueError
    }}>
      {children}
    </QueueContext.Provider>
  );
};
