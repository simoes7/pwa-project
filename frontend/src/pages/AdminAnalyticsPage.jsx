import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopBar from '../components/AdminTopBar';

// Scoped styles for analytics chart
const analyticsStyles = `
  .analytics-bar {
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .analytics-tooltip {
    position: absolute !important;
    bottom: 100% !important;
    left: 50% !important;
    transform: translate(-50%, -4px) !important;
    background: #1e293b !important;
    color: white !important;
    padding: 4px 8px !important;
    border-radius: 6px !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    white-space: nowrap !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
    z-index: 100 !important;
  }
  .analytics-bar:hover .analytics-tooltip {
    opacity: 1 !important;
    visibility: visible !important;
    transform: translate(-50%, -10px) !important;
  }
  .analytics-bar:hover {
    filter: brightness(1.1);
    transform: scaleX(1.1);
    z-index: 10;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('analytics-styles')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'analytics-styles';
  styleTag.innerHTML = analyticsStyles;
  document.head.appendChild(styleTag);
}

const AdminAnalyticsPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [range, setRange] = useState('24h');
  const [services, setServices] = useState([]);
  const [data, setData] = useState({
    hourly: [],
    metrics: { total_throughput: 0, avg_duration: 0, total_feedback: 0, avg_rating: 0 }
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const serviceParam = user?.serviceId ? `&serviceId=${user.serviceId}` : '';
      const [analyticsRes, servicesRes] = await Promise.all([
        fetch(`http://localhost:3001/analytics?range=${range}${serviceParam}`),
        fetch(`http://localhost:3001/services`)
      ]);
      
      if (analyticsRes.ok && servicesRes.ok) {
        setData(await analyticsRes.json());
        setServices(await servicesRes.json());
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range, user?.serviceId]);

  const handleExport = () => {
    const csvRows = [
      ['Hour', 'Ticket Count'],
      ...data.hourly.map(h => [h.hour, h.count]),
      [],
      ['Metric', 'Value'],
      ['Total Throughput', data.metrics.total_throughput],
      ['Avg Duration (min)', data.metrics.avg_duration],
      ['Avg Rating', data.metrics.avg_rating]
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_report_${range}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  // Prepare chart data (24 hours)
  const chartBars = Array(24).fill(0);
  data.hourly.forEach(h => {
    if (h.hour >= 0 && h.hour < 24) chartBars[h.hour] = h.count;
  });
  const maxVal = Math.max(...chartBars, 5); // at least 5 for scale
  const currentWaiting = data.metrics.current_waiting || 0;

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
          placeholder="Search analytics..." 
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* Dashboard Header */}
        <div style={styles.headerRow}>
          <div>
            <span style={styles.systemTag}>System Overview</span>
            <h2 className="headline" style={styles.pageTitle}>Queue Intelligence</h2>
          </div>
          <div style={styles.headerActions}>
            <select 
              value={range} 
              onChange={(e) => setRange(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button 
              className="primary-gradient" 
              style={styles.exportBtn}
              onClick={handleExport}
            >
              <span className="material-symbols-outlined">download</span>
              Export Report
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <section style={styles.metricsGrid}>
          <div className="glass-card" style={styles.metricCard}>
            <div style={styles.metricDecor} />
            <p style={styles.metricLabel}>Total Throughput</p>
            <h3 className="headline" style={styles.metricValue}>{data.metrics.total_throughput}</h3>
            <div style={{ ...styles.metricTrend, color: 'var(--tertiary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
              <span>Across selected range</span>
            </div>
          </div>

          <div className="glass-card" style={styles.metricCard}>
            <div style={{ ...styles.metricDecor, opacity: 0.1, backgroundColor: 'var(--secondary)' }} />
            <p style={styles.metricLabel}>Avg. Service Duration</p>
            <h3 className="headline" style={styles.metricValue}>{data.metrics.avg_duration}m</h3>
            <div style={{ ...styles.metricTrend, color: 'var(--primary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>timer</span>
              <span>Average processing time</span>
            </div>
          </div>

          <div className="glass-card" style={styles.metricCard}>
             <div style={{ ...styles.metricDecor, opacity: 0.1, backgroundColor: 'var(--tertiary)' }} />
            <p style={styles.metricLabel}>Current Waiting</p>
            <h3 className="headline" style={styles.metricValue}>
              {currentWaiting} <span style={styles.metricUnit}>pax</span>
            </h3>
            <div style={styles.avatarGroup}>
              <div style={styles.avatarMiniStack}>
                 {[1,2,3].map(i => (
                   <img 
                    key={i}
                    src={`https://i.pravatar.cc/100?img=${i+10}`} 
                    style={{ ...styles.avatarMini, marginLeft: i === 1 ? 0 : -8 }} 
                    alt="user"
                   />
                 ))}
                 <div style={styles.avatarMore}>+39</div>
              </div>
              <span style={styles.avatarSub}>In active queue</span>
            </div>
          </div>

          <div className="gradient-card" style={{ ...styles.metricCard, background: 'linear-gradient(to bottom right, var(--primary), var(--secondary))', color: 'white' }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', ...styles.metricLabel }}>Customer Satisfaction</p>
            <h3 className="headline" style={styles.metricValue}>{data.metrics.avg_rating || '5.0'}<span style={{ opacity: 0.7, fontSize: '0.875rem' }}>/5.0</span></h3>
            <div style={styles.starsRow}>
              {[1,2,3,4,5].map(i => (
                <span key={i} className="material-symbols-outlined" style={{ fontSize: '16px', opacity: i <= Math.round(data.metrics.avg_rating || 5) ? 1 : 0.3 }}>star</span>
              ))}
            </div>
          </div>
        </section>

        {/* Charts Bento Grid */}
        <section style={styles.chartsGrid}>
          {/* Wait Time Trends */}
          <div className="glass-card" style={styles.largeChartCard}>
            <div style={styles.chartHeader}>
              <div>
                <h4 className="headline" style={styles.chartTitle}>Wait Time Trends</h4>
                <p style={styles.chartSubtitle}>Real-time fluctuations in queue duration</p>
              </div>
              <div style={styles.chartLegend}>
                <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: 'var(--primary)' }}></span>In-Person</div>
                <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: 'var(--secondary)' }}></span>Digital</div>
              </div>
            </div>
            
            <div style={styles.simulatedChart}>
              {chartBars.map((val, i) => (
                <div key={i} style={styles.chartBarGroup}>
                  <div 
                    className="analytics-bar"
                    style={{ 
                      ...styles.chartBar, 
                      height: `${Math.max((val / maxVal) * 100, 2)}%`,
                      backgroundColor: val > 0 ? 'var(--primary)' : 'var(--surface-container-high)'
                    }}
                  >
                     <div className="analytics-tooltip">{val} tickets</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.chartTimeline}>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
            </div>
          </div>

          {/* Peak Hours */}
          <div className="glass-card" style={styles.compactChartCard}>
            <h4 className="headline" style={styles.chartTitle}>Service Peak Hours</h4>
            <div style={styles.peakRows}>
              {[
                { time: '12:00 PM - 02:00 PM', cap: 88, color: 'var(--primary)' },
                { time: '09:00 AM - 11:00 AM', cap: 64, color: 'var(--primary)' },
                { time: '04:00 PM - 06:00 PM', cap: 42, color: 'var(--primary)' }
              ].map((row, i) => (
                <div key={i} style={styles.peakRow}>
                   <div style={styles.peakInfo}>
                     <span>{row.time}</span>
                     <span style={{ color: row.color }}>{row.cap}% Capacity</span>
                   </div>
                   <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${row.cap}%`, background: `linear-gradient(to right, var(--primary), var(--secondary))` }}></div>
                   </div>
                </div>
              ))}
            </div>

            <div style={styles.aiBox}>
              <p style={styles.aiTag}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lightbulb</span>
                AI Recommendation
              </p>
              <p style={styles.aiText}>
                Increase staffing at <strong>Service Point B</strong> by 20% between 12:30 PM and 1:30 PM to maintain current wait times.
              </p>
            </div>
          </div>
        </section>

        {/* Sentiment Deep Dive */}
        <section style={styles.sentimentSection}>
           <div className="glass-card" style={styles.sentimentCard}>
              <div style={styles.tableHeader}>
                <h4 className="headline" style={styles.chartTitle}>Customer Sentiment Deep Dive</h4>
                <button style={styles.viewMoreBtn}>View All Feedback</button>
              </div>
              <div style={styles.sentimentGrid}>
                {[
                  { label: 'Promoters', val: '72%', icon: 'sentiment_very_satisfied', color: 'var(--tertiary-container)', onColor: 'var(--on-tertiary-container)' },
                  { label: 'Passive', val: '18%', icon: 'sentiment_neutral', color: 'var(--surface-container-highest)', onColor: 'var(--on-surface-variant)' },
                  { label: 'Detractors', val: '10%', icon: 'sentiment_very_dissatisfied', color: 'rgba(172, 49, 73, 0.1)', onColor: 'var(--error)' }
                ].map((s, i) => (
                  <div key={i} style={styles.sentimentStat}>
                    <div style={{ ...styles.sentimentIconBox, backgroundColor: s.color, color: s.onColor }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{s.icon}</span>
                    </div>
                    <div>
                      <p className="headline" style={styles.sentimentVal}>{s.val}</p>
                      <p style={styles.sentimentLabel}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* Efficiency Table */}
        <section style={styles.efficiencySection}>
           <h4 className="headline" style={styles.sectionTitle}>Service Point Efficiency</h4>
           <div className="glass-card" style={styles.effTableCard}>
              <table style={styles.effTable}>
                <thead>
                  <tr style={styles.tableRowHead}>
                    <th style={styles.th}>Service Point</th>
                    <th style={styles.th}>Active Agent</th>
                    <th style={styles.th}>Throughput</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { point: 'Main Lobby Counter 01', agent: 'Sarah Jenkins', th: '124 Served', status: 'Optimal', statusColor: 'var(--tertiary-container)', statusText: 'var(--on-tertiary-container)', trend: 'trending_up', trendColor: 'var(--tertiary)' },
                    { point: 'Express Service A', agent: 'David Chen', th: '215 Served', status: 'Busy', statusColor: 'var(--secondary-container)', statusText: 'var(--on-secondary-container)', trend: 'trending_flat', trendColor: 'var(--primary)' },
                    { point: 'Premium Lounge 04', agent: 'Elena Rodriguez', th: '42 Served', status: 'Offline', statusColor: 'var(--surface-container-highest)', statusText: 'var(--on-surface-variant)', trend: 'remove', trendColor: 'var(--outline)' }
                  ].map((row, i) => (
                    <tr key={i} style={styles.tableRow}>
                      <td style={styles.tdPoint}>{row.point}</td>
                      <td style={styles.td}>{row.agent}</td>
                      <td style={styles.td}>{row.th}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusPill, backgroundColor: row.statusColor, color: row.statusText }}>{row.status}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <span className="material-symbols-outlined" style={{ color: row.trendColor }}>{row.trend}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '3rem'
  },
  systemTag: {
    fontSize: '0.75rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: 'var(--primary)',
    display: 'block',
    marginBottom: '0.5rem'
  },
  pageTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    letterSpacing: '-0.05em'
  },
  headerActions: {
    display: 'flex',
    gap: '1rem'
  },
  filterSelect: {
    padding: '0.75rem 1.5rem',
    borderRadius: '9999px',
    backgroundColor: 'var(--surface-container-highest)',
    color: 'var(--on-primary-container)',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '700',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none'
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '9999px',
    color: 'white',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(0, 85, 215, 0.2)'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  metricCard: {
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden'
  },
  metricDecor: {
    position: 'absolute',
    top: '-1rem',
    right: '-1rem',
    width: '5rem',
    height: '5rem',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    opacity: 0.05,
    filter: 'blur(20px)'
  },
  metricLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--on-surface-variant)',
    marginBottom: '0.5rem'
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: '800',
    marginBottom: '1rem'
  },
  metricTrend: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: '800'
  },
  metricUnit: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--on-surface-variant)'
  },
  avatarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  avatarMiniStack: {
    display: 'flex',
    alignItems: 'center'
  },
  avatarMini: {
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '50%',
    border: '2px solid white'
  },
  avatarMore: {
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '50%',
    backgroundColor: 'var(--surface-container-low)',
    border: '2px solid white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    fontWeight: '800',
    marginLeft: '-8px'
  },
  avatarSub: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--on-surface-variant)'
  },
  starsRow: {
    display: 'flex',
    gap: '2px'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '2rem',
    marginBottom: '3rem'
  },
  largeChartCard: {
    gridColumn: 'span 8',
    padding: '2rem'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2.5rem'
  },
  chartTitle: {
    fontSize: '1.125rem',
    fontWeight: '800'
  },
  chartSubtitle: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)'
  },
  chartLegend: {
    display: 'flex',
    gap: '1rem'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '11px',
    fontWeight: '700',
    padding: '0.25rem 0.75rem',
    backgroundColor: 'white',
    borderRadius: '8px'
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  simulatedChart: {
    height: '240px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.5rem',
    padding: '0 1rem',
    borderBottom: '1px solid var(--surface-container-low)',
    paddingBottom: '0.5rem'
  },
  chartBar: {
    width: '100%',
    minHeight: '4px',
    borderRadius: '4px 4px 0 0',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative'
  },
  chartBarGroup: {
    flex: 1,
    height: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    position: 'relative'
  },
  chartTimeline: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1.25rem 0.5rem 0',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.1em',
    color: 'var(--on-surface-variant)',
    textTransform: 'uppercase'
  },
  compactChartCard: {
    gridColumn: 'span 4',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column'
  },
  peakRows: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    flex: 1
  },
  peakRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  peakInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: '800'
  },
  progressTrack: {
    height: '8px',
    width: '100%',
    backgroundColor: 'var(--surface-container-low)',
    borderRadius: '9999px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: '9999px',
    boxShadow: '0 0 8px rgba(0, 85, 215, 0.2)'
  },
  aiBox: {
    marginTop: '2rem',
    backgroundColor: 'var(--secondary-container)',
    padding: '1rem',
    borderRadius: '1rem'
  },
  aiTag: {
    fontSize: '11px',
    fontWeight: '800',
    color: 'var(--on-secondary-container)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  },
  aiText: {
    fontSize: '11px',
    lineHeight: '1.6',
    color: 'var(--on-secondary-container)',
    opacity: 0.8
  },
  sentimentSection: {
    marginBottom: '3rem'
  },
  sentimentCard: {
    padding: '2rem'
  },
  viewMoreBtn: {
    fontSize: '13px',
    fontWeight: '800',
    color: 'var(--primary)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  sentimentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
    marginTop: '2rem'
  },
  sentimentStat: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  sentimentIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sentimentVal: {
    fontSize: '1.5rem',
    fontWeight: '800'
  },
  sentimentLabel: {
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--on-surface-variant)'
  },
  efficiencySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '800'
  },
  effTableCard: {
    padding: '0',
    overflow: 'hidden'
  },
  effTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: 'var(--on-surface-variant)',
    padding: '1.25rem 2rem',
    borderBottom: '1px solid var(--surface-container-high)',
    textAlign: 'left'
  },
  tableRow: {
    borderBottom: '1px solid var(--surface-container-low)',
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '1rem 2rem',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  tdPoint: {
    padding: '1rem 2rem',
    fontSize: '0.875rem',
    fontWeight: '800'
  },
  statusPill: {
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  }
};

export default AdminAnalyticsPage;
