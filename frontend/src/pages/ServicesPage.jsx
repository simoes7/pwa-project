import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { useAlert } from '../context/AlertContext';
import { apiPath } from '../config';

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

const ServicesPage = () => {
  const { user } = useAuth();
  const { queueError } = useQueue();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All Services');
  const width = useWindowWidth();
  const isMobile = width <= 1024;
  const isSmallMobile = width <= 640;

  const [dbServices, setDbServices] = useState([]);
  const [activeTickets, setActiveTickets] = useState([]);

  const fetchActiveTickets = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(apiPath(`/tickets/user/${user.id}`));
      if (response.ok) {
        const data = await response.json();
        setActiveTickets(data);
      }
    } catch (err) {
      console.error("Error fetching active tickets:", err);
    }
  }, [user]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(apiPath('/services'));
        if (response.ok) {
          const data = await response.json();
          setDbServices(data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    const initialTimer = setTimeout(() => {
      void fetchServices();
      void fetchActiveTickets();
    }, 0);
    return () => clearTimeout(initialTimer);
  }, [user, fetchActiveTickets]);

  const handleTakeTicket = async (serviceId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(apiPath('/tickets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, serviceId })
      });

      if (response.ok) {
        navigate('/ticket');
      } else {
        const errData = await response.json();
        showAlert(errData.error || 'Failed to take ticket. Please try again.', 'Error', 'error');
      }
    } catch (error) {
      console.error('Error taking ticket:', error);
      showAlert('Network error. Please check your connection.', 'Connection Error', 'error');
    }
  };

  const hasActiveTicket = (serviceId) => {
    return activeTickets.some(t => t.service_id === serviceId);
  };

  const uniqueCategories = ['All Services', ...new Set(dbServices.map(s => s.category))];

  return (
    <div className="page-container" style={isMobile ? { paddingBottom: '6rem', minHeight: '100vh' } : {}}>

      {/* Hero Section */}
      <header style={{
        ...styles.heroHeader,
        marginBottom: isMobile ? '3rem' : '5rem'
      }}>
        <h1 className="headline" style={{
          ...styles.heroTitle,
          fontSize: isSmallMobile ? '2.5rem' : isMobile ? '3.5rem' : '4.5rem'
        }}>
          Available <span className="text-gradient">Services</span>
        </h1>
        <p style={{
          ...styles.heroSubtitle,
          fontSize: isSmallMobile ? '1rem' : '1.25rem'
        }}>
          Experience seamless transitions. Skip the wait by booking your slot at any of our partner service points with real-time tracking.
        </p>
      </header>

      {/* Service Categories Filter */}
      <div style={styles.filterBar}>
        {uniqueCategories.map(f => (
          <button
            key={f}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {queueError && (
        <div style={styles.errorBanner}>{queueError}</div>
      )}

      {/* Services Grid - Bento Style */}
      <div className="services-grid">

        {dbServices
          .filter(s => filter === 'All Services' || s.category === filter)
          .map((service, index) => {
            const inQueue = service.people_waiting || 0;
            const waitTime = inQueue * service.estimated_wait_time + service.estimated_wait_time;

            return (
              <div key={service.id} className="bg-blue-50/50 dark:bg-slate-900/50 p-6 rounded-[2rem] flex flex-col justify-between min-h-[300px] transition-all hover:-translate-y-1 hover:shadow-xl group border border-blue-100 dark:border-slate-800 relative overflow-hidden" style={{ backgroundColor: service.color_theme ? `${service.color_theme}10` : '', gridColumn: isMobile ? 'span 12' : 'span 4' }}>
                {service.cover_image_url && (
                  <div className="absolute top-0 left-0 right-0 h-28 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${service.cover_image_url})` }}></div>
                )}
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-5">
                    {service.logo_url ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100 flex items-center justify-center p-1">
                        <img src={service.logo_url} alt={service.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: service.color_theme || 'var(--primary)' }}>
                        <span className="material-symbols-outlined text-3xl">{service.icon || 'hub'}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {service.is_fast_track_available && (
                        <div className="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">bolt</span>
                          Fast
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight mb-1">
                      {service.name}
                      <span className="material-symbols-outlined text-[1.1rem] text-slate-400">location_on</span>
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">{service.category || 'Service Hub'}</p>
                    
                    <div className="text-slate-600 dark:text-slate-300 text-sm mb-6 line-clamp-3">
                      {service.description || 'Visit our center for operational services.'}
                    </div>
                  </div>

                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 mb-4 backdrop-blur-sm border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Wait Time</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{waitTime} mins</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${Math.min(100, (inQueue / 10) * 100)}%` }}></div>
                    </div>
                    <div className="mt-2 text-[10px] text-right font-medium text-slate-400 uppercase tracking-wider">
                      {inQueue} people in queue
                    </div>
                  </div>

                  <button
                    className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${(service.is_open && !hasActiveTicket(service.id)) ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                    onClick={() => service.is_open && !hasActiveTicket(service.id) && handleTakeTicket(service.id)}
                    disabled={hasActiveTicket(service.id) || !service.is_open}
                  >
                    {!service.is_open ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">block</span>
                        Closed
                      </>
                    ) : hasActiveTicket(service.id) ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Ticket Active
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                        Join Queue
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

        {/* Custom Card */}
        <div className="glass-card" style={{
          ...styles.wideCard,
          gridColumn: isMobile ? 'span 12' : 'span 8',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <div style={styles.wideContent}>
            <h3 className="headline" style={styles.cardTitleLarge}>Can't find your service?</h3>
            <p style={{ ...styles.cardDescSmall, fontSize: '1.1rem', marginBottom: '2.5rem' }}>
              Our help desk is available for custom inquiries and guided support for first-time users.
            </p>
            <div style={styles.wideLinks}>
              <a href="#" style={{ ...styles.wideLink, color: 'var(--primary)' }}>
                Support Center <span className="material-symbols-outlined">arrow_forward</span>
              </a>
              <a href="#" style={{ ...styles.wideLink, color: 'var(--secondary)' }}>
                Find on Map <span className="material-symbols-outlined">map</span>
              </a>
            </div>
          </div>
          {!isMobile && (
            <div style={styles.wideGraphic}>
              <span className="material-symbols-outlined" style={{ fontSize: '6rem', color: 'var(--outline-variant)', opacity: 0.5 }}>help_center</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

const styles = {
  heroHeader: {
    marginBottom: '5rem',
    maxWidth: '800px'
  },
  heroTitle: {
    fontSize: '4.5rem',
    fontWeight: '800',
    color: 'var(--on-surface)',
    letterSpacing: '-0.04em',
    lineHeight: '1.1',
    marginBottom: '1.5rem'
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: 'var(--on-surface-variant)',
    fontWeight: '400',
    lineHeight: '1.8'
  },
  filterBar: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '3rem',
    flexWrap: 'wrap'
  },
  filterBtn: {
    padding: '0.75rem 2rem',
    borderRadius: '9999px',
    fontWeight: '600',
    color: 'var(--on-surface-variant)',
    backgroundColor: 'var(--surface-container-low)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },
  filterBtnActive: {
    backgroundColor: 'var(--surface-container-highest)',
    color: 'var(--on-primary-container)'
  },
  errorBanner: {
    padding: '1rem 1.5rem',
    backgroundColor: 'var(--error-container)',
    color: 'var(--on-error-container)',
    borderRadius: '1rem',
    marginBottom: '2rem',
    fontWeight: '700',
    boxShadow: '0 4px 12px rgba(172, 49, 73, 0.1)'
  },
  largeCard: {
    gridColumn: 'span 8',
    padding: '3rem',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  smallCard: {
    gridColumn: 'span 4',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column'
  },
  wideCard: {
    gridColumn: 'span 8',
    display: 'flex',
    overflow: 'hidden'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    position: 'relative',
    zIndex: 2
  },
  iconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badge: {
    backgroundColor: 'var(--secondary-container)',
    color: 'var(--on-secondary-container)',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.05em'
  },
  closedBadge: {
    backgroundColor: 'rgba(172, 49, 73, 0.1)',
    color: 'var(--error)',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.05em',
    border: '1px solid rgba(172, 49, 73, 0.2)'
  },
  disabledAction: {
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  cardBody: {
    position: 'relative',
    zIndex: 2,
    flex: 1
  },
  cardTitleLarge: {
    fontSize: '2.5rem',
    color: 'var(--on-surface)',
    marginBottom: '1rem'
  },
  cardDescLarge: {
    fontSize: '1.125rem',
    color: 'var(--on-surface-variant)',
    maxWidth: '450px',
    marginBottom: '2rem'
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    marginBottom: '2.5rem'
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column'
  },
  statDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: 'var(--outline-variant)',
    opacity: 0.3
  },
  statLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: '800',
    color: 'var(--outline)',
    marginBottom: '0.5rem'
  },
  statValBox: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem'
  },
  statVal: {
    fontSize: '2.5rem',
    fontWeight: '900',
    color: 'var(--on-surface)'
  },
  statUnit: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)',
    textTransform: 'uppercase'
  },
  actionRow: {
    display: 'flex',
    gap: '1rem',
    position: 'relative',
    zIndex: 2
  },
  primaryAction: {
    padding: '1rem 2.5rem',
    borderRadius: '1rem',
    color: 'white',
    fontWeight: '800',
    boxShadow: 'var(--ambient-shadow)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer'
  },
  secondaryAction: {
    padding: '1rem 2rem',
    borderRadius: '1rem',
    backgroundColor: 'var(--surface-container-low)',
    color: 'var(--on-surface-variant)',
    fontWeight: '700',
    cursor: 'pointer'
  },
  darkAction: {
    backgroundColor: 'var(--on-surface)',
    color: 'var(--surface)',
    padding: '1rem',
    borderRadius: '1rem',
    fontWeight: '800',
    marginTop: 'auto',
    cursor: 'pointer'
  },
  lightAction: {
    backgroundColor: 'var(--surface-container-high)',
    color: 'var(--on-surface)',
    padding: '1rem',
    borderRadius: '1rem',
    fontWeight: '800',
    marginTop: 'auto',
    cursor: 'pointer'
  },
  decorativeImage: {
    position: 'absolute',
    right: '-10%',
    bottom: '-10%',
    width: '320px',
    height: '320px',
    borderRadius: '50%',
    backgroundSize: 'cover',
    backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBGhifQChE8RQRnm--xiFEFUUVBFUv2PZMvI_uBS8whohjDu8IJ8wtwl_eTuHKQrIcjl17Z6zeJO8z29WqUI4cJZwJbt1EbVMLVQtZKnFDUHr3ZmFJp2ZoMLEXSL7nMwIsbCYU5u3NQAn072UNHqCS2EO78YhFSwjHXC8uk00lNawZYE9D35LEcxHuKdNSevELqz_zE5SxqH07Cx_MLdmfAOvlY3WCsYspMfNRztMdqNhtjLpw2YVFcvns6Q5DYZfXUFZj_iVajFLl1")',
    opacity: 0.1,
    zIndex: 1
  },
  cardTitleSmall: {
    fontSize: '1.5rem',
    color: 'var(--on-surface)',
    marginBottom: '0.5rem'
  },
  cardDescSmall: {
    color: 'var(--on-surface-variant)',
    lineHeight: '1.6',
    marginBottom: '1.5rem'
  },
  waitInfo: {
    marginBottom: '2rem'
  },
  waitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    marginBottom: '0.5rem'
  },
  progressTrack: {
    height: '8px',
    backgroundColor: 'var(--surface-container-high)',
    borderRadius: '9999px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'var(--primary-gradient)',
    borderRadius: '9999px'
  },
  statusBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '800',
    color: 'var(--on-surface-variant)',
    marginBottom: '1rem'
  },
  wideContent: {
    flex: 1,
    padding: '2.5rem'
  },
  wideLinks: {
    display: 'flex',
    gap: '2rem'
  },
  wideLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontWeight: '800',
    textDecoration: 'none'
  },
  wideGraphic: {
    width: '30%',
    backgroundColor: 'var(--surface-container-high)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCQxfX_0e604EaJDC6t2lXpijhbkfe-7XbMKwQEVWj3MtX8vxU-bX31w2KM7pK8ijHdTz0e38vSmOliHWOKuaqbMdc8AJICpWMGbqCMBhLCeMJYp12guuH_uekyAPGhz9h2obQYyKNwJFL6C8Ia61zD7vgeNG2io29z9iymh1LQRt0IRB-X32qc7Dn1LaUGZz3HkalZ_WSec3HDpE8ENaVwhUCmprQoAFRidWzZme_7rT5VTSxp78x4RfrH6kxfz6GrSpLgbCzK5aoA")',
    backgroundSize: 'cover',
    backgroundBlendMode: 'multiply'
  },
  bottomNav: {
    display: 'flex',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '5rem',
    borderTop: '1px solid var(--surface-container-low)',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRadius: '0'
  },
  navItemInactive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    color: '#64748b',
    textDecoration: 'none'
  },
  navItemActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    color: 'var(--primary)',
    textDecoration: 'none'
  },
  navText: {
    fontSize: '0.625rem',
    fontWeight: '800',
    textTransform: 'uppercase'
  }
};

export default ServicesPage;
