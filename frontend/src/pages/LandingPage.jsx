import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

const LandingPage = () => {
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const isTablet = width <= 1024;

  const [stats, setStats] = useState({ total_tickets: '15M+', total_venues: '1.2k' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3001/stats');
        if (response.ok) {
          const data = await response.json();
          // Use real data, fallback to dummy data if DB returns 0 (since it's a new DB)
          setStats({
            total_tickets: data.total_tickets > 0 ? data.total_tickets : '15M+',
            total_venues: data.total_venues > 0 ? data.total_venues : '1.2k'
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  const dynamicStyles = {
    heroSection: {
      ...styles.heroSection,
      padding: isMobile ? '4rem 1.5rem' : '6rem 2rem',
      minHeight: isMobile ? 'auto' : '800px',
    },
    heroGrid: {
      ...styles.heroGrid,
      display: isMobile ? 'flex' : 'grid',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '2rem' : '3rem',
    },
    heroLeft: {
      ...styles.heroLeft,
      gridColumn: isMobile ? 'span 12' : 'span 6',
      textAlign: isMobile ? 'center' : 'left',
      alignItems: isMobile ? 'center' : 'flex-start',
    },
    heroTitle: {
      ...styles.heroTitle,
      fontSize: isMobile ? '3rem' : '6rem',
    },
    heroDesc: {
      ...styles.heroDesc,
      fontSize: isMobile ? '1.125rem' : '1.5rem',
      margin: isMobile ? '0 auto' : '0',
    },
    ctaRow: {
      ...styles.ctaRow,
      justifyContent: isMobile ? 'center' : 'flex-start',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
    },
    heroRight: {
      ...styles.heroRight,
      gridColumn: isMobile ? 'span 12' : 'span 6',
      marginTop: isMobile ? '2rem' : '0',
    },
    graphicContainer: {
      ...styles.graphicContainer,
      height: isMobile ? '350px' : '600px',
    },
    statsInner: {
      ...styles.statsInner,
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: isMobile ? '1.5rem' : '3rem',
    },
    statNum: {
      ...styles.statNum,
      fontSize: isMobile ? '2rem' : '3.5rem',
    },
    sectionTitle: {
      ...styles.sectionTitle,
      fontSize: isMobile ? '2.5rem' : '3.5rem',
    },
    featureCard: {
      ...styles.featureCard,
      gridColumn: 'span 12',
      flexDirection: 'column',
      padding: isMobile ? '2rem' : '3rem',
    },
    ctaTitle: {
      ...styles.ctaTitle,
      fontSize: isMobile ? '2.5rem' : '5rem',
    },
    ctaSubtitle: {
      ...styles.ctaSubtitle,
      fontSize: isMobile ? '1.125rem' : '1.5rem',
    },
    ctaRowCenter: {
      ...styles.ctaRowCenter,
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: 'center',
    },
    largeCta: {
      ...styles.largeCta,
      width: isMobile ? '100%': 'auto',
      padding: isMobile ? '1.25rem 2rem' : '1.5rem 3.5rem',
    },
    outlineCta: {
      ...styles.outlineCta,
      width: isMobile ? '100%': 'auto',
      padding: isMobile ? '1.25rem 2rem' : '1.5rem 3.5rem',
    }
  };

  return (
    <div style={styles.page}>
      
      {/* Hero Section */}
      <section style={dynamicStyles.heroSection}>
        <div style={dynamicStyles.heroGrid}>
          {/* Left Column */}
          <div style={dynamicStyles.heroLeft}>
            <div className="bg-secondary-container text-on-secondary-container" style={styles.heroPill}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>auto_awesome</span>
              REVOLUTIONIZING WAITING
            </div>
            <h1 className="headline" style={{ ...dynamicStyles.heroTitle, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Logo className={isMobile ? "w-12 h-12" : "w-20 h-20"} />
              <div>Smart <br/><span className="text-gradient">Queue</span></div>
            </h1>
            <p style={dynamicStyles.heroDesc}>
              Take your place in line remotely and save time. Experience the freedom of productive waiting.
            </p>
            <div style={dynamicStyles.ctaRow}>
              <Link to="/services" style={styles.primaryLink}>
                <button className="primary-gradient" style={styles.mainCta}>Get Ticket</button>
              </Link>
              <Link to="/map" style={styles.secondaryLink}>
                <button style={styles.subCta}>Explore Map</button>
              </Link>
            </div>
          </div>

          {/* Right Column */}
          <div style={dynamicStyles.heroRight}>
            <div style={dynamicStyles.graphicContainer}>
              <div style={styles.backdrop}></div>
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNLySv8q5qMiRzT-EsnlvfYTo2wujJxKjxONXs-2E49_dMgIUcp_9jG3F_Waw4Of_--Qpibn_U2F3l_B-Uh7tB-JOq9r_rilRCR9d-HF3FfugJUxBw6wH-6qYVGElJuhGulpdsFBaBnL_5I27xmcM2e81jYsmJyyFz5tCfcAh8gR8ZpPHUMtpo51X6H4LElKdWz4KGqEbF4t8qjEEcsJhtawrwV3wJOpfUAEBZ6Dtt8wzrXoVYTQ_x-XvVAbvF_09iBEAMvSIqWGkI" 
                alt="Digital Queue Management"
                style={styles.heroImg}
              />
              
              {/* Floating Cards - Hidden on very small screens for clarity */}
              {!isMobile && (
                <>
                  <div className="ethereal-blur" style={styles.floatingCardPosition}>
                    <div style={styles.cardHeader}>
                      <div style={styles.iconBox}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--on-tertiary-container)' }}>person</span>
                      </div>
                      <div>
                        <div style={styles.cardSmallLabel}>YOUR POSITION</div>
                        <div style={styles.cardMainValue}>#04</div>
                      </div>
                    </div>
                    <div style={styles.progressBar}>
                      <div className="primary-gradient" style={{ height: '100%', width: '75%', borderRadius: 'inherit' }}></div>
                    </div>
                    <div style={styles.cardWaitText}>Estimated wait: 4 mins</div>
                  </div>

                  <div className="ethereal-blur" style={styles.floatingCardNotify}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>notifications_active</span>
                      <span style={{ fontWeight: '800', color: 'var(--on-surface)' }}>You're next!</span>
                    </div>
                    <p style={styles.notifyDesc}>Please head to Service Point 3 in the main lobby.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-surface-low" style={styles.statsSection}>
        <div style={dynamicStyles.statsInner}>
          <div style={styles.statItem}>
            <div style={{ ...dynamicStyles.statNum, color: 'var(--primary)' }}>{stats.total_tickets}</div>
            <div style={styles.statLabel}>Tickets Issued</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...dynamicStyles.statNum, color: 'var(--secondary)' }}>45%</div>
            <div style={styles.statLabel}>Time Saved</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...dynamicStyles.statNum, color: 'var(--tertiary)' }}>{stats.total_venues}</div>
            <div style={styles.statLabel}>Active Venues</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...dynamicStyles.statNum, color: 'var(--on-surface)' }}>4.9/5</div>
            <div style={styles.statLabel}>User Rating</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <div style={styles.featuresIntro}>
          <h2 className="headline" style={dynamicStyles.sectionTitle}>Effortless Flow</h2>
          <p style={styles.sectionSubtitle}>
            Our platform is designed to eliminate the anxiety of waiting. High-end technology meets intuitive human-centric design.
          </p>
        </div>

        <div className="services-grid">
          {/* Feature 1: Real-time Tracking */}
          <div className="bg-surface-low" style={dynamicStyles.featureCard}>
            <div style={{ maxWidth: '450px', position: 'relative', zIndex: 2 }}>
              <div style={styles.fIconBox}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '2rem' }}>timer</span>
              </div>
              <h3 className="headline" style={styles.fTitle}>Real-Time Precision</h3>
              <p style={styles.fDesc}>
                Watch your position move in real-time. Our predictive algorithms calculate waiting times with 98% accuracy based on current service velocity.
              </p>
            </div>
            {!isMobile && (
              <div style={styles.fGraphicContainer}>
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB218Ro6RUvDpYhwLUcCFDNvPqSx0Ld5d4RQ2tYCTGpQNYifIJmsW0KtYsKoBlYGEOs_iOZdhtY3uSpL_EAiTAM3iOQKsXjr--QBAXnz_vtvaltvAK76YWBDNww60sxOr5age1L-xn98QUb0kdk4xOC2Y-h76-9XtdmYlF4nylV9FVIx8_SpHRjrsadrFxsK0OcPw8rSGdnuuEQADP3ySTlll-b7gbUaeKEhXYLI_paTfqJcXt1bdJ3arSsO8Y5ztuAEuiYb3meEp-g" 
                  alt="Analytics"
                  style={styles.fImg}
                />
              </div>
            )}
          </div>

          {/* Feature 2: Remote Ticketing */}
          <div className="primary-gradient" style={{ ...dynamicStyles.featureCard, color: 'white' }}>
            <div style={{ ...styles.fIconBox, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '2rem' }}>qr_code_2</span>
            </div>
            <h3 className="headline" style={{ ...styles.fTitle, color: 'white' }}>Remote Ticketing</h3>
            <p style={{ ...styles.fDesc, color: 'rgba(255, 255, 255, 0.8)' }}>
              Grab your spot before you even arrive. One tap issues a secured digital token tied to your device.
            </p>
            <div style={styles.sessionMock}>
              <div style={styles.sessionLabel}>ACTIVE SESSION</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700' }}>Main Hospital Lobby</span>
                <span style={styles.liveBadge}>Live</span>
              </div>
            </div>
          </div>

          {/* Feature 3: Notifications */}
          <div className="bg-surface-low" style={{ ...dynamicStyles.featureCard, textAlign: 'center', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...styles.fIconBox, backgroundColor: 'white', width: '64px', height: '64px', borderRadius: '50%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '2.5rem', fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
            </div>
            <h3 className="headline" style={styles.fTitle}>Instant Alerts</h3>
            <p style={styles.fDesc}>
              No more looking at screens. We notify you via push, SMS, or even voice when it's time to be served.
            </p>
          </div>

          {/* Feature 4: Map Integration */}
          <div className="bg-surface-low" style={{ ...dynamicStyles.featureCard, flexDirection: isMobile ? 'column' : 'row', gap: '2.5rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...styles.fIconBox, backgroundColor: 'var(--tertiary-container)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '2rem' }}>map</span>
              </div>
              <h3 className="headline" style={styles.fTitle}>Spatial Discovery</h3>
              <p style={styles.fDesc}>
                Discover services around you with the shortest wait times. Our map integration highlights "Fast Flow" zones in real-time.
              </p>
            </div>
            {!isMobile && (
              <div style={styles.mapPreview}>
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAnXJ92pnwlpZphQmjQnFaOWIMLmnRfZeslxBW7_QUaf55XQnOCgiKzvwfvm400E0tTtxDcL45XrKAxpmRHUzq83eXg9Uhizym6JRE9B2WpqHMvWqdguBi2bu0rhvTztei4bS_k8Jsp747mSkzK7PmftZoYe-JEr3ny-wX--v8wjzNUJvwZuXXf_4zSBQkkTBRpFrpT75B8MTPY06h5GMJt2nMtamK2bQ5OEkf7OV3ShyU8ZzPf_araRU7BjyrGH0AcKYDSTavvaTS" 
                  alt="Map Preview"
                  style={styles.mapImg}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={dynamicStyles.ctaInner}>
          <h2 className="headline" style={dynamicStyles.ctaTitle}>Ready to reclaim <br/>your time?</h2>
          <p style={dynamicStyles.ctaSubtitle}>
            Join thousands of venues and millions of users worldwide who have ended the era of physical waiting lines.
          </p>
          <div style={dynamicStyles.ctaRowCenter}>
            <Link to="/services" style={{ width: isMobile ? '100%' : 'auto' }}>
              <button className="primary-gradient" style={dynamicStyles.largeCta}>Get Ticket Now</button>
            </Link>
            <Link to="/support" style={{ width: isMobile ? '100%' : 'auto' }}>
              <button style={dynamicStyles.outlineCta}>Business Inquiry</button>
            </Link>
          </div>
        </div>
        
        {/* Decorative Blurs */}
        <div style={styles.blurTopLeft}></div>
        <div style={styles.blurBottomRight}></div>
      </section>

    </div>
  );
};

const styles = {
  page: {
    paddingTop: '80px',
    overflowX: 'hidden'
  },
  heroSection: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '6rem 2rem',
    minHeight: '800px',
    display: 'flex',
    alignItems: 'center'
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '3rem',
    alignItems: 'center',
    width: '100%'
  },
  heroLeft: {
    gridColumn: 'span 6',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  heroPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.1em',
    width: 'fit-content'
  },
  heroTitle: {
    fontSize: '6rem',
    fontWeight: '800',
    color: 'var(--on-surface)',
    letterSpacing: '-0.05em',
    lineHeight: '0.9'
  },
  heroDesc: {
    fontSize: '1.5rem',
    color: 'var(--on-surface-variant)',
    lineHeight: '1.6',
    maxWidth: '500px'
  },
  ctaRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem'
  },
  mainCta: {
    padding: '1.25rem 2.5rem',
    borderRadius: '1rem',
    color: 'white',
    fontWeight: '800',
    fontSize: '1.125rem',
    boxShadow: '0 10px 30px rgba(0, 85, 215, 0.2)',
    cursor: 'pointer',
    border: 'none'
  },
  subCta: {
    padding: '1.25rem 2.5rem',
    borderRadius: '1rem',
    backgroundColor: 'var(--surface-container-low)',
    color: 'var(--on-primary-container)',
    fontWeight: '800',
    fontSize: '1.125rem',
    cursor: 'pointer',
    border: 'none'
  },
  heroRight: {
    gridColumn: 'span 6',
    position: 'relative'
  },
  graphicContainer: {
    position: 'relative',
    height: '600px',
    width: '100%'
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(0, 85, 215, 0.1), rgba(116, 47, 229, 0.1))',
    borderRadius: '2rem'
  },
  heroImg: {
    width: '100%',
    height: '100%',
    objectCover: 'cover',
    borderRadius: '2rem',
    mixBlendMode: 'multiply',
    opacity: 0.8
  },
  floatingCardPosition: {
    position: 'absolute',
    left: '-2rem',
    top: '4rem',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '1.5rem',
    borderRadius: '1rem',
    width: '260px',
    boxShadow: '0 20px 40px rgba(13, 52, 89, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.5)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem'
  },
  iconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'var(--tertiary-container)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardSmallLabel: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: 'var(--on-surface-variant)',
    letterSpacing: '0.1em'
  },
  cardMainValue: {
    fontSize: '1.75rem',
    fontWeight: '900',
    color: 'var(--on-surface)'
  },
  progressBar: {
    height: '8px',
    backgroundColor: 'var(--surface-container-high)',
    borderRadius: '9999px',
    marginBottom: '0.5rem',
    overflow: 'hidden'
  },
  cardWaitText: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--primary)'
  },
  floatingCardNotify: {
    position: 'absolute',
    right: '-1rem',
    bottom: '4rem',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '1.5rem',
    borderRadius: '1rem',
    width: '300px',
    boxShadow: '0 20px 40px rgba(13, 52, 89, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.5)'
  },
  notifyDesc: {
    fontSize: '0.75rem',
    color: 'var(--on-surface-variant)',
    marginTop: '0.25rem',
    lineHeight: '1.4'
  },
  statsSection: {
    padding: '6rem 2rem'
  },
  statsInner: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '3rem'
  },
  statItem: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  statNum: {
    fontSize: '3.5rem',
    fontWeight: '900',
    letterSpacing: '-0.02em'
  },
  statLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.15em'
  },
  featuresSection: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '8rem 2rem'
  },
  featuresIntro: {
    textAlign: 'center',
    marginBottom: '5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: '3.5rem',
    fontWeight: '800',
    color: 'var(--on-surface)'
  },
  sectionSubtitle: {
    fontSize: '1.25rem',
    color: 'var(--on-surface-variant)',
    maxWidth: '700px',
    lineHeight: '1.7',
    fontWeight: '500'
  },
  featureCard: {
    borderRadius: '1.5rem',
    padding: '3rem',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  },
  fIconBox: {
    width: '56px',
    height: '56px',
    borderRadius: '1rem',
    backgroundColor: 'rgba(0, 85, 215, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  },
  fTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--on-surface)',
    marginBottom: '1rem'
  },
  fDesc: {
    fontSize: '1rem',
    color: 'var(--on-surface-variant)',
    lineHeight: '1.6'
  },
  fGraphicContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '50%',
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderTopLeftRadius: '4rem',
    overflow: 'hidden'
  },
  fImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.3
  },
  sessionMock: {
    marginTop: '2.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: '1.25rem',
    borderRadius: '1rem',
    backdropFilter: 'blur(8px)'
  },
  sessionLabel: {
    fontSize: '0.65rem',
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: '0.15em',
    marginBottom: '0.5rem'
  },
  liveBadge: {
    fontSize: '0.75rem',
    fontWeight: '900',
    backgroundColor: 'white',
    color: 'var(--primary)',
    padding: '0.2rem 0.6rem',
    borderRadius: '9999px'
  },
  mapPreview: {
    width: '280px',
    height: '200px',
    borderRadius: '1rem',
    overflow: 'hidden',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
  },
  mapImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.4,
    filter: 'grayscale(1)'
  },
  ctaSection: {
    backgroundColor: 'var(--on-surface)',
    padding: '10rem 2rem',
    position: 'relative',
    overflow: 'hidden',
    marginTop: '4rem'
  },
  ctaInner: {
    maxWidth: '900px',
    margin: '0 auto',
    textAlign: 'center',
    position: 'relative',
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  ctaTitle: {
    fontSize: '5rem',
    fontWeight: '900',
    color: 'white',
    lineHeight: '1.1'
  },
  ctaSubtitle: {
    fontSize: '1.5rem',
    color: 'rgba(255, 255, 255, 0.6)',
    maxWidth: '650px',
    margin: '0 auto',
    lineHeight: '1.6'
  },
  ctaRowCenter: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    marginTop: '1rem'
  },
  largeCta: {
    padding: '1.5rem 3.5rem',
    borderRadius: '9999px',
    color: 'white',
    fontWeight: '800',
    fontSize: '1.25rem',
    boxShadow: '0 20px 40px rgba(0, 85, 215, 0.3)',
    cursor: 'pointer',
    border: 'none'
  },
  outlineCta: {
    padding: '1.5rem 3.5rem',
    borderRadius: '9999px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    color: 'white',
    fontWeight: '800',
    fontSize: '1.25rem',
    backgroundColor: 'transparent',
    cursor: 'pointer'
  },
  blurTopLeft: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '400px',
    height: '400px',
    backgroundColor: 'rgba(0, 85, 215, 0.15)',
    borderRadius: '50%',
    filter: 'blur(100px)'
  },
  blurBottomRight: {
    position: 'absolute',
    bottom: '-10%',
    right: '-10%',
    width: '400px',
    height: '400px',
    backgroundColor: 'rgba(116, 47, 229, 0.15)',
    borderRadius: '50%',
    filter: 'blur(100px)'
  }
};

export default LandingPage;
