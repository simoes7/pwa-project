import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopBar from '../components/AdminTopBar';

const AdminControlPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [services, setServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg_wait: 0, total_today: 0, currently_serving: 0 });
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualService, setManualService] = useState('');

  const fetchData = async () => {
    try {
      const serviceParam = user?.serviceId ? `?serviceId=${user.serviceId}` : '';
      const serviceParamAmp = user?.serviceId ? `&serviceId=${user.serviceId}` : '';
      const [ticketsRes, servicesRes, statsRes] = await Promise.all([
        fetch(`http://localhost:3001/tickets${serviceParam}`),
        fetch('http://localhost:3001/services'),
        fetch(`http://localhost:3001/stats${serviceParam}`)
      ]);
      
      if (ticketsRes.ok && servicesRes.ok && statsRes.ok) {
        setTickets(await ticketsRes.json());
        setServices(await servicesRes.json());
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async (serviceId) => {
    try {
      const response = await fetch('http://localhost:3001/tickets/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error calling next:', err);
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const response = await fetch(`http://localhost:3001/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
    }
  };

  const handleGlobalCallNext = () => {
    if (waitingTickets.length > 0) {
      handleCallNext(waitingTickets[0].service_id);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualName || !manualService) return;

    try {
      const response = await fetch('http://localhost:3001/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `guest_${Date.now()}`,
          userName: manualName,
          serviceId: manualService
        })
      });
      if (response.ok) {
        setManualName('');
        setShowManualModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error adding manual ticket:', err);
    }
  };

  // Column Filtering
  const waitingTickets = tickets
    .filter(t => t.status === 'waiting')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  const inProgressTickets = tickets
    .filter(t => t.status === 'called')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  const completedTickets = tickets
    .filter(t => t.status === 'done' || t.status === 'cancelled')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10); 

  const getWaitTime = (createdAt) => {
    const diff = Math.floor((Date.now() - new Date(createdAt)) / 60000);
    return diff < 1 ? 'Just joined' : `${diff}m wait`;
  };

  return (
    <div style={styles.dashboardLayout}>
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="admin-main-content" style={{
        ...styles.mainContent,
        marginLeft: window.innerWidth > 1024 ? '260px' : '0'
      }}>
        <AdminTopBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          placeholder="Search tickets, customers..." 
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* Board Header */}
        <div style={styles.boardHeader}>
          <div>
            <h2 className="headline" style={styles.pageTitle}>
              {user?.serviceId ? services.find(s => s.id === user.serviceId)?.name : 'Live Queue Board'}
            </h2>
            <p style={styles.pageSubtitle}>
              Operational view for assigned venue • <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{services.length} active counters</span>
            </p>
          </div>
          <button 
            className="primary-gradient" 
            style={styles.globalCallBtn}
            onClick={handleGlobalCallNext}
            disabled={waitingTickets.length === 0}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <span>Global Call Next</span>
          </button>
        </div>

        {/* Kanban Board */}
        <div style={styles.kanbanGrid}>
          
          {/* Waiting Column */}
          <section style={styles.kanbanColumn}>
            <div style={styles.columnHeader}>
              <div style={styles.columnTitleWrap}>
                <span style={{ ...styles.columnIndicator, backgroundColor: 'var(--secondary)' }}></span>
                <h3 className="headline" style={styles.columnTitle}>Waiting</h3>
              </div>
              <span style={styles.columnBadge}>{waitingTickets.length} Clients</span>
            </div>
            
            <div style={styles.ticketList}>
              {waitingTickets.map(ticket => {
                const service = services.find(s => s.id === ticket.service_id);
                return (
                  <div key={ticket.id} className="glass-card" style={styles.ticketCard}>
                    <div style={styles.ticketTop}>
                      <div>
                        <span style={styles.ticketTag}>TICKET #T-{String(ticket.id).padStart(3, '0')}</span>
                        <h4 className="headline" style={styles.customerName}>{ticket.user_name || 'Guest'}</h4>
                      </div>
                      <span style={styles.waitTimeBadge}>{getWaitTime(ticket.created_at)}</span>
                    </div>
                    <div style={styles.ticketInfo}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
                      <span>{service?.name || 'General Inquiry'} • Priority: Normal</span>
                    </div>
                    <div style={styles.ticketActions}>
                      <button 
                        style={styles.callSmallBtn}
                        onClick={() => handleCallNext(ticket.service_id)}
                      >
                        Call Next
                      </button>
                      <button style={styles.moreIconBtn} onClick={() => updateTicketStatus(ticket.id, 'cancelled')}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              <button 
                style={styles.manualEntryBtn}
                onClick={() => {
                  setManualService(user?.serviceId || services[0]?.id || '');
                  setShowManualModal(true);
                }}
              >
                <span className="material-symbols-outlined">add</span>
                Manual Entry
              </button>
            </div>
          </section>

          {/* In Progress Column */}
          <section style={styles.kanbanColumn}>
            <div style={styles.columnHeader}>
              <div style={styles.columnTitleWrap}>
                <span style={{ ...styles.columnIndicator, backgroundColor: 'var(--primary)' }}></span>
                <h3 className="headline" style={styles.columnTitle}>In Progress</h3>
              </div>
              <span style={styles.columnBadge}>{inProgressTickets.length} Serving</span>
            </div>

            <div style={styles.ticketList}>
              {inProgressTickets.map(ticket => {
                const service = services.find(s => s.id === ticket.service_id);
                return (
                  <div key={ticket.id} className="glass-card" style={{ ...styles.ticketCard, borderLeft: '4px solid var(--primary)' }}>
                    <div style={styles.servingHeader}>
                      <div style={styles.servingUser}>
                        <div style={styles.avatarCircle}>
                           {(ticket.user_name || 'G').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="headline" style={styles.servingName}>{ticket.user_name || 'Guest'}</h4>
                          <p style={styles.servingSubText}>TICKET #T-{String(ticket.id).padStart(3, '0')}</p>
                        </div>
                      </div>
                      <div style={styles.servingCounter}>
                        <span style={styles.counterNum}>Counter {Math.floor(Math.random() * 8) + 1}</span>
                        <span style={styles.serveTime}>Serving: 04:12m</span>
                      </div>
                    </div>
                    
                    <div style={styles.serveProgress}>
                       <div style={styles.progressFill}></div>
                    </div>

                    <div style={styles.servingActions}>
                      <button style={styles.transferBtn}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>move_up</span>
                        Transfer
                      </button>
                      <button 
                        style={styles.finishBtn}
                        onClick={() => updateTicketStatus(ticket.id, 'done')}
                      >
                        Finish Ticket
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recently Completed Column */}
          <section style={styles.kanbanColumn}>
            <div style={styles.columnHeader}>
              <div style={styles.columnTitleWrap}>
                <span style={{ ...styles.columnIndicator, backgroundColor: 'var(--outline-variant)' }}></span>
                <h3 className="headline" style={styles.columnTitle}>Recently Completed</h3>
              </div>
              <span style={styles.columnBadge}>{completedTickets.length} Today</span>
            </div>

            <div style={{ ...styles.ticketList, opacity: 0.8 }}>
              {completedTickets.map(ticket => (
                <div key={ticket.id} style={styles.historyItem}>
                  <div style={styles.historyMain}>
                    <div style={{ 
                      ...styles.historyIcon, 
                      backgroundColor: ticket.status === 'done' ? 'rgba(76, 104, 9, 0.1)' : 'rgba(172, 49, 73, 0.1)',
                      color: ticket.status === 'done' ? 'var(--tertiary)' : 'var(--error)'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', fontWeight: '700' }}>
                        {ticket.status === 'done' ? 'check' : 'close'}
                      </span>
                    </div>
                    <div>
                      <h5 style={styles.historyName}>{(ticket.user_id || '').split('@')[0]}</h5>
                      <p style={styles.historySub}>
                        {ticket.status === 'done' ? 'Completed by Counter 3' : 'Cancelled • No Show'}
                      </p>
                    </div>
                  </div>
                  <button style={styles.viewHistLink}>Log</button>
                </div>
              ))}

              <div style={styles.histFooter}>
                <button 
                  style={styles.viewFullHistBtn}
                  onClick={() => window.location.href = '/admin/analytics'}
                >
                  View Full History
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* Performance Metrics Footer */}
        <section style={styles.perfGrid}>
           {[
             { label: 'Avg. Wait Time', val: `${stats.avg_wait}m`, trend: null, trendType: 'down' },
             { label: 'Total Today', val: stats.total_today, trend: null, trendType: 'up', active: true },
             { label: 'Serving Now', val: stats.currently_serving, trend: null, star: true },
             { label: 'Company Capacity', val: '94%', trend: null, sub: 'Optimized' }
           ].map((metric, i) => (
             <div key={i} className="glass-card" style={{ ...styles.perfCard, borderBottom: metric.active ? '4px solid var(--primary)' : 'none' }}>
                <span style={styles.perfLabel}>{metric.label}</span>
                <div style={styles.perfMain}>
                   <span className="headline" style={styles.perfVal}>{metric.val}</span>
                   {metric.trend && (
                     <span style={{ 
                       ...styles.perfTrend, 
                       color: metric.trendType === 'up' ? 'var(--tertiary)' : 'var(--error)' 
                     }}>
                        {metric.trend}
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                          {metric.trendType === 'up' ? 'trending_up' : 'trending_down'}
                        </span>
                     </span>
                   )}
                   {metric.star && <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>star</span>}
                </div>
                {metric.sub && <p style={styles.perfSub}>{metric.sub}</p>}
             </div>
           ))}
        </section>

        {/* Manual Entry Modal */}
        {showManualModal && (
          <div style={styles.modalOverlay}>
            <div className="glass-card" style={styles.modalContent}>
              <h3 className="headline" style={styles.modalTitle}>Manual Ticket Entry</h3>
              <p style={styles.modalSub}>Issue a ticket for a walk-in client</p>
              
              <form onSubmit={handleManualSubmit} style={styles.modalForm}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Client Name</label>
                  <input 
                    style={styles.modalInput} 
                    placeholder="e.g. John Doe"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    required
                  />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Service Category</label>
                  <select 
                    style={styles.modalInput}
                    value={manualService}
                    onChange={(e) => setManualService(e.target.value)}
                    required
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.modalActions}>
                  <button type="button" style={styles.cancelBtn} onClick={() => setShowManualModal(false)}>Cancel</button>
                  <button type="submit" className="primary-gradient" style={styles.submitBtn}>Issue Ticket</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

const styles = {
  dashboardLayout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--background)',
    color: 'var(--on-surface)'
  },
  mainContent: {
    flex: 1,
    marginLeft: '260px',
    padding: '0 6rem 4rem'
  },
  boardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3rem'
  },
  pageTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    letterSpacing: '-0.05em'
  },
  pageSubtitle: {
    fontSize: '1rem',
    color: 'var(--on-surface-variant)',
    marginTop: '0.25rem'
  },
  globalCallBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.25rem 2.5rem',
    borderRadius: '1rem',
    color: 'white',
    border: 'none',
    fontWeight: '700',
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 20px 40px rgba(0, 85, 215, 0.2)',
    transition: 'transform 0.2s'
  },
  kanbanGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2.5rem',
    alignItems: 'start'
  },
  kanbanColumn: {
    backgroundColor: 'var(--surface-container-low)',
    borderRadius: '1.5rem',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    minHeight: '600px'
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  columnTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  columnIndicator: {
    width: '0.5rem',
    height: '2rem',
    borderRadius: '9999px'
  },
  columnTitle: {
    fontSize: '1.25rem',
    fontWeight: '800'
  },
  columnBadge: {
    backgroundColor: 'var(--secondary-container)',
    color: 'var(--on-secondary-container)',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.625rem',
    fontWeight: '800'
  },
  ticketList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  ticketCard: {
    padding: '1.25rem',
    backgroundColor: 'white',
    borderRadius: '1rem',
    border: '1px solid rgba(0,0,0,0.02)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
  },
  ticketTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  ticketTag: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--outline)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '0.25rem'
  },
  customerName: {
    fontSize: '1.125rem',
    fontWeight: '800'
  },
  waitTimeBadge: {
    fontSize: '10px',
    fontWeight: '600',
    backgroundColor: 'var(--surface-container-high)',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px'
  },
  ticketInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: 'var(--on-surface-variant)',
    marginBottom: '1.5rem'
  },
  ticketActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  callSmallBtn: {
    flex: 1,
    padding: '0.625rem',
    backgroundColor: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer'
  },
  moreIconBtn: {
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--on-surface-variant)',
    border: 'none',
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  manualEntryBtn: {
    width: '100%',
    padding: '1rem',
    border: '2px dashed var(--outline-variant)',
    backgroundColor: 'transparent',
    color: 'var(--outline-variant)',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    cursor: 'pointer'
  },
  servingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  servingUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  avatarCircle: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-container)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    color: 'var(--primary)'
  },
  servingName: {
    fontSize: '1rem',
    fontWeight: '800'
  },
  servingSubText: {
    fontSize: '8px',
    fontWeight: '800',
    color: 'var(--outline)',
    letterSpacing: '0.1em'
  },
  servingCounter: {
    textAlign: 'right'
  },
  counterNum: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--primary)',
    display: 'block'
  },
  serveTime: {
    fontSize: '8px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)'
  },
  serveProgress: {
    height: '6px',
    backgroundColor: 'var(--surface-container)',
    borderRadius: '9999px',
    marginBottom: '1.5rem',
    overflow: 'hidden'
  },
  progressFill: {
    width: '66%',
    height: '100%',
    background: 'linear-gradient(to right, var(--primary), var(--secondary))',
    borderRadius: '9999px'
  },
  servingActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem'
  },
  transferBtn: {
    padding: '0.625rem',
    backgroundColor: 'var(--surface-container-highest)',
    color: 'var(--primary)',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '11px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
    cursor: 'pointer'
  },
  finishBtn: {
    padding: '0.625rem',
    backgroundColor: 'var(--on-surface)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '11px',
    fontWeight: '800',
    cursor: 'pointer'
  },
  historyItem: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: '1rem',
    borderRadius: '0.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  historyMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  historyIcon: {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  historyName: {
    fontSize: '0.875rem',
    fontWeight: '800'
  },
  historySub: {
    fontSize: '8px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(13, 52, 89, 0.4)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  },
  modalContent: {
    width: '100%',
    maxWidth: '400px',
    padding: '2.5rem',
    backgroundColor: 'white'
  },
  modalTitle: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem'
  },
  modalSub: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)',
    marginBottom: '2rem'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  inputLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    color: 'var(--outline)'
  },
  modalInput: {
    padding: '0.875rem 1.25rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--surface-container-high)',
    backgroundColor: 'var(--surface-container-lowest)',
    fontSize: '1rem',
    outline: 'none'
  },
  modalActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '1rem',
    marginTop: '1rem'
  },
  cancelBtn: {
    padding: '0.875rem',
    border: 'none',
    borderRadius: '0.75rem',
    backgroundColor: 'var(--surface-container-high)',
    fontWeight: '700',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '0.875rem',
    border: 'none',
    borderRadius: '0.75rem',
    color: 'white',
    fontWeight: '700',
    cursor: 'pointer'
  },
  viewHistLink: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--primary)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer'
  },
  histFooter: {
    marginTop: '1rem',
    textAlign: 'center'
  },
  viewFullHistBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: '800',
    fontSize: '0.875rem',
    cursor: 'pointer'
  },
  perfGrid: {
    marginTop: '3rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem'
  },
  perfCard: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '120px'
  },
  perfLabel: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  },
  perfMain: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
    marginTop: '0.5rem'
  },
  perfVal: {
    fontSize: '2rem',
    fontWeight: '800'
  },
  perfTrend: {
    fontSize: '10px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: '2px'
  },
  perfSub: {
    fontSize: '10px',
    color: 'var(--on-surface-variant)',
    fontWeight: '500'
  }
};

export default AdminControlPage;
