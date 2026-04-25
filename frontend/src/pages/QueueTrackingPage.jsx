import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Clock } from 'lucide-react';

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

const QueueTrackingPage = () => {
  const { tickets, services } = useQueue();
  const width = useWindowWidth();
  const isMobile = width <= 1024;
  const isSmallMobile = width <= 640;

  // Sort queue
  const activeTickets = tickets.filter(t => ['waiting', 'called'].includes(t.status))
                               .sort((a, b) => a.createdAt - b.createdAt);
  
  // Assuming bank is main queue for mockup
  const mainService = services.find(s => s.id === 'bank') || services[0];
  const calledInMain = activeTickets.find(t => t.serviceId === mainService?.id && t.status === 'called');

  const dynamicStyles = {
    header: {
      ...styles.header,
      marginBottom: isMobile ? '2rem' : '4rem',
    },
    title: {
      ...styles.title,
      fontSize: isSmallMobile ? '2.5rem' : isMobile ? '3rem' : '4rem',
    },
    topCardsGrid: {
      ...styles.topCardsGrid,
      gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
    },
    largeNumber: {
      ...styles.largeNumber,
      fontSize: isSmallMobile ? '4rem' : isMobile ? '6rem' : '8rem',
      margin: isSmallMobile ? '1rem 0' : '2rem 0',
    },
    mainTrackerCard: {
      ...styles.mainTrackerCard,
      padding: isSmallMobile ? '1.5rem' : '3rem',
    }
  };

  return (
    <div className="page-container">
      {/* Header section */}
      <div style={dynamicStyles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.topLabel}>LIVE MONITORING</span>
          <h1 style={dynamicStyles.title}>
            Tracking <span className="text-gradient">Real-Time</span> Flow.
          </h1>
          <p style={styles.subtitle}>
            Experience the ethereal flow of our smart queuing system.
          </p>
        </div>
        {!isSmallMobile && (
          <div style={styles.headerRight}>
            <div style={styles.nextCallPill}>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <span style={{fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)'}}>NEXT CALL IN</span>
                <span style={{fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)'}}>02:45</span>
              </div>
              <div style={{padding: '0.5rem', borderRadius: '50%', backgroundColor: '#fff', border: '2px solid var(--primary)'}}>
                <Clock size={20} color="var(--primary)" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={dynamicStyles.topCardsGrid}>
        {/* Large Counter Card */}
        <div className="glass-card" style={dynamicStyles.mainTrackerCard}>
          <div style={styles.cardHeaderFlex}>
            <Badge status="serving" style={{fontSize: '0.75rem', padding: '0.5rem 1rem'}} />
            <div style={styles.counterWrap}>
              <span style={{fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)'}}>COUNTER</span>
              <span style={{fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)'}}>04</span>
            </div>
          </div>
          
          <div style={dynamicStyles.largeNumber}>
            {calledInMain ? calledInMain.number : `${mainService?.prefix}-${mainService?.currentServing}`}
          </div>

          <div style={styles.agentTag}>
            <div style={styles.agentAvatar}>
              <img src="https://ui-avatars.com/api/?name=James+D&background=0D8ABC&color=fff" alt="Agent" style={{width: '100%', borderRadius: '50%'}} />
            </div>
            <div>
              <div style={{fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem'}}>James D. Specialist</div>
              <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}} className="hide-mobile">General Inquiries & Verification</div>
            </div>
          </div>
        </div>

        {/* Queue Health Card */}
        <div className="glass-card" style={{padding: isSmallMobile ? '1.5rem' : '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', backgroundColor: '#f8fafc', border: 'none'}}>
          <h3 style={{color: 'var(--accent)', fontSize: '1.25rem'}}>Queue Health</h3>
          
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)'}}>
              <span>EFFICIENCY</span>
              <span>96%</span>
            </div>
            <div style={{height: '8px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-full)'}}>
              <div style={{height: '100%', width: '96%', backgroundColor: 'var(--primary)', borderRadius: 'var(--radius-full)'}} />
            </div>
          </div>

          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)'}}>
              <span>WAIT TIME</span>
              <span>8 MIN</span>
            </div>
            <div style={{height: '8px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-full)'}}>
              <div style={{height: '100%', width: '30%', background: 'var(--gradient-main)', borderRadius: 'var(--radius-full)'}} />
            </div>
          </div>

          <div style={{backgroundColor: '#fff', padding: '1rem', borderRadius: '1rem', marginTop: 'auto', display: 'flex', flexDirection: 'column'}}>
            <span style={{fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600}}>ESTIMATED DEPARTURE</span>
            <span style={{fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)'}}>14:45 <span style={{fontSize: '1rem', fontWeight: 600}}>PM</span></span>
          </div>
        </div>
      </div>

      <div style={styles.upcomingSection}>
        <h3 style={{fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '1.5rem'}}>Upcoming Tickets</h3>
        <div style={styles.horizontalList}>
          {activeTickets.filter(t => t.status === 'waiting').slice(0,4).map((ticket, i) => (
            <div key={ticket.id} className="glass-card" style={styles.pillCard}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
                <span style={{fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)'}}>{ticket.number}</span>
                <Badge status={i === 2 ? 'priority' : 'pending'} style={{padding: '0.2rem 0.5rem', fontSize: '0.6rem'}} />
              </div>
              <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500}}>Wait Time: ~{(i+1)*5}m</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={styles.mapBanner}>
        {/* Simple mock map overlay */}
        <div style={styles.mapInner}>
          <div style={{
            position: 'absolute', 
            bottom: isSmallMobile ? '1rem' : '2rem', 
            left: isSmallMobile ? '1rem' : '2rem', 
            right: isSmallMobile ? '1rem' : 'auto',
            backgroundColor: '#fff', 
            padding: isSmallMobile ? '1rem' : '1.5rem', 
            borderRadius: '1.25rem', 
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{fontWeight: 800, color: 'var(--accent)'}}>Central Service Hub</div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem'}} className="hide-on-xsmall">12th Avenue, Manhattan, NY</div>
            <button style={{backgroundColor: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', fontWeight: 700, width: '100%'}}>Directions</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '4rem',
    flexWrap: 'wrap',
    gap: '2rem'
  },
  headerLeft: {
    maxWidth: '500px'
  },
  topLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--primary)',
    letterSpacing: '0.1em',
    marginBottom: '1rem',
    display: 'block'
  },
  title: {
    fontSize: '4rem',
    fontWeight: '800',
    lineHeight: '1.1',
    letterSpacing: '-0.04em',
    marginBottom: '1rem'
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '1.1rem',
    lineHeight: '1.5'
  },
  nextCallPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.5rem',
    backgroundColor: 'var(--info-light)',
    borderRadius: '1.5rem',
    boxShadow: 'var(--shadow-sm)'
  },
  topCardsGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem',
    marginBottom: '4rem'
  },
  mainTrackerCard: {
    padding: '3rem',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff'
  },
  cardHeaderFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  counterWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'var(--info-light)',
    padding: '0.5rem 1rem',
    borderRadius: '1rem'
  },
  largeNumber: {
    fontSize: '8rem',
    fontWeight: '800',
    color: 'var(--accent)',
    lineHeight: '1.2',
    letterSpacing: '-0.03em',
    margin: '2rem 0'
  },
  agentTag: {
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  agentAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--border-color)'
  },
  upcomingSection: {
    marginBottom: '4rem'
  },
  horizontalList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1.5rem'
  },
  pillCard: {
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    border: 'none',
    boxShadow: 'var(--shadow-sm)'
  },
  mapBanner: {
    height: '300px',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    padding: 0
  },
  mapInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e2e8f0',
    backgroundImage: 'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    position: 'relative'
  }
};

export default QueueTrackingPage;
