import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopBar from '../components/AdminTopBar';
import { apiPath } from '../config';

const AdminServicesPage = () => {
  const { user, authFetch } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [servicePoints, setServicePoints] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ avg_wait: 0 });

  const fetchData = useCallback(async () => {
    if (!user?.serviceId) return;
    try {
      const [spRes, ticketsRes, statsRes] = await Promise.all([
        authFetch(apiPath(`/service-points?serviceId=${user.serviceId}`)),
        authFetch(apiPath(`/tickets?serviceId=${user.serviceId}`)),
        authFetch(apiPath(`/stats?serviceId=${user.serviceId}`))
      ]);
      if (spRes.ok && ticketsRes.ok && statsRes.ok) {
        setServicePoints(await spRes.json());
        setTickets(await ticketsRes.json());
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Error fetching service points:', err);
    }
  }, [user, authFetch]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleToggleDesk = async (service) => {
    const newStatus = service.status === 'active' ? 'offline' : 'active';
    try {
      const res = await authFetch(apiPath(`/service-points/${service.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error toggling desk:', err);
    }
  };

  const handleAddDesk = async () => {
    const name = prompt("Enter desk name (e.g., Counter 4):");
    const staff = prompt("Enter staff name:");
    if (!name || !staff) return;

    try {
      const res = await authFetch(apiPath('/service-points'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: user.serviceId, name, staffName: staff })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error adding desk:', err);
    }
  };

  const activeDesks = servicePoints.filter(s => s.status === 'active').length;
  const totalDesks = servicePoints.length;

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

        <header style={styles.sectionHeader}>
          <div>
            <h1 className="headline" style={styles.pageTitle}>Service Operations</h1>
            <p style={styles.pageSubtitle}>Monitor and manage active service counters and staff allocation.</p>
          </div>
          <div style={styles.topStatsRow}>
            <div className="glass-card" style={styles.topStatItem}>
              <span style={styles.topStatLabel}>Active Desks</span>
              <span style={styles.topStatValue}>{activeDesks}/{totalDesks}</span>
            </div>
            <div className="glass-card" style={styles.topStatItem}>
              <span style={styles.topStatLabel}>Live Avg Wait</span>
              <span style={{ ...styles.topStatValue, color: 'var(--tertiary)' }}>{stats.avg_wait}m</span>
            </div>
          </div>
        </header>

        <div style={styles.bentoGrid}>
          {servicePoints.map(service => {
            const currentTicket = tickets.find(t => t.service_point_id === service.id && t.status === 'called');
            const queueDepth = tickets.filter(t => t.service_id === service.service_id && t.status === 'waiting').length;
            const isOffline = service.status === 'maintenance' || service.status === 'offline';

            return (
              <div key={service.id} className="glass-card" style={isOffline ? styles.offlineCard : styles.serviceCard}>
                <div style={styles.cardHeader}>
                  <div style={styles.titleWrap}>
                    <span className="material-symbols-outlined" style={{ color: isOffline ? 'var(--outline)' : 'var(--primary)' }}>
                      {isOffline ? 'cloud_off' : 'desktop_windows'}
                    </span>
                    <h3 className="headline" style={styles.cardTitle}>{service.name}</h3>
                  </div>
                  <button style={styles.statusToggle} onClick={() => handleToggleDesk(service)}>
                    {isOffline ? 'Activate' : 'Deactivate'}
                  </button>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.staffRow}>
                    <div style={{ ...styles.avatarCircle, backgroundColor: isOffline ? 'var(--surface-container-high)' : 'var(--primary-container)' }}>
                      {(service.staff_name || 'U').charAt(0)}
                    </div>
                    <div>
                      <p style={styles.staffTag}>Staff</p>
                      <p style={styles.staffName}>{service.staff_name || 'Unassigned'}</p>
                    </div>
                  </div>

                  {!isOffline && (
                    <div style={styles.servingBox}>
                      <p style={styles.servingTag}>Now Serving</p>
                      <h3 className="headline" style={styles.servingNum}>
                        {currentTicket ? `#T-${String(currentTicket.id).padStart(3, '0')}` : '--'}
                      </h3>
                    </div>
                  )}

                  <div style={styles.queueFooter}>
                    <p style={styles.queueCountText}>{queueDepth} in general queue</p>
                  </div>
                </div>
              </div>
            );
          })}

          <button style={styles.addDeskBtn} onClick={handleAddDesk}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--primary)' }}>add_circle</span>
            <p style={{ fontWeight: '700' }}>Add New Counter</p>
          </button>
        </div>
      </main>
    </div>
  );
};

const styles = {
  dashboardLayout: { display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--on-surface)' },
  mainContent: { flex: 1, marginLeft: '260px', padding: '0 6rem 4rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', marginTop: '2rem' },
  pageTitle: { fontSize: '2.5rem', fontWeight: '800' },
  pageSubtitle: { fontSize: '1rem', color: 'var(--on-surface-variant)' },
  topStatsRow: { display: 'flex', gap: '1rem' },
  topStatItem: { padding: '1.5rem', minWidth: '160px' },
  topStatLabel: { fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--on-surface-variant)' },
  topStatValue: { fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' },
  bentoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' },
  serviceCard: { padding: '2rem', backgroundColor: 'white' },
  offlineCard: { padding: '2rem', backgroundColor: 'var(--surface-container-low)', opacity: 0.8, border: '2px dashed var(--outline-variant)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' },
  titleWrap: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  cardTitle: { fontSize: '1.25rem', fontWeight: '800' },
  statusToggle: { padding: '0.4rem 1rem', borderRadius: '9999px', border: '1px solid var(--outline-variant)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' },
  cardBody: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  staffRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
  avatarCircle: { width: '3rem', height: '3rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' },
  staffTag: { fontSize: '10px', color: 'var(--on-surface-variant)', fontWeight: '800' },
  staffName: { fontSize: '1rem', fontWeight: '700' },
  servingBox: { padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'var(--surface-container-low)', textAlign: 'center' },
  servingTag: { fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' },
  servingNum: { fontSize: '2rem', fontWeight: '900' },
  queueFooter: { paddingTop: '1rem', borderTop: '1px solid var(--surface-container-high)' },
  queueCountText: { fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: '600' },
  addDeskBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', border: '2px dashed var(--primary)', borderRadius: '1.5rem', backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s' }
};

export default AdminServicesPage;
