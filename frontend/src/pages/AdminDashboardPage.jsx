import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopBar from '../components/AdminTopBar';
import { apiPath, adminHeaders } from '../config';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ total_today: 0, active_services: 0, avg_wait: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const fetchData = useCallback(async () => {
    try {
      const serviceParam = user?.serviceId ? `?serviceId=${user.serviceId}` : '';
      const [ticketsRes, servicesRes, statsRes] = await Promise.all([
        fetch(apiPath(`/tickets${serviceParam}`), { headers: adminHeaders(user) }),
        fetch(apiPath('/services'), { headers: adminHeaders(user) }),
        fetch(apiPath(`/stats${serviceParam}`), { headers: adminHeaders(user) })
      ]);
      
      if (ticketsRes.ok && servicesRes.ok && statsRes.ok) {
        setTickets(await ticketsRes.json());
        setServices(await servicesRes.json());
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      // no-op
    }
  }, [user]);

  const handleUpdateStatus = async (ticketId, status) => {
    try {
      const response = await fetch(apiPath(`/tickets/${ticketId}`), {
        method: 'PATCH',
        headers: adminHeaders(user),
        body: JSON.stringify({ status })
      });
      if (response.ok) fetchData();
    } catch (err) {
      console.error('Error updating ticket:', err);
    }
  };

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      void fetchData();
    }, 0);
    const interval = setInterval(() => {
      void fetchData();
    }, 10000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [fetchData]);

  useEffect(() => {
    const tick = setInterval(() => setNowTs(Date.now()), 60000);
    return () => clearInterval(tick);
  }, []);

  // Filtered tickets for the table
  const filteredTickets = tickets
    .filter(t => 
      (t.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(t.id).includes(searchQuery)
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const handleCallNextGlobal = async () => {
    const waitingTickets = tickets
      .filter(t => t.status === 'waiting')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    if (waitingTickets.length > 0) {
      try {
        const response = await fetch(apiPath('/tickets/call-next'), {
          method: 'POST',
          headers: adminHeaders(user),
          body: JSON.stringify({ serviceId: waitingTickets[0].service_id })
        });
        if (response.ok) {
          fetchData();
        }
      } catch (err) {
        console.error('Error calling next:', err);
      }
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'called':
        return (
          <span style={styles.badgeCalled}>
            <span style={styles.dotCalled}></span>
            Called
          </span>
        );
      case 'waiting':
        return (
          <span style={styles.badgeWaiting}>
            <span style={styles.dotWaiting}></span>
            Waiting
          </span>
        );
      case 'done':
        return (
          <span style={styles.badgeDone}>
            <span style={styles.dotDone}></span>
            Done
          </span>
        );
      default:
        return (
          <span style={styles.badgeDefault}>
            {status}
          </span>
        );
    }
  };

  return (
    <div style={styles.dashboardLayout}>
      
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <main className="admin-main-content" style={{
        ...styles.mainContent,
        marginLeft: window.innerWidth > 1024 ? '260px' : '0'
      }}>
        
        <AdminTopBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          placeholder="Search tickets..." 
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* Header */}
        <header style={styles.contentHeader}>
          <div>
            <h2 className="headline" style={styles.pageTitle}>
              {user?.serviceId ? services.find(s => s.id === user.serviceId)?.name : 'Queue Management'}
            </h2>
            <p style={styles.pageSubtitle}>Real-time control for your service flow.</p>
          </div>
          <button 
            className="primary-gradient" 
            style={styles.callNextBtn}
            onClick={handleCallNextGlobal}
          >
            <span className="material-symbols-outlined">notifications_active</span>
            Call Next Ticket
          </button>
        </header>

        {/* Stats Grid */}
        <section className="admin-stats-grid" style={styles.statsGrid}>
          <div className="glass-card" style={styles.statCard}>
            <div style={styles.statTop}>
              <div style={{ ...styles.statIconBox, backgroundColor: 'var(--primary-container)', color: 'var(--primary)' }}>
                <span className="material-symbols-outlined">person_add</span>
              </div>
              <span style={styles.statTrendUp}>+12%</span>
            </div>
            <div>
              <p style={styles.statLabel}>Total Clients (Today)</p>
              <h3 className="headline" style={styles.statValue}>{stats.total_today}</h3>
            </div>
          </div>

          <div className="glass-card" style={styles.statCard}>
            <div style={styles.statTop}>
              <div style={{ ...styles.statIconBox, backgroundColor: 'var(--secondary-container)', color: 'var(--secondary)' }}>
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <span style={styles.statTrendDown}>Live</span>
            </div>
            <div>
              <p style={styles.statLabel}>Avg. Wait Time</p>
              <h3 className="headline" style={styles.statValue}>
                {stats.avg_wait}<span style={styles.statUnit}>min</span>
              </h3>
            </div>
          </div>

          <div className="glass-card" style={styles.statCard}>
            <div style={styles.statTop}>
              <div style={{ ...styles.statIconBox, backgroundColor: 'var(--tertiary-container)', color: 'var(--tertiary)' }}>
                <span className="material-symbols-outlined">room_service</span>
              </div>
              <div style={styles.pulseBox}>
                <span style={styles.pulseDot}></span>
              </div>
            </div>
            <div>
              <p style={styles.statLabel}>Service Points Active</p>
              <h3 className="headline" style={styles.statValue}>
                {stats.active_services.toString().padStart(2, '0')}
                <span style={styles.statUnitTotal}>/ {services.length}</span>
              </h3>
            </div>
          </div>
        </section>

        {/* Active Queue Table */}
        <section style={styles.tableSection}>
          <div className="glass-card" style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h4 className="headline" style={styles.tableTitle}>Active Queue</h4>
              <div style={styles.tableActions}>
                <div style={styles.searchBox}>
                  <span className="material-symbols-outlined" style={styles.searchIcon}>search</span>
                  <input 
                    type="text" 
                    placeholder="Search ticket..." 
                    style={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button style={styles.filterBtn}>
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
              </div>
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableRowHead}>
                    <th style={styles.th}>Ticket ID</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Service Type</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Time in Queue</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map(ticket => {
                    const timeAgo = Math.floor((nowTs - new Date(ticket.created_at).getTime()) / 60000); // in minutes
                    
                    return (
                      <tr key={ticket.id} style={styles.tableRow}>
                        <td style={styles.tdId}>#T-{String(ticket.id).padStart(3, '0')}</td>
                        <td style={styles.td}>
                          <div style={styles.customerCell}>
                            <div style={styles.initialsAvatar}>
                              {(ticket.user_name || 'G').slice(0, 2).toUpperCase()}
                            </div>
                            <span style={styles.customerName}>{ticket.user_name || 'Guest'}</span>
                          </div>
                        </td>
                        <td style={styles.td}>{ticket.service_name || 'Unknown'}</td>
                        <td style={styles.td}>
                          {statusBadge(ticket.status)}
                        </td>
                        <td style={styles.tdTime}>{timeAgo.toString().padStart(2, '0')}:00</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            {ticket.status === 'waiting' && (
                              <button 
                                onClick={() => handleUpdateStatus(ticket.id, 'called')}
                                style={{ ...styles.actionBtn, backgroundColor: 'var(--primary)', color: 'white' }}
                              >
                                Call
                              </button>
                            )}
                            {ticket.status === 'called' && (
                              <button 
                                onClick={() => handleUpdateStatus(ticket.id, 'done')}
                                style={{ ...styles.actionBtn, backgroundColor: 'var(--tertiary)', color: 'white' }}
                              >
                                Finish
                              </button>
                            )}
                            <button 
                              onClick={() => handleUpdateStatus(ticket.id, 'cancelled')}
                              style={{ ...styles.actionBtn, backgroundColor: 'var(--error-container)', color: 'var(--error)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={styles.tableFooter}>
              <button style={styles.viewAllBtn}>View All Active Tickets</button>
            </div>
          </div>
        </section>
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
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4rem'
  },
  pageTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    letterSpacing: '-0.025em',
    marginBottom: '0.5rem'
  },
  pageSubtitle: {
    fontSize: '1.125rem',
    color: 'var(--on-surface-variant)',
    fontWeight: '500'
  },
  callNextBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 2rem',
    borderRadius: '9999px',
    color: 'white',
    fontWeight: '700',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 20px 40px rgba(0, 85, 215, 0.2)',
    transition: 'transform 0.2s'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
    marginBottom: '4rem'
  },
  statCard: {
    padding: '2rem',
    height: '190px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  statTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  statIconBox: {
    width: '3rem',
    height: '3rem',
    borderRadius: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: '800',
    lineHeight: '1'
  },
  statLabel: {
    fontSize: '0.625rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: 'var(--on-surface-variant)',
    marginBottom: '0.5rem'
  },
  statTrendUp: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--tertiary)',
    backgroundColor: 'var(--tertiary-container)',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px'
  },
  statTrendDown: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--error)',
    backgroundColor: 'rgba(172, 49, 73, 0.1)',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px'
  },
  statUnit: {
    fontSize: '1.25rem',
    fontWeight: '400',
    marginLeft: '0.25rem'
  },
  statUnitTotal: {
    fontSize: '1.25rem',
    fontWeight: '400',
    color: 'var(--on-surface-variant)',
    marginLeft: '0.25rem'
  },
  pulseBox: {
    display: 'flex',
    alignItems: 'center',
    height: '2rem'
  },
  pulseDot: {
    width: '0.5rem',
    height: '0.5rem',
    backgroundColor: 'var(--tertiary)',
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite'
  },
  tableSection: {
    backgroundColor: 'var(--surface-container-low)',
    padding: '0.5rem',
    borderRadius: '1.5rem'
  },
  tableCard: {
    padding: '2.5rem',
    backgroundColor: 'white',
    borderRadius: '1.25rem',
    boxShadow: 'none',
    border: 'none'
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  tableTitle: {
    fontSize: '1.5rem',
    fontWeight: '800'
  },
  tableActions: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--surface-container-low)',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    width: '240px'
  },
  searchIcon: {
    fontSize: '1rem',
    color: 'var(--outline)',
    marginRight: '0.5rem'
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.875rem',
    outline: 'none',
    flex: 1
  },
  filterBtn: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--on-surface-variant)',
    transition: 'background-color 0.2s'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  th: {
    fontSize: '0.625rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: 'var(--on-surface-variant)',
    padding: '0 1rem 1.5rem',
    borderBottom: '1px solid var(--surface-container-low)'
  },
  tableRowHead: {},
  tableRow: {
    borderBottom: '1px solid var(--surface-container-low)',
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '1.5rem 1rem',
    fontSize: '0.875rem'
  },
  tdId: {
    padding: '1.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '800',
    color: 'var(--primary)'
  },
  tdTime: {
    padding: '1.5rem 1rem',
    fontSize: '0.875rem',
    fontFamily: '"JetBrains Mono", monospace',
    color: 'var(--on-surface-variant)'
  },
  customerCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  initialsAvatar: {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-container)',
    color: 'var(--on-primary-container)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.625rem',
    fontWeight: '800'
  },
  customerName: {
    fontWeight: '600'
  },
  badgeCalled: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: 'var(--tertiary-container)',
    color: 'var(--on-tertiary-container)',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '800'
  },
  badgeWaiting: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: 'var(--secondary-container)',
    color: 'var(--on-secondary-container)',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '800'
  },
  badgeDone: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: 'var(--surface-container)',
    color: 'var(--on-surface-variant)',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '800'
  },
  dotCalled: { width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: 'var(--tertiary)' },
  dotWaiting: { width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: 'var(--secondary)' },
  dotDone: { width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: 'var(--outline)' },
  moreBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--on-surface-variant)',
    cursor: 'pointer'
  },
  tableFooter: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '2rem'
  },
  viewAllBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: '800',
    fontSize: '0.875rem',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  actionBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  }
};

export default AdminDashboardPage;
