import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopBar from '../components/AdminTopBar';
import { apiPath } from '../config';

const AdminControlPage = () => {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [services, setServices] = useState([]);
  const [servicePoints, setServicePoints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ avg_wait: 0, total_today: 0, currently_serving: 0 });
  const [nowTs, setNowTs] = useState(() => Date.now());
  
  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [targetServiceId, setTargetServiceId] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const serviceParam = user?.serviceId ? `?serviceId=${user.serviceId}` : '';
      const [ticketsRes, servicesRes, statsRes, spRes] = await Promise.all([
        authFetch(apiPath(`/tickets${serviceParam}`)),
        authFetch(apiPath('/services')),
        authFetch(apiPath(`/stats${serviceParam}`)),
        authFetch(apiPath(`/service-points${serviceParam}`))
      ]);

      if (ticketsRes.ok && servicesRes.ok && statsRes.ok && spRes.ok) {
        setTickets(await ticketsRes.json());
        setServices(await servicesRes.json());
        setStats(await statsRes.json());
        setServicePoints(await spRes.json());
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  }, [user, authFetch]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const tick = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const handleCallNext = async (serviceId, spId) => {
    try {
      const response = await authFetch(apiPath('/tickets/call-next'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceId, 
          servicePointId: spId || (servicePoints.length > 0 ? servicePoints[0].id : null) 
        })
      });
      if (response.ok) fetchData();
    } catch (err) {
      console.error('Error calling next:', err);
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const response = await authFetch(apiPath(`/tickets/${ticketId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) fetchData();
    } catch (err) {
      console.error('Error updating ticket status:', err);
    }
  };

  const handleTransfer = async () => {
    if (!selectedTicket || !targetServiceId) return;
    try {
      const response = await authFetch(apiPath(`/tickets/${selectedTicket.id}/transfer`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetServiceId })
      });
      if (response.ok) {
        setIsTransferModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error transferring ticket:', err);
    }
  };

  const getTimerData = (ticket) => {
    if (!ticket || ticket.status !== 'called' || !ticket.called_at) {
      return { text: '00:00', percent: 0, isDelayed: false, target: 10 };
    }

    // Backend provides the base
    const baseMins = ticket.elapsed_time_mins || 0;
    const baseSecs = ticket.elapsed_time_secs || 0;
    const avgMinutes = ticket.estimated_wait_time || 10;
    
    // We add local offset since the last fetch to keep it smooth
    // fetchData is called every 10s (line 47), so we can calculate drift
    // For simplicity, we can just use the backend base + local nowTs diff
    // But since the backend already calculates it, we can just use the backend values
    // and let the 10s refresh handle it, OR do local math.
    // Let's do local math for "Smooth movement" as requested.
    
    const diffSeconds = Math.floor((nowTs - new Date(ticket.called_at).getTime()) / 1000);
    const m = Math.floor(diffSeconds / 60).toString().padStart(2, '0');
    const s = (diffSeconds % 60).toString().padStart(2, '0');
    const progress = (diffSeconds / (avgMinutes * 60)) * 100;

    return {
      text: `${m}:${s}`,
      percent: Math.min(150, progress),
      isDelayed: diffSeconds > (avgMinutes * 60),
      target: avgMinutes
    };
  };

  const getTimerText = (startTime) => {
    if (!startTime) return '00:00';
    const diffSeconds = Math.floor((nowTs - new Date(startTime).getTime()) / 1000);
    const m = Math.floor(diffSeconds / 60).toString().padStart(2, '0');
    const s = (diffSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const waitingTickets = tickets
    .filter(t => t.status === 'waiting')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const inProgressTickets = tickets
    .filter(t => t.status === 'called')
    .sort((a, b) => new Date(a.called_at) - new Date(b.called_at));

  const completedTickets = tickets
    .filter(t => ['done', 'cancelled', 'no_show'].includes(t.status))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

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
          placeholder="Search live queue..."
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div style={styles.boardHeader}>
          <div>
            <h2 className="headline" style={styles.pageTitle}>Queue Control Center</h2>
            <p style={styles.pageSubtitle}>
              Monitoring <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{servicePoints.filter(s => s.status === 'active').length} active counters</span>
            </p>
          </div>
          <button
            className="primary-gradient"
            style={styles.globalCallBtn}
            onClick={() => waitingTickets.length > 0 && handleCallNext(waitingTickets[0].service_id)}
            disabled={waitingTickets.length === 0}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <span>Call Oldest Waiting</span>
          </button>
        </div>

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
              {waitingTickets.map(ticket => (
                <div key={ticket.id} className="glass-card" style={styles.ticketCard}>
                  <div style={styles.ticketTop}>
                    <div>
                      <span style={styles.ticketTag}>#T-{String(ticket.id).padStart(3, '0')}</span>
                      <h4 className="headline" style={styles.customerName}>{ticket.user_name || 'Guest'}</h4>
                    </div>
                    <span style={styles.waitTimeBadge}>{getTimerText(ticket.created_at)}</span>
                  </div>
                  <p style={styles.serviceTag}>{ticket.service_name}</p>
                  <div style={styles.ticketActions}>
                    <button style={styles.callSmallBtn} onClick={() => handleCallNext(ticket.service_id)}>Call Now</button>
                    <button style={styles.moreIconBtn} onClick={() => updateTicketStatus(ticket.id, 'no_show')}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_off</span>
                    </button>
                  </div>
                </div>
              ))}
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
              {inProgressTickets.map(ticket => (
                <div key={ticket.id} className="glass-card" style={{ 
                  ...styles.ticketCard, 
                  borderLeft: `4px solid ${getTimerData(ticket).isDelayed ? '#ef4444' : getTimerData(ticket).percent > 80 ? '#f59e0b' : 'var(--primary)'}`,
                  backgroundColor: getTimerData(ticket).isDelayed ? 'rgba(239, 68, 68, 0.02)' : 'white'
                }}>
                  <div style={styles.servingHeader}>
                    <div style={styles.servingUser}>
                      <div style={{
                        ...styles.avatarCircle,
                        backgroundColor: getTimerData(ticket).isDelayed ? '#fee2e2' : 'var(--primary-container)',
                        color: getTimerData(ticket).isDelayed ? '#ef4444' : 'var(--primary)'
                      }}>{(ticket.user_name || 'G').charAt(0)}</div>
                      <div>
                        <h4 className="headline" style={styles.servingName}>{ticket.user_name || 'Guest'}</h4>
                        <p style={styles.servingSubText}>#T-{String(ticket.id).padStart(3, '0')}</p>
                      </div>
                    </div>
                    <div style={styles.servingCounter}>
                      <span style={styles.counterNum}>{ticket.counter_name || 'Counter --'}</span>
                      <span style={{
                        ...styles.serveTime,
                        color: getTimerData(ticket).isDelayed ? '#ef4444' : getTimerData(ticket).percent > 80 ? '#f59e0b' : 'var(--on-surface-variant)'
                      }}>
                        {getTimerData(ticket).isDelayed && 'OVERTIME: '}
                        {getTimerData(ticket).text}
                      </span>
                    </div>
                  </div>
                  
                  {/* Service Progress Bar */}
                  <div style={styles.progressBarContainer}>
                    <div style={{
                      ...styles.progressBarFill,
                      width: `${Math.min(100, getTimerData(ticket).percent)}%`,
                      backgroundColor: getTimerData(ticket).isDelayed ? '#ef4444' : getTimerData(ticket).percent > 80 ? '#f59e0b' : 'var(--primary)'
                    }}></div>
                  </div>
                  <div style={styles.progressLabels}>
                    <span>Target: {getTimerData(ticket).target}m</span>
                    <span>{getTimerData(ticket).isDelayed ? 'Delayed' : `${Math.round(getTimerData(ticket).percent)}%`}</span>
                  </div>
                  {getTimerData(ticket).isDelayed && (
                    <p style={styles.delayMessage}>Service is taking longer than expected</p>
                  )}
                  <div style={styles.servingActions}>
                    <button style={styles.transferBtn} onClick={() => { setSelectedTicket(ticket); setIsTransferModalOpen(true); }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>move_up</span>
                      Transfer
                    </button>
                    <button style={styles.finishBtn} onClick={() => updateTicketStatus(ticket.id, 'done')}>Finish</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* History Column */}
          <section style={styles.kanbanColumn}>
            <div style={styles.columnHeader}>
              <div style={styles.columnTitleWrap}>
                <span style={{ ...styles.columnIndicator, backgroundColor: 'var(--outline-variant)' }}></span>
                <h3 className="headline" style={styles.columnTitle}>History</h3>
              </div>
            </div>
            <div style={styles.ticketList}>
              {completedTickets.map(ticket => (
                <div key={ticket.id} style={styles.historyItem}>
                  <div style={styles.historyMain}>
                    <div style={{
                      ...styles.historyIcon,
                      backgroundColor: ticket.status === 'done' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: ticket.status === 'done' ? '#10b981' : '#ef4444'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{ticket.status === 'done' ? 'check' : 'close'}</span>
                    </div>
                    <div>
                      <h5 style={styles.historyName}>{ticket.user_name || 'Guest'}</h5>
                      <p style={styles.historySub}>#T-{String(ticket.id).padStart(3, '0')} • {ticket.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Transfer Modal */}
        {isTransferModalOpen && (
          <div style={styles.modalOverlay}>
            <div className="glass-card" style={styles.modalContent}>
              <h3 className="headline" style={styles.modalTitle}>Transfer Ticket</h3>
              <p style={styles.modalSub}>Move {selectedTicket?.user_name} to another service line.</p>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Select Target Service</label>
                <select 
                  style={styles.modalInput} 
                  value={targetServiceId} 
                  onChange={(e) => setTargetServiceId(e.target.value)}
                >
                  <option value="">Choose service...</option>
                  {services.filter(s => s.id !== selectedTicket?.service_id).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.modalActions}>
                <button style={styles.cancelBtn} onClick={() => setIsTransferModalOpen(false)}>Cancel</button>
                <button className="primary-gradient" style={styles.submitBtn} onClick={handleTransfer}>Confirm Transfer</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  dashboardLayout: { display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--on-surface)' },
  mainContent: { flex: 1, marginLeft: '260px', padding: '0 4rem 4rem' },
  boardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', marginTop: '2rem' },
  pageTitle: { fontSize: '2rem', fontWeight: '800' },
  pageSubtitle: { fontSize: '0.875rem', color: 'var(--on-surface-variant)' },
  globalCallBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', borderRadius: '1rem', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer' },
  kanbanGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' },
  kanbanColumn: { backgroundColor: 'var(--surface-container-low)', borderRadius: '1.5rem', padding: '1.5rem', minHeight: '600px' },
  columnHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  columnTitleWrap: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  columnIndicator: { width: '4px', height: '1.5rem', borderRadius: '9999px' },
  columnTitle: { fontSize: '1.125rem', fontWeight: '800' },
  columnBadge: { backgroundColor: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700' },
  ticketList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  ticketCard: { padding: '1.25rem', backgroundColor: 'white', borderRadius: '1rem' },
  ticketTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
  ticketTag: { fontSize: '10px', fontWeight: '800', color: 'var(--outline)' },
  customerName: { fontSize: '1rem', fontWeight: '800' },
  waitTimeBadge: { fontSize: '10px', fontWeight: '700', color: 'var(--primary)' },
  serviceTag: { fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' },
  ticketActions: { display: 'flex', gap: '0.5rem' },
  callSmallBtn: { flex: 1, padding: '0.5rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' },
  moreIconBtn: { width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'var(--surface-container-high)', border: 'none', cursor: 'pointer' },
  servingHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' },
  servingUser: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatarCircle: { width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'var(--primary-container)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' },
  servingName: { fontSize: '1rem', fontWeight: '800' },
  servingSubText: { fontSize: '10px', color: 'var(--outline)' },
  servingCounter: { textAlign: 'right' },
  counterNum: { fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)', display: 'block' },
  serveTime: { fontSize: '10px', fontWeight: '700' },
  servingActions: { display: 'flex', gap: '0.5rem' },
  transferBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.5rem', backgroundColor: 'var(--surface-container-high)', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' },
  finishBtn: { flex: 1, padding: '0.5rem', backgroundColor: 'var(--on-surface)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' },
  historyItem: { display: 'flex', alignItems: 'center', padding: '1rem', backgroundColor: 'white', borderRadius: '0.75rem' },
  historyMain: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  historyIcon: { width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  historyName: { fontSize: '0.875rem', fontWeight: '700' },
  historySub: { fontSize: '10px', color: 'var(--on-surface-variant)' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { padding: '2rem', width: '90%', maxWidth: '400px' },
  modalTitle: { fontSize: '1.25rem', marginBottom: '0.5rem' },
  modalSub: { fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' },
  inputLabel: { fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' },
  modalInput: { padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)', outline: 'none' },
  modalActions: { display: 'flex', gap: '1rem' },
  cancelBtn: { flex: 1, padding: '0.75rem', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' },
  submitBtn: { flex: 1.5, padding: '0.75rem', border: 'none', borderRadius: '0.5rem', color: 'white', fontWeight: '700', cursor: 'pointer' },
  loadingContainer: { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' },
  progressBarContainer: { height: '4px', backgroundColor: 'var(--surface-container-high)', borderRadius: '2px', marginBottom: '4px', overflow: 'hidden' },
  progressBarFill: { height: '100%', transition: 'width 1s linear' },
  progressLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--outline)', marginBottom: '1.5rem', fontWeight: '600' },
  delayMessage: { fontSize: '11px', color: '#ef4444', fontWeight: '700', marginBottom: '1rem', fontStyle: 'italic' }
};

export default AdminControlPage;
