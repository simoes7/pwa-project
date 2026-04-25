import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';

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
  const { queueError, setQueueError } = useQueue();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All Services');
  const width = useWindowWidth();
  const isMobile = width <= 1024;
  const isSmallMobile = width <= 640;

  const [dbServices, setDbServices] = useState([]);
  const [activeTickets, setActiveTickets] = useState([]);
  const [isTakingTicket, setIsTakingTicket] = useState(false);

  const fetchActiveTickets = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:3001/tickets/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setActiveTickets(data);
      }
    } catch (err) {
      console.error("Error fetching active tickets:", err);
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('http://localhost:3001/services');
        if (response.ok) {
          const data = await response.json();
          setDbServices(data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
    fetchActiveTickets();
  }, [user]);

  const handleTakeTicket = async (serviceId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setIsTakingTicket(true);
    try {
      const response = await fetch('http://localhost:3001/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, serviceId })
      });
      
      if (response.ok) {
        navigate('/ticket');
      } else {
        alert("Failed to take ticket. Please try again.");
      }
    } catch (error) {
      console.error("Error taking ticket:", error);
    } finally {
      setIsTakingTicket(false);
    }
  };

  const hasActiveTicket = (serviceId) => {
    return activeTickets.some(t => t.service_id === serviceId);
  };

  const uniqueCategories = ['All Services', ...new Set(dbServices.map(s => s.category))];

  return (
    <div className="page-container">
      
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
            style={{...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {})}}
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
              <div key={service.id} className="glass-card" style={index === 0 ? {
                ...styles.largeCard,
                padding: isSmallMobile ? '1.5rem' : isMobile ? '2.5rem' : '3rem'
              } : styles.smallCard}>
                
                {/* Header / Icon */}
                <div style={index === 0 ? styles.cardHeader : { ...styles.iconBox, backgroundColor: `var(--${service.color_theme})`, color: `var(--on-${service.color_theme})`, marginBottom: '1.5rem' }}>
                  {index === 0 ? (
                    <>
                      <div style={{ 
                        ...styles.iconBox, 
                        backgroundColor: `var(--${service.color_theme})`, 
                        color: `var(--on-${service.color_theme})`,
                        width: isSmallMobile ? '48px' : '64px',
                        height: isSmallMobile ? '48px' : '64px'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: isSmallMobile ? '1.5rem' : '2.5rem' }}>{service.icon}</span>
                      </div>
                      {service.is_fast_track_available && (
                        <div style={styles.badge} className="hide-mobile">
                          FAST TRACK AVAILABLE
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>{service.icon}</span>
                  )}
                </div>

                {/* Body Content */}
                {index === 0 ? (
                  <div style={styles.cardBody}>
                    <h3 className="headline" style={{
                      ...styles.cardTitleLarge,
                      fontSize: isSmallMobile ? '1.75rem' : '2.5rem'
                    }}>{service.name}</h3>
                    <p style={styles.cardDescLarge}>{service.description}</p>
                    
                    <div style={{
                      ...styles.statsRow,
                      gap: isSmallMobile ? '1rem' : '2rem'
                    }}>
                      <div style={styles.statBox}>
                        <span style={styles.statLabel}>Wait Time</span>
                        <div style={styles.statValBox}>
                          <span style={{ ...styles.statVal, fontSize: isSmallMobile ? '1.5rem' : '2.5rem' }}>{waitTime}</span>
                          <span style={styles.statUnit}>min</span>
                        </div>
                      </div>
                      <div style={styles.statDivider}></div>
                      <div style={styles.statBox}>
                        <span style={styles.statLabel}>In Queue</span>
                        <div style={styles.statValBox}>
                          <span style={{ ...styles.statVal, fontSize: isSmallMobile ? '1.5rem' : '2.5rem' }}>{inQueue}</span>
                          <span style={styles.statUnit}>ppl</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="headline" style={styles.cardTitleSmall}>{service.name}</h3>
                    <p style={styles.cardDescSmall}>{service.description}</p>
                    
                    <div style={styles.waitInfo}>
                      <div style={styles.waitHeader}>
                        <span>Estimated Wait</span>
                        <span style={{ fontWeight: '700' }}>{waitTime} mins</span>
                      </div>
                      <div style={styles.progressTrack}>
                        <div style={{ ...styles.progressFill, width: '75%' }}></div>
                      </div>
                    </div>
                  </>
                )}

                {/* Action Row */}
                {index === 0 ? (
                  <div style={{
                    ...styles.actionRow,
                    flexDirection: isSmallMobile ? 'column' : 'row'
                  }}>
                    <button 
                      className="primary-gradient" 
                      style={{ ...styles.primaryAction, width: isSmallMobile ? '100%' : 'auto' }}
                      onClick={() => handleTakeTicket(service.id)}
                      disabled={hasActiveTicket(service.id)}
                    >
                      {hasActiveTicket(service.id) ? 'Ticket Taken' : 'Take Ticket'}
                    </button>
                    <button style={{ ...styles.secondaryAction, width: isSmallMobile ? '100%' : 'auto' }}>Details</button>
                  </div>
                ) : (
                  <button 
                    style={index % 2 === 1 ? styles.darkAction : styles.lightAction}
                    onClick={() => handleTakeTicket(service.id)}
                    disabled={hasActiveTicket(service.id)}
                  >
                    {hasActiveTicket(service.id) ? 'Ticket Taken' : 'Take Ticket'}
                  </button>
                )}

                {/* Decorative Graphic for Large Card */}
                {index === 0 && (
                  <div style={styles.decorativeImage} className="hide-on-xsmall"></div>
                )}
              </div>
            );
          })}

        {/* Custom Card */}
        <div className="glass-card" style={styles.wideCard}>
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
          <div style={styles.wideGraphic}>
             <span className="material-symbols-outlined" style={{ fontSize: '6rem', color: 'var(--outline-variant)', opacity: 0.5 }}>help_center</span>
          </div>
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
  }
};

export default ServicesPage;
