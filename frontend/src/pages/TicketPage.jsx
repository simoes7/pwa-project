import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

const TicketPage = () => {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await fetch(apiPath(`/tickets/user/${user.id}`));
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
        // Cache tickets locally for offline access
        localStorage.setItem(`cached_tickets_user_${user.id}`, JSON.stringify(data));
        setError('');
        
        // Default to first ticket if none selected or selected ticket no longer exists
        if (data.length > 0 && (!selectedTicketId || !data.find(t => t.id === selectedTicketId))) {
          setSelectedTicketId(data[0].id);
        }
      } else {
        // Fetch was not ok, try to load from cache
        const cached = localStorage.getItem(`cached_tickets_user_${user.id}`);
        if (cached) {
          const cachedData = JSON.parse(cached);
          setTickets(cachedData);
          setError('');
          if (cachedData.length > 0 && (!selectedTicketId || !cachedData.find(t => t.id === selectedTicketId))) {
            setSelectedTicketId(cachedData[0].id);
          }
        } else {
          setError('Failed to fetch tickets');
        }
      }
    } catch (err) {
      // Network/Connection failure, fall back to cache
      const cached = localStorage.getItem(`cached_tickets_user_${user.id}`);
      if (cached) {
        const cachedData = JSON.parse(cached);
        setTickets(cachedData);
        setError('');
        if (cachedData.length > 0 && (!selectedTicketId || !cachedData.find(t => t.id === selectedTicketId))) {
          setSelectedTicketId(cachedData[0].id);
        }
      } else {
        setError('Connection error');
      }
    } finally {
      setLoading(false);
    }
  }, [user, selectedTicketId]);

  // Handle online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void fetchTickets();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchTickets]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const initialTimer = setTimeout(() => {
      void fetchTickets();
    }, 0);
    return () => clearTimeout(initialTimer);
  }, [user, navigate, fetchTickets]);


  const showActionMessage = (msg, isError = false) => {
    setActionMessage({ text: msg, isError });
    setTimeout(() => setActionMessage(''), 4000);
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    if (newStatus === 'cancelled') {
      showConfirm('Are you sure you want to cancel this ticket? You will lose your position in the queue.', async () => {
        try {
          const response = await fetch(apiPath(`/tickets/${ticketId}/self`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, userId: user.id })
          });
          const data = await response.json();
          if (response.ok) {
            fetchTickets();
            showActionMessage('Ticket cancelled');
          } else {
            showActionMessage(data.error || 'Action failed', true);
          }
        } catch (err) {
          console.error('Error updating ticket:', err);
          showActionMessage('Connection error', true);
        }
      }, 'Cancel Ticket');
      return;
    }
    try {
      const response = await fetch(apiPath(`/tickets/${ticketId}/self`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, userId: user.id })
      });
      const data = await response.json();
      if (response.ok) {
        fetchTickets();
        if (newStatus === 'cancelled') {
          showActionMessage('Ticket cancelled');
        } else if (newStatus === 'paused') {
          showActionMessage('Ticket paused — your spot is held');
        } else if (newStatus === 'waiting') {
          showActionMessage('Ticket resumed — back in queue');
        }
      } else {
        showActionMessage(data.error || 'Action failed', true);
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
      showActionMessage('Connection error', true);
    }
  };

  const [remainingInFront, setRemainingInFront] = useState(0);
  const [etaTime, setEtaTime] = useState(null);
  const [etaSeconds, setEtaSeconds] = useState(0);
  const [isDelayed, setIsDelayed] = useState(false);
  const [showDelayMessage, setShowDelayMessage] = useState(false);
  const [showApproachingMessage, setShowApproachingMessage] = useState(false);
  const [avgServiceTime, setAvgServiceTime] = useState(10);

  // We show the selected active ticket
  const ticket = selectedTicketId 
    ? (tickets.find(t => t.id === selectedTicketId) || (tickets.length > 0 ? tickets[0] : null))
    : (tickets.length > 0 ? tickets[0] : null);
  const activeTicketId = ticket?.id;

  useEffect(() => {
    const fetchETA = async () => {
      if (!activeTicketId) return;
      try {
        const res = await fetch(apiPath(`/tickets/${activeTicketId}/eta`));
        if (res.ok) {
          const data = await res.json();
          setRemainingInFront(data.position || 0);
          setEtaTime(data.eta);
          setEtaSeconds(data.eta_seconds || 0);
          setIsDelayed(data.is_delayed || false);
          setShowDelayMessage(data.show_delay_message || false);
          setShowApproachingMessage(data.show_approaching_message || false);
          setAvgServiceTime(data.avg_service_time || 10);
          // Cache the ETA data
          localStorage.setItem(`cached_eta_ticket_${activeTicketId}`, JSON.stringify(data));
        } else {
          // Fetch not ok, load cache fallback
          const cached = localStorage.getItem(`cached_eta_ticket_${activeTicketId}`);
          if (cached) {
            const data = JSON.parse(cached);
            setRemainingInFront(data.position || 0);
            setEtaTime(data.eta);
            setEtaSeconds(data.eta_seconds || 0);
            setIsDelayed(data.is_delayed || false);
            setShowDelayMessage(data.show_delay_message || false);
            setShowApproachingMessage(data.show_approaching_message || false);
            setAvgServiceTime(data.avg_service_time || 10);
          }
        }
      } catch (err) {
        console.error(err);
        // Load cache on connection error
        const cached = localStorage.getItem(`cached_eta_ticket_${activeTicketId}`);
        if (cached) {
          const data = JSON.parse(cached);
          setRemainingInFront(data.position || 0);
          setEtaTime(data.eta);
          setEtaSeconds(data.eta_seconds || 0);
          setIsDelayed(data.is_delayed || false);
          setShowDelayMessage(data.show_delay_message || false);
          setShowApproachingMessage(data.show_approaching_message || false);
          setAvgServiceTime(data.avg_service_time || 10);
        }
      }
    };
    fetchETA();
    const interval = setInterval(fetchETA, 10000); // Sync every 10s
    return () => clearInterval(interval);
  }, [activeTicketId]);


  // Local Countdown Timer (Seconds precision)
  useEffect(() => {
    if (etaSeconds <= 0) return;
    const timer = setInterval(() => {
      setEtaSeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [etaSeconds]);

  const width = useWindowWidth();
  const isMobile = width <= 768;
  const isSmallMobile = width <= 480;

  if (loading) return <div style={styles.emptyWrap}><p>Loading tickets...</p></div>;
  if (error) return <div style={styles.emptyWrap}><p>{error}</p></div>;

  if (tickets.length === 0) {
    return (
      <div style={styles.emptyWrap}>
        <span className="material-symbols-outlined" style={{ fontSize: isMobile ? '3rem' : '4rem', color: 'var(--primary-container)', marginBottom: '1.5rem' }}>confirmation_number</span>
        <h2 className="headline" style={{ fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '1rem' }}>No Active Tickets</h2>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>You don't have any active queue sessions right now.</p>
        <Link to="/services">
          <button className="primary-gradient" style={styles.heroBtn}>Discover Services</button>
        </Link>
      </div>
    );
  }

  const prefix = ticket.ticket_prefix || 'T';
  const queueNum = ticket.queue_number || ticket.id;
  const ticketNumStr = `${prefix}-${String(queueNum).padStart(2, '0')}`;

  const progressPercent = ticket.status === 'called' ? 100 : Math.min(95, Math.max(5, 100 - (remainingInFront * 15)));
  
  const formatETA = () => {
    if (ticket.status === 'called') return 'NOW';
    if (etaSeconds <= 0) return 'Calculating...';
    
    if (etaSeconds < 3600) {
      const mins = Math.floor(etaSeconds / 60);
      const secs = etaSeconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    const date = new Date(Date.now() + etaSeconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimerColor = () => {
    if (isDelayed) return '#ef4444'; // Red
    if (etaSeconds < 300) return '#f59e0b'; // Orange (under 5 mins)
    return 'var(--primary)'; // Blue/Green
  };

  const createdDate = new Date(ticket.created_at || Date.now());
  const ticketDateStr = createdDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const exactTimeStr = createdDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  const turnPeriod = createdDate.getHours() < 12 ? 'Morning' : 'Afternoon';
  
  const usageTimeStr = etaTime ? new Date(etaTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Calculating...';
  
  const expirationDate = new Date(createdDate);
  expirationDate.setHours(23, 59, 59, 999);
  const expirationDateStr = expirationDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ' 11:59 PM';
  
  const qrValue = `ticket-${ticket.id}-${ticketNumStr}`;

  const dynamicStyles = {
    main: {
      ...styles.main,
      padding: isMobile ? '6rem 1rem 8rem' : '8rem 1.5rem 6rem',
    },
    massiveNumber: {
      ...styles.massiveNumber,
      fontSize: isSmallMobile ? '5rem' : isMobile ? '7rem' : '10rem',
    },
    cardHeader: {
      ...styles.cardHeader,
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'center' : 'flex-start',
      textAlign: isMobile ? 'center' : 'left',
      marginBottom: isMobile ? '2rem' : '3rem',
    },
    headerRight: {
      ...styles.headerRight,
      alignItems: isMobile ? 'center' : 'flex-end',
    },
    ticketCard: {
      ...styles.ticketCard,
      padding: isMobile ? '2rem 1.5rem' : '3rem',
    },
    bottomNav: {
      ...styles.bottomNav,
      display: isMobile ? 'flex' : 'none'
    }
  };

  return (
    <div style={styles.container}>
      <main style={dynamicStyles.main}>

        {/* Background Blurs */}
        <div style={styles.blurTop}></div>
        <div style={styles.blurBottom}></div>

        {/* Connection Offline Indicator */}
        {!isOnline && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.5rem',
            borderRadius: '1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#b91c1c',
            marginBottom: '2rem',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)',
            textAlign: 'left'
          }}>
            <span className="material-symbols-outlined" style={{ color: '#ef4444', fontVariationSettings: "'FILL' 1" }}>wifi_off</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>Offline Mode Active</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.85, color: '#991b1b', marginTop: '0.15rem' }}>
                You are currently disconnected. Displaying last synced ticket position. Online status will resume automatically.
              </span>
            </div>
          </div>
        )}

        {/* Ticket Selector - Horizontal Chips */}
        {tickets.length > 1 && (
          <div style={styles.selectorContainer}>
            <div style={styles.selectorScroll}>
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  style={{
                    ...styles.ticketChip,
                    ...(selectedTicketId === t.id ? styles.ticketChipActive : {})
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                    {t.status === 'called' ? 'campaign' : t.status === 'paused' ? 'pause_circle' : 'confirmation_number'}
                  </span>
                  <div style={styles.chipText}>
                    <span style={styles.chipNum}>{t.ticket_prefix || 'T'}-{String(t.queue_number || t.id).padStart(2, '0')}</span>
                    <span style={styles.chipService}>{t.service_name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Called State Banner */}
        {ticket.status === 'called' && (
          <div style={styles.calledBanner}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', fontVariationSettings: "'FILL' 1" }}>campaign</span>
            <div>
              <h2 style={styles.calledTitle}>YOU'RE BEING CALLED!</h2>
              <p style={styles.calledSub}>Please proceed to the service counter now.</p>
            </div>
          </div>
        )}

        {/* Paused State Banner */}
        {ticket.status === 'paused' && (
          <div style={styles.pausedBanner}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', fontVariationSettings: "'FILL' 1" }}>pause_circle</span>
            <div>
              <h2 style={styles.pausedTitle}>TICKET PAUSED</h2>
              <p style={styles.pausedSub}>Your spot is held. Resume when you're ready.</p>
            </div>
          </div>
        )}

        {/* Action Feedback Toast */}
        {actionMessage && (
          <div style={styles.toastContainer}>
            <div className="glass-panel" style={{
              ...styles.toast,
              ...(actionMessage.isError ? styles.toastError : styles.toastSuccess)
            }}>
              <span className="material-symbols-outlined" style={{ color: actionMessage.isError ? '#fff' : 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>
                {actionMessage.isError ? 'error' : 'check_circle'}
              </span>
              <span style={{ ...styles.toastText, color: actionMessage.isError ? '#fff' : 'var(--on-primary-container)' }}>
                {actionMessage.text}
              </span>
            </div>
          </div>
        )}

        {/* Delay Notification (Only for Waiting) */}
        {showDelayMessage && (
          <div style={styles.toastContainer}>
            <div className="glass-panel" style={{ ...styles.toast, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
              <span className="material-symbols-outlined" style={{ color: '#ef4444', fontVariationSettings: "'FILL' 1" }}>warning</span>
              <span style={{ ...styles.toastText, color: '#b91c1c' }}>
                Your turn is approaching. We are currently experiencing a slight delay. Thank you for your patience.
              </span>
            </div>
          </div>
        )}

        {/* Approaching Notification (Only for Waiting) */}
        {showApproachingMessage && !showDelayMessage && (
          <div style={styles.toastContainer}>
            <div className="glass-panel" style={{ ...styles.toast, backgroundColor: 'rgba(0, 85, 215, 0.08)', border: '1px solid var(--primary)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>notification_important</span>
              <span style={{ ...styles.toastText, color: 'var(--on-primary-container)' }}>
                You're almost there! Only {remainingInFront} {remainingInFront === 1 ? 'person' : 'people'} ahead.
              </span>
            </div>
          </div>
        )}

        {/* Notification Toast — only show when no action message and not being served */}
        {!actionMessage && !showDelayMessage && !showApproachingMessage && ticket.status !== 'called' && (
          <div style={styles.toastContainer}>
            <div className="glass-panel" style={{ ...styles.toast }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>
                {ticket.status === 'paused' ? 'hourglass_top' : 'info'}
              </span>
              <span style={{ ...styles.toastText, color: 'var(--on-primary-container)' }}>
                {ticket.status === 'paused'
                  ? `Position held — ${remainingInFront} ahead when you resume`
                  : remainingInFront === 0
                    ? "You're next!"
                    : isSmallMobile
                      ? `${remainingInFront} people ahead`
                      : `${remainingInFront} ${remainingInFront === 1 ? 'person' : 'people'} ahead of you.`}
              </span>
            </div>
          </div>
        )}

        {/* Main Ticket Card */}
        <div className="glass-card" style={dynamicStyles.ticketCard}>
          <div style={dynamicStyles.cardHeader}>
            <div>
              <h2 className="headline" style={styles.cardTopLabel}>YOUR TICKET</h2>
              <div className="headline" style={dynamicStyles.massiveNumber}>
                {ticketNumStr}
              </div>
            </div>
            <div style={dynamicStyles.headerRight}>
              <div style={styles.servingBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>campaign</span>
                Serving: {ticketNumStr}
              </div>
              <div style={styles.locationTag} className="hide-mobile">
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', fontVariationSettings: "'FILL' 1" }}>location_on</span>
                {ticket.service_name}
              </div>
            </div>
          </div>

          {/* Bento Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>ESTIMATED TURN TIME</p>
              <div style={styles.statValueRow}>
                <span className="headline" style={{ ...styles.statNum, color: getTimerColor(), fontSize: isSmallMobile ? '1.5rem' : '2.5rem' }}>{formatETA()}</span>
              </div>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>POSITION IN LINE</p>
              <div style={styles.statValueRow}>
                <span className="headline" style={{ ...styles.statNum, color: 'var(--secondary)', fontSize: isSmallMobile ? '2.5rem' : '3.5rem' }}>{String(remainingInFront).padStart(2, '0')}</span>
                <span style={styles.statUnit}>ahead</span>
              </div>
            </div>
          </div>

          {/* Ticket Details with QR Code */}
          <div style={styles.ticketDetails}>
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Ticket Date</span>
                <span style={styles.detailValue}>{ticketDateStr}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Exact Time</span>
                <span style={styles.detailValue}>{exactTimeStr} ({turnPeriod})</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Usage Time (ETA)</span>
                <span style={styles.detailValue}>{usageTimeStr}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Expiration Date</span>
                <span style={styles.detailValue}>{expirationDateStr}</span>
              </div>
            </div>
            <div style={styles.qrContainer}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(qrValue)}`} alt="Ticket QR Code" style={{ width: 90, height: 90 }} />
            </div>
          </div>

          {/* Progress Section */}
          <div style={styles.progressSection}>
            <div style={styles.progressLabelRow}>
              <h3 className="headline" style={styles.progressTitle}>Queue Progress</h3>
              <span style={styles.progressPercentText}>{progressPercent}%</span>
            </div>
            <div style={styles.progressTrack}>
              <div className="primary-gradient" style={{ ...styles.progressFill, width: `${progressPercent}%` }}></div>
            </div>

            {/* Stepper */}
            <div style={styles.stepper}>
              <div style={styles.step}>
                <div style={styles.stepCircleActive}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
                <span style={styles.stepLabel} className="hide-on-xsmall">JOINED</span>
              </div>
              <div style={styles.step}>
                <div style={progressPercent >= 25 ? styles.stepCircleActive : styles.stepCircle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>fact_check</span>
                </div>
                <span style={progressPercent >= 25 ? styles.stepLabel : styles.stepLabelInactive} className="hide-on-xsmall">VALIDATED</span>
              </div>
              <div style={styles.step}>
                <div style={progressPercent >= 50 ? { ...styles.stepCircleActive, animation: 'pulse 2s infinite' } : styles.stepCircle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>hourglass_empty</span>
                </div>
                <span style={progressPercent >= 50 ? styles.stepLabel : styles.stepLabelInactive} className="hide-on-xsmall">WAITING</span>
              </div>
              <div style={styles.step}>
                <div style={ticket.status === 'called' ? { ...styles.stepCircleActive, animation: 'pulse 1.5s infinite', backgroundColor: 'var(--tertiary)' } : styles.stepCircleDim}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>notifications</span>
                </div>
                <span style={ticket.status === 'called' ? styles.stepLabel : styles.stepLabelInactive} className="hide-on-xsmall">SERVING</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={styles.actionRow}>
            <button
              onClick={() => {
                if (!isOnline) {
                  showAlert('You are currently offline. This action requires internet connection to reach our queue servers.', 'Offline Action Unavailable');
                  return;
                }
                ticket.status === 'paused' ? updateTicketStatus(ticket.id, 'waiting') : updateTicketStatus(ticket.id, 'paused');
              }}
              disabled={ticket.status === 'called'}
              style={{
                ...styles.pauseBtn,
                ...(ticket.status === 'called' ? styles.actionBtnDisabled : {}),
                ...(!isOnline ? { opacity: 0.5, cursor: 'not-allowed' } : {})
              }}
            >
              <span className="material-symbols-outlined">{ticket.status === 'paused' ? 'play_circle' : 'pause_circle'}</span>
              <span className="hide-mobile">{ticket.status === 'paused' ? 'Resume Ticket' : ticket.status === 'called' ? 'Cannot Pause' : 'Pause Ticket'}</span>
              <span className="show-mobile">{ticket.status === 'paused' ? 'Resume' : ticket.status === 'called' ? 'Called' : 'Pause'}</span>
            </button>
            <button
              onClick={() => {
                if (!isOnline) {
                  showAlert('You are currently offline. This action requires internet connection to reach our queue servers.', 'Offline Action Unavailable');
                  return;
                }
                updateTicketStatus(ticket.id, 'cancelled');
              }}
              disabled={ticket.status === 'called'}
              style={{
                ...styles.cancelBtn,
                ...(ticket.status === 'called' ? styles.actionBtnDisabled : {}),
                ...(!isOnline ? { opacity: 0.5, cursor: 'not-allowed' } : {})
              }}
            >
              <span className="material-symbols-outlined">cancel</span>
              <span className="hide-mobile">{ticket.status === 'called' ? 'Being Called' : 'Cancel Ticket'}</span>
              <span className="show-mobile">{ticket.status === 'called' ? 'Called' : 'Cancel'}</span>
            </button>
          </div>

        </div>

        {/* Location Card */}
        <div className="glass-panel" style={styles.locationCard}>
          <div style={styles.locationLeft}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoMnA2lzJ5LXRmGfq3W2XY_HIHuFk98YvXv2uLOfTjs-TpjGx1YFYwC4pE8eVAUoh_1Awqt5DVBeW_750lsj9NsE7LDcOQsP---1IRGbBv-5Ja-RDAfrmrsFo2uWXr_KsQ0wsOwzG5gtiR6NUtVrf--FvBFoSh67jRXRhAV1YbFhtPBLDcLwsSxdGzlFUjRRpmSaOvhF-6yUEBqYBjO-WB0GhZ6X05LMQaC5lZN0_gFnWF_jS8ObFHu4B1yOu3icp_J5pJbW_glMwY"
              alt="Map"
              style={styles.miniMap}
            />
            <div>
              <h4 className="headline" style={styles.locName}>Service Hub North</h4>
              <p style={styles.locAddress} className="hide-on-xsmall">124 Innovation Way, Suite 400</p>
            </div>
          </div>
          <button style={styles.navBtn}>
            <span>Navigate</span>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>directions</span>
          </button>
        </div>

      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    position: 'relative'
  },
  selectorContainer: {
    marginBottom: '2rem',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: '0.5rem 0'
  },
  selectorScroll: {
    display: 'flex',
    gap: '1rem',
    padding: '0 0.5rem'
  },
  ticketChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1.25rem',
    borderRadius: '1.5rem',
    backgroundColor: 'var(--surface-container-low)',
    border: '1px solid var(--outline-variant)',
    color: 'var(--on-surface-variant)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    minWidth: '160px',
    textAlign: 'left'
  },
  ticketChipActive: {
    backgroundColor: 'var(--primary-container)',
    borderColor: 'var(--primary)',
    color: 'var(--on-primary-container)',
    boxShadow: '0 4px 12px rgba(0, 85, 215, 0.15)'
  },
  chipText: {
    display: 'flex',
    flexDirection: 'column'
  },
  chipNum: {
    fontSize: '1rem',
    fontWeight: '800',
    lineHeight: 1
  },
  chipService: {
    fontSize: '0.75rem',
    opacity: 0.8,
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  main: {
    maxWidth: '896px', // max-w-4xl
    margin: '0 auto',
    padding: '8rem 1.5rem 6rem',
    position: 'relative'
  },
  emptyWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    textAlign: 'center',
    padding: '2rem'
  },
  heroBtn: {
    padding: '1rem 2rem',
    borderRadius: '1rem',
    color: 'white',
    fontWeight: '700',
    cursor: 'pointer'
  },
  blurTop: {
    position: 'absolute',
    top: '-6rem',
    right: '-6rem',
    width: '24rem',
    height: '24rem',
    backgroundColor: 'rgba(0, 85, 215, 0.05)',
    borderRadius: '50%',
    filter: 'blur(64px)',
    zIndex: -1
  },
  blurBottom: {
    position: 'absolute',
    bottom: '-6rem',
    left: '-6rem',
    width: '24rem',
    height: '24rem',
    backgroundColor: 'rgba(116, 47, 229, 0.05)',
    borderRadius: '50%',
    filter: 'blur(64px)',
    zIndex: -1
  },
  toastContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem'
  },
  toast: {
    padding: '0.75rem 1.5rem',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  toastText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--on-primary-container)'
  },
  toastSuccess: {
    backgroundColor: 'rgba(0, 85, 215, 0.08)',
    border: '1px solid rgba(0, 85, 215, 0.2)'
  },
  toastError: {
    backgroundColor: '#ac3149',
    border: 'none'
  },
  toastCalled: {
    backgroundColor: 'var(--tertiary)',
    border: 'none',
    boxShadow: '0 4px 12px rgba(255, 109, 0, 0.2)'
  },
  calledBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1.5rem 2rem',
    borderRadius: '1rem',
    backgroundColor: 'var(--tertiary)',
    color: 'white',
    marginBottom: '2rem',
    boxShadow: '0 8px 24px rgba(255, 109, 0, 0.3)'
  },
  calledTitle: {
    fontSize: '1.25rem',
    fontWeight: '900',
    margin: 0,
    letterSpacing: '0.02em'
  },
  calledSub: {
    fontSize: '0.875rem',
    margin: '0.25rem 0 0',
    opacity: 0.9
  },
  pausedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1.5rem 2rem',
    borderRadius: '1rem',
    backgroundColor: 'var(--surface-container-highest)',
    color: 'var(--on-surface)',
    marginBottom: '2rem',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    borderLeft: '4px solid var(--secondary)'
  },
  pausedTitle: {
    fontSize: '1.25rem',
    fontWeight: '900',
    margin: 0,
    letterSpacing: '0.02em'
  },
  pausedSub: {
    fontSize: '0.875rem',
    margin: '0.25rem 0 0',
    color: 'var(--on-surface-variant)'
  },
  actionBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    pointerEvents: 'none'
  },
  ticketCard: {
    backgroundColor: 'white',
    padding: '3rem',
    display: 'flex',
    flexDirection: 'column'
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '3rem',
    gap: '2rem',
    flexWrap: 'wrap'
  },
  cardTopLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--on-surface-variant)',
    letterSpacing: '0.15em',
    marginBottom: '0.5rem'
  },
  massiveNumber: {
    fontSize: '10rem',
    fontWeight: '900',
    color: 'var(--on-surface)',
    letterSpacing: '-0.05em',
    lineHeight: '1'
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '1rem'
  },
  servingBadge: {
    backgroundColor: 'var(--tertiary-container)',
    color: 'var(--on-tertiary-container)',
    padding: '0.75rem 1.5rem',
    borderRadius: '9999px',
    fontWeight: '800',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  locationTag: {
    color: 'var(--on-surface-variant)',
    fontWeight: '600',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  statBox: {
    backgroundColor: 'var(--surface-container-low)',
    padding: '2rem',
    borderRadius: '1rem'
  },
  statLabel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    letterSpacing: '0.1em',
    marginBottom: '1rem'
  },
  statValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem'
  },
  statNum: {
    fontSize: '3.5rem',
    fontWeight: '900'
  },
  statUnit: {
    fontSize: '1.25rem',
    fontWeight: '500',
    color: 'var(--on-surface-variant)'
  },
  ticketDetails: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--surface-container-low)',
    padding: '1.5rem',
    borderRadius: '1rem',
    marginBottom: '3rem',
    flexWrap: 'wrap',
    gap: '1.5rem'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '1.25rem',
    flex: 1
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  detailLabel: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: 'var(--on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  detailValue: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--on-surface)'
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: '0.5rem',
    borderRadius: '0.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  progressSection: {
    marginBottom: '3rem'
  },
  progressLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  progressTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--on-surface)'
  },
  progressPercentText: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)',
    fontWeight: '600'
  },
  progressTrack: {
    height: '1rem',
    backgroundColor: 'var(--surface-container-high)',
    borderRadius: '9999px',
    overflow: 'hidden',
    position: 'relative'
  },
  progressFill: {
    height: '100%',
    borderRadius: '9999px',
    boxShadow: '0 0 15px rgba(0, 85, 215, 0.4)',
    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  stepper: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    marginTop: '2rem'
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  stepCircle: {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    backgroundColor: 'white',
    border: '2px solid var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary)'
  },
  stepCircleActive: {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  stepCircleDim: {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    backgroundColor: 'var(--surface-container-high)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--on-surface-variant)'
  },
  stepLabel: {
    fontSize: '0.625rem',
    fontWeight: '800',
    color: 'var(--on-surface-variant)',
    letterSpacing: '0.05em'
  },
  stepLabelInactive: {
    fontSize: '0.625rem',
    fontWeight: '800',
    color: 'var(--on-surface-variant)',
    opacity: 0.5,
    letterSpacing: '0.05em'
  },
  actionRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
    paddingTop: '2rem',
    borderTop: '1px solid var(--surface-container-low)',
    flexWrap: 'wrap'
  },
  pauseBtn: {
    flex: 1,
    minWidth: '140px',
    backgroundColor: 'var(--surface-container-highest)',
    color: 'var(--on-primary-container)',
    padding: '1rem',
    borderRadius: '0.75rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    border: 'none'
  },
  cancelBtn: {
    flex: 1,
    minWidth: '140px',
    backgroundColor: 'rgba(104, 0, 31, 0.05)',
    color: 'var(--error)',
    padding: '1rem',
    borderRadius: '0.75rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    border: 'none'
  },
  locationCard: {
    marginTop: '2rem',
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  locationLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  miniMap: {
    width: '4rem',
    height: '4rem',
    borderRadius: '0.5rem',
    objectFit: 'cover'
  },
  locName: {
    fontSize: '1rem',
    fontWeight: '800',
    color: 'var(--on-surface)'
  },
  locAddress: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)'
  },
  navBtn: {
    color: 'var(--primary)',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    border: 'none'
  },
  bottomNav: {
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

export default TicketPage;
