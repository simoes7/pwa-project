import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { apiPath } from '../config';

// Fix leaflet marker icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

let SelectedIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: iconShadow,
    iconSize: [30, 48],
    iconAnchor: [15, 48],
    className: 'selected-marker-pulse'
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15, { animate: true });
    }
  }, [center, map]);
  return null;
};

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

const MapPage = () => {
  const [selectedId, setSelectedId] = useState('bank');
  const [dbServices, setDbServices] = useState([]);
  const [isTakingTicket, setIsTakingTicket] = useState(false);
  const [activeTickets, setActiveTickets] = useState([]);
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width <= 1024;
  const isSmallMobile = width <= 640;
  const [panelExpanded, setPanelExpanded] = useState(false);
  
  const fetchActiveTickets = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(apiPath(`/tickets/user/${user.id}`));
      if (response.ok) {
        setActiveTickets(await response.json());
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
          if (data.length > 0) {
            setSelectedId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
    fetchActiveTickets();
  }, [fetchActiveTickets]);

  const hasActiveTicket = (serviceId) => activeTickets.some(t => t.service_id === serviceId);


  const selectedService = dbServices.find(s => s.id === selectedId) || dbServices[0] || {};
  const otherServices = dbServices.filter(s => s.id !== selectedId);

  const handleTakeTicket = async () => {
    if (!user) {
      showAlert("Please login first to take a ticket.", "Authentication Required", "info");
      navigate('/login');
      return;
    }
    
    setIsTakingTicket(true);
    try {
      const response = await fetch(apiPath('/tickets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id || 1, serviceId: selectedService.id })
      });
      
      if (response.ok) {
        showAlert('Digital Token generated successfully!', 'Success', 'success');
        navigate('/ticket');
      } else {
        const errData = await response.json();
        showAlert(errData.error || 'Failed to get a digital token.', 'Error', 'error');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      showAlert('Network error. Please check your connection.', 'Connection Error', 'error');
    } finally {
      setIsTakingTicket(false);
    }
  };

  const handleDirections = () => {
    if (selectedService.lat && selectedService.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedService.lat},${selectedService.lng}`, '_blank');
    }
  };

  const dynamicStyles = {
    main: {
      ...styles.main,
      flexDirection: isMobile ? 'column' : 'row',
    },
    sidebar: {
      ...styles.sidebar,
      width: isMobile ? '100%' : '384px',
      height: isMobile ? (panelExpanded ? '70vh' : '280px') : '100%',
      position: isMobile ? 'absolute' : 'relative',
      bottom: isMobile ? '5rem' : '0', // 5rem is bottomNav height
      left: 0,
      zIndex: isMobile ? 1000 : 40,
      borderLeft: isMobile ? 'none' : '1px solid var(--surface-container-low)',
      borderTop: isMobile ? '1px solid var(--surface-container-low)' : 'none',
      borderRadius: isMobile ? '2rem 2rem 0 0' : '0',
      boxShadow: isMobile ? '0 -10px 40px rgba(13, 52, 89, 0.15)' : 'none',
      transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      overflowY: 'auto',
      order: isMobile ? 2 : 1,
    },
    mapCanvas: {
      ...styles.mapCanvas,
      height: '100%',
      width: '100%',
      flex: 1,
      order: isMobile ? 1 : 2,
    },
    bottomNav: {
      ...styles.bottomNav,
      display: isMobile ? 'flex' : 'none'
    },
    floatingSearch: {
      ...styles.floatingSearch,
      top: '1rem',
      zIndex: 2000, // Very high to be above all Map panes
    }
  };

  return (
    <div style={styles.pageWrap}>
      <style>{`
        .selected-marker-pulse {
          filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.5));
          animation: marker-pulse 1.5s infinite ease-in-out;
        }
        @keyframes marker-pulse {
          0% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.1) translateY(-5px); }
          100% { transform: scale(1) translateY(0); }
        }
        .custom-tooltip {
          background: var(--surface-container-high) !important;
          border: 1px solid var(--primary) !important;
          border-radius: 8px !important;
          padding: 4px 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
      `}</style>
      <main style={dynamicStyles.main}>
        
        {/* Map Canvas */}
        <div style={dynamicStyles.mapCanvas}>
          {dbServices.length > 0 ? (
            <MapContainer 
              center={[31.6295, -7.9811]} 
              zoom={13} 
              style={{ width: '100%', height: '100%', zIndex: 1 }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapController center={selectedService.lat && selectedService.lng ? [selectedService.lat, selectedService.lng] : null} />
              {dbServices.map(service => (
                service.lat && service.lng && (
                  <Marker 
                    key={service.id} 
                    position={[service.lat, service.lng]}
                    icon={selectedId === service.id ? SelectedIcon : DefaultIcon}
                    zIndexOffset={selectedId === service.id ? 1000 : 0}
                    eventHandlers={{
                      click: () => {
                        setSelectedId(service.id);
                        if (isMobile) setPanelExpanded(false);
                      },
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -20]} className="custom-tooltip">
                      <strong>{service.name}</strong>
                    </Tooltip>
                    <Popup>
                      <strong>{service.name}</strong><br/>
                      {service.category}
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--on-surface-variant)' }}>Loading map...</div>
          )}
          <div className="map-gradient-overlay" style={{...styles.mapOverlay, zIndex: 2}}></div>

          {/* Floating Search Bar */}
          <div style={dynamicStyles.floatingSearch}>
            <div className="glass-panel" style={styles.searchBar}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>search</span>
              <input 
                type="text" 
                placeholder="Search..." 
                style={styles.searchInput}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="custom-scrollbar" style={dynamicStyles.sidebar}>
          {isMobile && (
            <div 
              style={styles.dragHandleWrap} 
              onClick={() => setPanelExpanded(!panelExpanded)}
            >
              <div style={styles.dragHandle}></div>
            </div>
          )}
          <div style={{...styles.sidebarInner, paddingTop: isMobile ? '0.5rem' : '2rem'}}>
            <header style={{ ...styles.sidebarHeader, marginBottom: isMobile ? '1rem' : '1.5rem' }}>
              <h1 className="headline" style={{ ...styles.sidebarTitle, fontSize: isSmallMobile ? '1.25rem' : '1.875rem' }}>Nearby Services</h1>
              <p style={styles.sidebarSubtitle}>Real-time location tracking.</p>
            </header>

            {/* Featured Selection */}
            <div className="glass-card" style={styles.featuredCard}>
              <div style={styles.featuredTop}>
                <div style={{...styles.featuredIconWrap, color: `var(--${selectedService.color_theme || 'primary'})`}}>
                   <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>
                    {selectedService.icon || 'location_on'}
                   </span>
                </div>
                <span style={styles.selectedBadge}>SELECTED</span>
              </div>
              
              <h2 className="headline" style={styles.featuredName}>{selectedService.name}</h2>
              <p style={styles.featuredAddress}>Guéliz Branch, Marrakech</p>

              <div style={styles.featuredStats}>
                <div style={styles.featuredStat}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--tertiary)' }}>timer</span>
                  <span style={{ fontWeight: '700', color: 'var(--tertiary)' }}>{((selectedService.people_waiting || 0) + 1) * selectedService.estimated_wait_time}m wait</span>
                </div>
                <div style={styles.featuredStat}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>group</span>
                  <span>{selectedService.people_waiting || 0} in queue</span>
                </div>
              </div>

              <div style={styles.featuredActions}>
                <button 
                  className={(selectedService.is_open && !hasActiveTicket(selectedService.id)) ? 'primary-gradient' : ''}
                  style={{
                    ...styles.tokenBtn, 
                    opacity: isTakingTicket ? 0.7 : 1,
                    ...((!selectedService.is_open || hasActiveTicket(selectedService.id)) ? {
                      backgroundColor: 'var(--surface-container-high)',
                      color: 'var(--on-surface-variant)',
                      cursor: 'not-allowed',
                      boxShadow: 'none'
                    } : {})
                  }}
                  onClick={() => selectedService.is_open && !hasActiveTicket(selectedService.id) && handleTakeTicket()}
                  disabled={isTakingTicket || !selectedService.is_open || hasActiveTicket(selectedService.id)}
                >
                  <span className="material-symbols-outlined">confirmation_number</span>
                  {isTakingTicket ? 'Generating...' : !selectedService.is_open ? 'Currently Closed' : hasActiveTicket(selectedService.id) ? 'Ticket Taken' : 'Get Digital Token'}
                </button>
                <button 
                  style={styles.directionsBtn}
                  onClick={handleDirections}
                >
                  <span className="material-symbols-outlined">directions</span>
                  Directions
                </button>
              </div>
            </div>

            {/* Other Nearby Options */}
            <div style={styles.nearbySection}>
              <h3 style={styles.nearbyTitle}>OTHER NEARBY OPTIONS</h3>
              <div style={styles.nearbyList}>
                {otherServices.map(service => (
                  <div 
                    key={service.id} 
                    style={styles.nearbyItem}
                    onClick={() => {
                      setSelectedId(service.id);
                      if (isMobile) setPanelExpanded(false);
                    }}
                  >
                    <div style={{ 
                      ...styles.nearbyIcon, 
                      backgroundColor: `var(--${service.color_theme || 'primary'}-container)`,
                      color: `var(--on-${service.color_theme || 'primary'}-container)`
                    }}>
                      <span className="material-symbols-outlined">
                        {service.icon || 'location_on'}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={styles.nearbyName}>{service.name}</p>
                      <p style={styles.nearbyMeta}>1.2km • {((service.people_waiting || 0) + 1) * service.estimated_wait_time}m wait</p>
                    </div>
                    <span className="material-symbols-outlined" style={{ color: 'var(--outline-variant)' }}>chevron_right</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
};

const styles = {
  pageWrap: {
    height: 'calc(100vh - 80px)',
    marginTop: '80px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'var(--background)',
  },
  main: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    overflow: 'hidden'
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'var(--surface-container-low)',
    overflow: 'hidden'
  },
  mapImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  mapOverlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none'
  },
  floatingSearch: {
    position: 'absolute',
    top: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '36rem',
    padding: '0 1rem',
    zIndex: 999 // Below Navbar (1000) but above Map (400)
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem 0.5rem 1.5rem',
    borderRadius: '9999px',
    boxShadow: '0 12px 40px rgba(13, 52, 89, 0.1)'
  },
  searchInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    padding: '0.5rem 1rem',
    outline: 'none',
    fontWeight: '500',
    color: 'var(--on-surface)'
  },
  marker: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 30
  },
  markerPoint: {
    backgroundColor: 'var(--primary)',
    color: 'white',
    padding: '0.75rem',
    borderRadius: '50%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
    transition: 'all 0.3s'
  },
  markerPointActive: {
    backgroundColor: 'var(--primary)',
    color: 'white',
    padding: '0.75rem',
    borderRadius: '50%',
    boxShadow: '0 10px 25px rgba(0, 85, 215, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'scale(1.1)',
    transition: 'all 0.3s'
  },
  markerPointSecondary: {
    backgroundColor: 'var(--secondary)',
    color: 'white',
    padding: '0.75rem',
    borderRadius: '50%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8
  },
  markerPointActiveSecondary: {
    backgroundColor: 'var(--secondary)',
    color: 'white',
    padding: '0.75rem',
    borderRadius: '50%',
    boxShadow: '0 10px 25px rgba(116, 47, 229, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'scale(1.1)'
  },
  markerLabel: {
    marginTop: '0.5rem',
    backgroundColor: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
  },
  mapControls: {
    position: 'absolute',
    bottom: '2rem',
    right: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 20
  },
  zoomStack: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '1rem',
    backgroundColor: 'white',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(13, 52, 89, 0.1)'
  },
  controlBtn: {
    width: '3rem',
    height: '3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    cursor: 'pointer',
    color: 'var(--on-surface)',
    border: 'none'
  },
  sidebar: {
    width: '384px',
    backgroundColor: 'white',
    overflowY: 'auto',
    zIndex: 40
  },
  sidebarInner: {
    padding: '2rem'
  },
  sidebarHeader: {
    marginBottom: '2rem'
  },
  sidebarTitle: {
    fontSize: '1.875rem',
    fontWeight: '800',
    color: 'var(--on-surface)',
    letterSpacing: '-0.025em',
    marginBottom: '0.5rem'
  },
  sidebarSubtitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--on-surface-variant)'
  },
  featuredCard: {
    backgroundColor: 'var(--surface-container-low)',
    padding: '1.5rem',
    borderRadius: '1rem',
    marginBottom: '2rem'
  },
  featuredTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  featuredIconWrap: {
    width: '3rem',
    height: '3rem',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  selectedBadge: {
    backgroundColor: 'var(--secondary-container)',
    color: 'var(--on-secondary-container)',
    fontSize: '0.625rem',
    fontWeight: '800',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    letterSpacing: '0.1em'
  },
  featuredName: {
    fontSize: '1.25rem',
    fontWeight: '800',
    marginBottom: '0.25rem'
  },
  featuredAddress: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)',
    marginBottom: '1.5rem'
  },
  featuredStats: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem'
  },
  featuredStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--on-surface-variant)'
  },
  featuredActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  tokenBtn: {
    width: '100%',
    padding: '1rem',
    borderRadius: '0.75rem',
    color: 'white',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    border: 'none'
  },
  directionsBtn: {
    width: '100%',
    padding: '1rem',
    borderRadius: '0.75rem',
    backgroundColor: 'white',
    color: 'var(--on-surface)',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  nearbySection: {
    marginTop: '2.5rem'
  },
  nearbyTitle: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--on-surface-variant)',
    letterSpacing: '0.15em',
    marginBottom: '1.5rem',
    opacity: 0.8
  },
  nearbyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  nearbyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: 'var(--surface-container-low)'
    }
  },
  nearbyIcon: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  nearbyName: {
    fontSize: '0.875rem',
    fontWeight: '800',
    color: 'var(--on-surface)'
  },
  nearbyMeta: {
    fontSize: '0.75rem',
    color: 'var(--on-surface-variant)'
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
  },
  dragHandleWrap: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem 0',
    cursor: 'pointer',
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
    zIndex: 10
  },
  dragHandle: {
    width: '40px',
    height: '4px',
    backgroundColor: 'var(--surface-container-highest)',
    borderRadius: '2px'
  }
};

export default MapPage;
