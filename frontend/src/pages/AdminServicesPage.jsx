import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopBar from '../components/AdminTopBar';

const AdminServicesPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [servicePoints, setServicePoints] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user?.serviceId) return;
    try {
      const [spRes, ticketsRes] = await Promise.all([
        fetch(`http://localhost:3001/service-points?serviceId=${user.serviceId}`),
        fetch(`http://localhost:3001/tickets?serviceId=${user.serviceId}`)
      ]);
      if (spRes.ok && ticketsRes.ok) {
        setServicePoints(await spRes.json());
        setTickets(await ticketsRes.json());
      }
    } catch (err) {
      console.error('Error fetching service points:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAddDesk = async () => {
    const name = prompt("Enter desk name (e.g., Counter 4):");
    const staff = prompt("Enter staff name:");
    if (!name || !staff) return;

    try {
      const res = await fetch('http://localhost:3001/service-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: user.serviceId, name, staffName: staff })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error adding desk:', err);
    }
  };

  // Top Metrics
  const activeDesks = servicePoints.filter(s => s.status === 'active').length;
  const totalDesks = servicePoints.length;
  const avgWaitTime = "08:42"; // Mocked for design fidelity

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
          placeholder="Search service points..." 
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* Section Header */}
        <header style={styles.sectionHeader}>
          <div style={{ maxWidth: '600px' }}>
            <h1 className="headline" style={styles.pageTitle}>Service Points</h1>
            <p style={styles.pageSubtitle}>
              Real-time oversight of active kiosks and service desks. Monitor throughput and staff allocation across the terminal.
            </p>
          </div>
          <div style={styles.topStatsRow}>
            <div className="glass-card" style={styles.topStatItem}>
              <span style={styles.topStatLabel}>Active Desks</span>
              <span style={styles.topStatValue}>{activeDesks}/{totalDesks}</span>
            </div>
            <div className="glass-card" style={styles.topStatItem}>
              <span style={styles.topStatLabel}>Avg Wait Time</span>
              <span style={{ ...styles.topStatValue, color: 'var(--secondary)' }}>{avgWaitTime}</span>
            </div>
          </div>
        </header>

        {/* Bento Grid */}
        <div style={styles.bentoGrid}>
          {servicePoints.map(service => {
            const currentTicket = tickets.find(t => t.service_id === service.service_id && t.status === 'called');
            const queueDepth = tickets.filter(t => t.service_id === service.service_id && t.status === 'waiting').length;
            const isOffline = service.status === 'maintenance' || service.status === 'offline';

            if (isOffline) {
              return (
                <div key={service.id} className="glass-card" style={styles.offlineCard}>
                  <div style={{ ...styles.cardHeader, opacity: 0.5 }}>
                    <div>
                      <div style={styles.titleWrap}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)' }}>desktop_windows</span>
                        <h3 className="headline" style={styles.cardTitle}>{service.name}</h3>
                      </div>
                      <span style={styles.offlineBadge}>Offline</span>
                    </div>
                  </div>
                  <div style={styles.offlineBody}>
                    <div style={styles.offlineIconBox}>
                      <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>build_circle</span>
                    </div>
                    <div>
                      <p style={styles.offlineTitle}>Desk Offline</p>
                      <p style={styles.offlineSub}>Awaiting activation</p>
                    </div>
                    <button style={styles.reactivateBtn}>Activate Desk</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={service.id} className="glass-card group" style={styles.serviceCard}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.titleWrap}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>desktop_windows</span>
                      <h3 className="headline" style={styles.cardTitle}>{service.name}</h3>
                    </div>
                    <span style={styles.activeBadge}>{service.status}</span>
                  </div>
                  <button style={styles.moreBtn}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_vert</span>
                  </button>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.staffRow}>
                    <div style={{ ...styles.avatarCircle, backgroundColor: 'var(--primary-container)', color: 'var(--primary)' }}>
                      {(service.staff_name || 'S').charAt(0)}
                    </div>
                    <div>
                      <p style={styles.staffTag}>Staff Assigned</p>
                      <p style={styles.staffName}>{service.staff_name || 'Unassigned'}</p>
                    </div>
                  </div>

                  <div style={styles.servingBox}>
                    <div style={styles.servingInfo}>
                      <p style={styles.servingTag}>Now Serving</p>
                      <div style={styles.servingValueRow}>
                        <span className="headline" style={styles.servingNum}>
                          {currentTicket ? `T-${String(currentTicket.id).padStart(3, '0')}` : '--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.queueFooter}>
                    <p style={styles.queueCountText}>{queueDepth} people in queue</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Desk CTA */}
          <button style={styles.addDeskBtn} onClick={handleAddDesk}>
            <div className="ethereal-gradient" style={styles.addIconCore}>
               <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'white' }}>add</span>
            </div>
            <div style={{ textAlign: 'center' }}>
               <h3 className="headline" style={styles.addTitle}>Add New Desk</h3>
               <p style={styles.addSub}>Initialize a new counter</p>
            </div>
          </button>
        </div>

        {/* System Status Footer */}
        <footer style={styles.statusFooter}>
          <div style={styles.statusLeft}>
            <div style={styles.statusOnline}>
               <div style={styles.greenDot}></div>
               <span>System Online</span>
            </div>
            <div style={styles.statusSync}>
               <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cloud_done</span>
               <span>Last sync: 14:02 PM</span>
            </div>
          </div>
          <div style={styles.statusActions}>
             <button style={styles.statusActionBtn}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>print</span>
                Export Stats
             </button>
             <button style={styles.statusActionBtn}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
                Refresh Data
             </button>
          </div>
        </footer>

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
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '3rem'
  },
  pageTitle: {
    fontSize: '3.5rem',
    fontWeight: '800',
    letterSpacing: '-0.05em',
    marginBottom: '1rem'
  },
  pageSubtitle: {
    fontSize: '1.125rem',
    color: 'var(--on-surface-variant)',
    lineHeight: '1.6'
  },
  topStatsRow: {
    display: 'flex',
    gap: '1rem'
  },
  topStatItem: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: '160px',
    backgroundColor: 'var(--surface-container-low)'
  },
  topStatLabel: {
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: 'var(--on-surface-variant)'
  },
  topStatValue: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--primary)'
  },
  bentoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem'
  },
  serviceCard: {
    padding: '2rem',
    transition: 'all 0.3s ease',
    backgroundColor: 'white'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem'
  },
  titleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem'
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '800'
  },
  activeBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: 'var(--tertiary-container)',
    color: 'var(--on-tertiary-container)',
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    borderRadius: '9999px'
  },
  moreBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--on-surface-variant)',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '50%'
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  staffRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  avatarCircle: {
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: '800'
  },
  servingBox: {
    padding: '1.5rem',
    borderRadius: '1rem',
    backgroundColor: 'var(--surface-container-lowest)',
    border: '1px solid var(--surface-container-low)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '112px'
  },
  servingInfo: {
    position: 'relative',
    zIndex: 2
  },
  servingTag: {
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.5rem'
  },
  servingValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem'
  },
  servingNum: {
    fontSize: '2.5rem',
    fontWeight: '900',
    letterSpacing: '-0.05em'
  },
  servingServiceType: {
    fontSize: '10px',
    fontWeight: '500',
    opacity: 0.6
  },
  servingDecor: {
    position: 'absolute',
    right: '-1rem',
    bottom: '-1rem',
    opacity: 0.08,
    zIndex: 1
  },
  queueFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.5rem',
    borderTop: '1px solid var(--surface-container-low)'
  },
  avatarMiniStack: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row-reverse'
  },
  avatarMini: {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '800',
    marginLeft: '-12px'
  },
  queueCountText: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: 'var(--on-surface-variant)'
  },
  offlineCard: {
    padding: '2rem',
    backgroundColor: 'var(--surface-container-low)',
    border: '2px dashed var(--outline-variant)',
    opacity: 0.9
  },
  offlineBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: 'rgba(0,0,0,0.05)',
    color: 'var(--on-surface-variant)',
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    borderRadius: '9999px'
  },
  offlineBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    textAlign: 'center',
    gap: '1rem'
  },
  offlineIconBox: {
    width: '4rem',
    height: '4rem',
    borderRadius: '50%',
    backgroundColor: 'var(--surface-container)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--on-surface-variant)'
  },
  offlineTitle: {
    fontWeight: '800',
    fontSize: '1.125rem'
  },
  offlineSub: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)'
  },
  reactivateBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: '800',
    fontSize: '0.875rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    marginTop: '0.5rem'
  },
  addDeskBtn: {
    backgroundColor: 'var(--surface-container-low)',
    border: '2px dashed rgba(0, 85, 215, 0.2)',
    borderRadius: '1.5rem',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  addIconCore: {
    width: '5rem',
    height: '5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 20px 40px rgba(0, 85, 215, 0.2)'
  },
  addTitle: {
    fontSize: '1.25rem',
    fontWeight: '800'
  },
  addSub: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)',
    marginTop: '0.25rem'
  },
  statusFooter: {
    marginTop: '4rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    backgroundColor: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(24px)',
    borderRadius: '1rem'
  },
  statusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem'
  },
  statusOnline: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
    color: 'var(--on-surface-variant)',
    letterSpacing: '0.1em'
  },
  greenDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981'
  },
  statusSync: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--on-surface-variant)'
  },
  statusActions: {
    display: 'flex',
    gap: '1.5rem'
  },
  statusActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: '800',
    fontSize: '10px',
    textTransform: 'uppercase',
    cursor: 'pointer'
  }
};

export default AdminServicesPage;
