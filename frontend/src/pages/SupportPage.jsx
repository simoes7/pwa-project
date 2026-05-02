import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

const SupportPage = () => {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [adminRequests, setAdminRequests] = useState([]);
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAdminView(user.role === 'admin');
    }
  }, [user]);

  const fetchAdminRequests = useCallback(async () => {
    if (user?.role !== 'admin') return;
    try {
      const response = await fetch(apiPath(`/support${user.serviceId ? `?serviceId=${user.serviceId}` : ''}`));
      if (response.ok) setAdminRequests(await response.json());
    } catch (err) {
      console.error('Error fetching admin requests:', err);
    }
  }, [user]);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      if (user?.role === 'admin') {
        void fetchAdminRequests();
      }
    }, 0);
    return () => clearTimeout(initialTimer);
  }, [user, fetchAdminRequests]);
  
  const width = useWindowWidth();
  const isMobile = width <= 1024;
  const isSmallMobile = width <= 640;
  
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch(apiPath('/faqs'));
        if (response.ok) {
          const data = await response.json();
          setFaqs(data);
          if (data.length > 0) setActiveFaq(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err);
      }
    };
    fetchFaqs();
  }, []);

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(apiPath('/support'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          serviceId: user?.serviceId || null,
          subject: supportForm.subject,
          message: supportForm.message
        })
      });
      if (response.ok) {
        setSubmitSuccess(true);
        setSupportForm({ subject: '', message: '' });
        setTimeout(() => setSubmitSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error submitting support request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dynamicStyles = {
    heroSection: {
      ...styles.heroSection,
      padding: isSmallMobile ? '3rem 1rem' : isMobile ? '4rem 1.5rem' : '6rem 1.5rem',
    },
    bentoGrid: {
      ...styles.bentoGrid,
      gridTemplateColumns: isSmallMobile ? '1fr' : isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    },
    featuredCard: {
      ...styles.featuredCard,
      gridColumn: isSmallMobile ? 'span 1' : 'span 2',
      padding: isSmallMobile ? '1.5rem' : '2.5rem',
    },
    wideCard: {
      ...styles.wideCard,
      gridColumn: isSmallMobile ? 'span 1' : 'span 2',
      flexDirection: isSmallMobile ? 'column' : 'row',
      alignItems: isSmallMobile ? 'flex-start' : 'center',
    },
    contactGrid: {
      ...styles.contactGrid,
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: isMobile ? '1.5rem' : '2rem',
    },
    bottomNav: {
      ...styles.bottomNav,
      display: isMobile ? 'flex' : 'none',
    }
  };

  return (
    <div style={styles.pageWrap}>
      {isAdminView ? (
        <main style={{ padding: '8rem 2rem 4rem' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 className="headline" style={{ fontSize: '3.5rem', marginBottom: '1rem', letterSpacing: '-0.05em' }}>Support Inbox</h1>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: '3rem', fontSize: '1.125rem' }}>Review and manage incoming technical and service inquiries.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {adminRequests.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--outline-variant)', marginBottom: '1.5rem' }}>inbox</span>
                  <p style={{ fontWeight: '600', color: 'var(--on-surface-variant)' }}>No active requests in your queue.</p>
                </div>
              ) : (
                adminRequests.map(req => (
                  <div key={req.id} className="glass-card" style={{ padding: '2.5rem', borderLeft: '6px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 className="headline" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{req.subject}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--outline)', fontWeight: '600' }}>User ID: #{req.user_id}</p>
                      </div>
                      <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: '700' }}>{new Date(req.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ marginBottom: '2rem', fontSize: '1.125rem', lineHeight: '1.6', color: 'var(--on-surface-variant)' }}>{req.message}</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="primary-gradient" style={{ padding: '0.75rem 1.5rem', borderRadius: '99px', border: 'none', color: 'white', cursor: 'pointer', fontWeight: '700' }}>Reply to User</button>
                      <button style={{ padding: '0.75rem 1.5rem', borderRadius: '99px', border: '1px solid var(--outline)', cursor: 'pointer', fontWeight: '700', backgroundColor: 'transparent' }}>Mark as Resolved</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button 
              style={{ marginTop: '3rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => setIsAdminView(false)}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Switch to Customer Help View
            </button>
          </div>
        </main>
      ) : (
        <main style={styles.main}>
          <section style={dynamicStyles.heroSection}>
            <div style={styles.heroAccents}>
              <div style={styles.accentTop}></div>
              <div style={styles.accentBottom}></div>
            </div>
            
            <div style={styles.heroContent}>
              {user?.role === 'admin' && (
                <button 
                  style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.05)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', padding: '0.5rem 1.25rem', borderRadius: '99px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => setIsAdminView(true)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>admin_panel_settings</span>
                  Go to Support Inbox
                </button>
              )}
              <h1 className="headline" style={styles.heroTitle}>How can we help?</h1>
              
              <div style={styles.searchContainer}>
                <div style={styles.searchBar}>
                  <span className="material-symbols-outlined" style={styles.searchIcon}>search</span>
                  <input 
                    type="text" 
                    placeholder="Search articles, guides, keywords..." 
                    style={styles.searchInput}
                  />
                  {!isSmallMobile && <button className="primary-gradient" style={styles.searchBtn}>Search</button>}
                </div>
              </div>

              <div style={styles.popularTags}>
                <span style={styles.tagLabel}>Popular:</span>
                {['Ticket Reset', 'API Keys', 'Queue Logic'].map(tag => (
                  <Link key={tag} to="#" style={styles.tag}>{tag}</Link>
                ))}
              </div>
            </div>
          </section>

          <section style={styles.gridSection}>
            <div style={dynamicStyles.bentoGrid}>
              <div className="glass-card" style={dynamicStyles.featuredCard}>
                {!isSmallMobile && (
                  <div style={styles.cardAccentIcon}>
                    <span className="material-symbols-outlined" style={{ fontSize: '180px', opacity: 0.05 }}>rocket_launch</span>
                  </div>
                )}
                <div className="primary-gradient" style={styles.iconBoxLarge}>
                  <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '2rem' }}>rocket_launch</span>
                </div>
                <h3 className="headline" style={styles.cardTitleLarge}>Getting Started</h3>
                <p style={styles.cardDescLarge}>New to Smart Queue? Learn how to set up your first queue in under 5 minutes.</p>
                <div style={styles.viewLink}>
                  View 12 Articles <span className="material-symbols-outlined">arrow_forward</span>
                </div>
              </div>

              <div className="glass-card" style={styles.smallCard}>
                <div style={styles.iconBoxSmall}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>confirmation_number</span>
                </div>
                <h3 className="headline" style={styles.cardTitleSmall}>Ticket Management</h3>
                <p style={styles.cardDescSmall}>Handling delays, transfers, and digital ticket issuance.</p>
                <span className="material-symbols-outlined" style={styles.arrowIcon}>arrow_forward</span>
              </div>

              <div className="glass-card" style={styles.smallCard}>
                <div style={styles.iconBoxSmall}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>smartphone</span>
                </div>
                <h3 className="headline" style={styles.cardTitleSmall}>Mobile App</h3>
                <p style={styles.cardDescSmall}>Push notifications and remote queue tracking on iOS & Android.</p>
                <span className="material-symbols-outlined" style={styles.arrowIcon}>arrow_forward</span>
              </div>

              <div className="glass-card" style={dynamicStyles.wideCard}>
                <div style={{ flex: 1 }}>
                  <div style={styles.iconBoxSmall}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>security</span>
                  </div>
                  <h3 className="headline" style={styles.cardTitleSmall}>Account Security</h3>
                  <p style={styles.cardDescSmall}>Managing user roles, 2FA setup, and privacy compliance logs.</p>
                </div>
              </div>

              <div className="glass-card" style={dynamicStyles.wideCard}>
                <div style={{ flex: 1 }}>
                  <div style={styles.iconBoxSmall}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>terminal</span>
                  </div>
                  <h3 className="headline" style={styles.cardTitleSmall}>API Documentation</h3>
                  <p style={styles.cardDescSmall}>Automate your workflow with our developer-first API endpoints.</p>
                </div>
                {!isSmallMobile && <span style={styles.devBadge}>DEVELOPER</span>}
              </div>
            </div>
          </section>

          <section style={styles.faqSection}>
            <div style={styles.faqInner}>
              <div style={styles.sectionHeader}>
                <h2 className="headline" style={styles.sectionTitle}>Frequently Asked Questions</h2>
                <p style={styles.sectionSubtitle}>Quick answers to common questions about the platform.</p>
              </div>

              <div style={styles.accordionWrap}>
                {faqs.map(faq => (
                  <div 
                    key={faq.id} 
                    style={activeFaq === faq.id ? styles.accordionItemActive : styles.accordionItem}
                    onClick={() => setActiveFaq(faq.id)}
                  >
                    <div style={styles.accordionHeader}>
                      <h4 className="headline" style={activeFaq === faq.id ? styles.faqQuestActive : styles.faqQuest}>
                        {faq.question}
                      </h4>
                      <span className="material-symbols-outlined" style={styles.faqIcon}>
                        {activeFaq === faq.id ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                    {activeFaq === faq.id && (
                      <div style={styles.faqAnswer}>{faq.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={styles.contactSection}>
            <div style={styles.sectionHeader}>
              <h2 className="headline" style={styles.sectionTitle}>Still need help?</h2>
            </div>

            <div style={dynamicStyles.contactGrid}>
              <div className="glass-card" style={styles.contactCard}>
                <div style={styles.contactAvatarWrap}>
                  <div style={{ ...styles.avatarIconBox, backgroundColor: 'var(--primary-container)', color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined">chat_bubble</span>
                  </div>
                </div>
                <h3 className="headline" style={styles.cardTitleSmall}>Live Chat</h3>
                <button style={{ ...styles.contactBtn, borderColor: 'var(--primary)', color: 'var(--primary)' }}>Start Chat</button>
              </div>

              <div className="glass-card" style={{ ...styles.contactCard, gridColumn: isMobile ? 'auto' : 'span 2' }}>
                <h3 className="headline" style={styles.cardTitleSmall}>Submit a Request</h3>
                {submitSuccess ? (
                  <div style={{ color: 'var(--primary)', fontWeight: '700', padding: '2rem' }}>
                    Success! We'll get back to you soon.
                  </div>
                ) : (
                  <form onSubmit={handleSupportSubmit} style={styles.supportForm}>
                    <input 
                      type="text" 
                      placeholder="Subject" 
                      required
                      value={supportForm.subject}
                      onChange={e => setSupportForm({...supportForm, subject: e.target.value})}
                      style={styles.formInput} 
                    />
                    <textarea 
                      placeholder="Describe your issue..." 
                      required
                      value={supportForm.message}
                      onChange={e => setSupportForm({...supportForm, message: e.target.value})}
                      style={styles.formTextarea}
                    ></textarea>
                    <button type="submit" disabled={isSubmitting} className="primary-gradient" style={styles.formBtn}>
                      {isSubmitting ? 'Submitting...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

        </main>
      )}
    </div>
  );
};

const styles = {
  pageWrap: {
    minHeight: '100vh',
    backgroundColor: 'var(--background)',
    paddingTop: '80px' // Navbar offset
  },
  main: {
    width: '100%'
  },
  heroSection: {
    position: 'relative',
    padding: '6rem 1.5rem',
    overflow: 'hidden'
  },
  heroAccents: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none'
  },
  accentTop: {
    position: 'absolute',
    top: '-6rem',
    right: '-6rem',
    width: '24rem',
    height: '24rem',
    backgroundColor: 'rgba(0, 85, 215, 0.05)',
    borderRadius: '50%',
    filter: 'blur(100px)'
  },
  accentBottom: {
    position: 'absolute',
    bottom: '0',
    left: '-6rem',
    width: '20rem',
    height: '20rem',
    backgroundColor: 'rgba(116, 47, 229, 0.05)',
    borderRadius: '50%',
    filter: 'blur(100px)'
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '56rem', // max-w-4xl
    margin: '0 auto',
    textAlign: 'center'
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
    fontWeight: '800',
    letterSpacing: '-0.05em',
    marginBottom: '2rem',
    color: 'var(--on-surface)',
    lineHeight: '1'
  },
  searchContainer: {
    maxWidth: '42rem',
    margin: '0 auto'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0.5rem 0.5rem 1.5rem',
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '1.25rem',
    boxShadow: '0 20px 50px rgba(13, 52, 89, 0.08)'
  },
  searchIcon: {
    color: 'var(--outline)',
    fontSize: '1.5rem'
  },
  searchInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    padding: '1rem',
    fontSize: '1.125rem',
    outline: 'none',
    color: 'var(--on-surface)'
  },
  searchBtn: {
    padding: '1rem 2rem',
    borderRadius: '1rem',
    color: 'white',
    fontWeight: '700',
    cursor: 'pointer',
    border: 'none'
  },
  popularTags: {
    marginTop: '2rem',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.75rem'
  },
  tagLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--on-surface-variant)'
  },
  tag: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--primary)',
    backgroundColor: 'var(--surface-container-low)',
    padding: '0.375rem 1rem',
    borderRadius: '9999px',
    textDecoration: 'none',
    transition: 'background-color 0.2s'
  },
  gridSection: {
    maxWidth: '80rem', // max-w-7xl
    margin: '0 auto 8rem',
    padding: '0 2rem'
  },
  bentoGrid: {
    display: 'grid',
    gap: '1.5rem'
  },
  featuredCard: {
    gridColumn: 'span 2',
    padding: '2.5rem',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'var(--surface-container-lowest)'
  },
  cardAccentIcon: {
    position: 'absolute',
    right: '-2rem',
    bottom: '-2rem',
    pointerEvents: 'none'
  },
  iconBoxLarge: {
    width: '4rem',
    height: '4rem',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '2rem',
    boxShadow: '0 8px 16px rgba(0, 85, 215, 0.2)'
  },
  cardTitleLarge: {
    fontSize: '1.5rem',
    fontWeight: '800',
    marginBottom: '0.75rem',
    letterSpacing: '-0.025em'
  },
  cardDescLarge: {
    fontSize: '1rem',
    color: 'var(--on-surface-variant)',
    lineHeight: '1.5',
    maxWidth: '24rem',
    marginBottom: '1.5rem'
  },
  viewLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--primary)',
    fontWeight: '700',
    cursor: 'pointer'
  },
  smallCard: {
    padding: '2rem',
    backgroundColor: 'var(--surface-container-low)',
    display: 'flex',
    flexDirection: 'column'
  },
  iconBoxSmall: {
    width: '3rem',
    height: '3rem',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 8px rgba(13, 52, 89, 0.05)'
  },
  cardTitleSmall: {
    fontSize: '1.25rem',
    fontWeight: '800',
    marginBottom: '0.5rem',
    letterSpacing: '-0.01em'
  },
  cardDescSmall: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)',
    lineHeight: '1.4',
    flex: 1,
    marginBottom: '1.5rem'
  },
  arrowIcon: {
    color: 'var(--outline-variant)',
    fontSize: '1.25rem'
  },
  wideCard: {
    gridColumn: 'span 2',
    padding: '2rem',
    backgroundColor: 'var(--surface-container-low)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  illustrationWrap: {
    width: '8rem',
    height: '8rem',
    opacity: 0.2,
    borderRadius: '0.75rem',
    overflow: 'hidden'
  },
  illustration: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'grayscale(1)'
  },
  devBadge: {
    fontSize: '0.625rem',
    fontWeight: '900',
    letterSpacing: '0.2em',
    color: 'var(--primary)',
    backgroundColor: 'rgba(0, 85, 215, 0.1)',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px'
  },
  faqSection: {
    backgroundColor: 'var(--surface-container-low)',
    padding: '8rem 2rem'
  },
  faqInner: {
    maxWidth: '56rem', // max-w-4xl
    margin: '0 auto'
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '4rem'
  },
  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    letterSpacing: '-0.025em',
    marginBottom: '1rem'
  },
  sectionSubtitle: {
    fontSize: '1.125rem',
    color: 'var(--on-surface-variant)',
    fontWeight: '500'
  },
  accordionWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  accordionItem: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '1rem',
    padding: '1.5rem',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(13, 52, 89, 0.02)',
    transition: 'all 0.3s'
  },
  accordionItemActive: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '1rem',
    padding: '1.5rem',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(13, 52, 89, 0.08)',
    transition: 'all 0.3s'
  },
  accordionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  faqQuest: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--on-surface)'
  },
  faqQuestActive: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--primary)'
  },
  faqIcon: {
    color: 'var(--primary)'
  },
  faqAnswer: {
    marginTop: '1.5rem',
    fontSize: '1rem',
    color: 'var(--on-surface-variant)',
    lineHeight: '1.6'
  },
  allFaqsBtnWrap: {
    marginTop: '3rem',
    textAlign: 'center'
  },
  allFaqsBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    margin: '0 auto',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  contactSection: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '8rem 2rem'
  },
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem'
  },
  contactCard: {
    padding: '2.5rem',
    textAlign: 'center',
    backgroundColor: 'var(--surface-container-lowest)',
    boxShadow: '0 20px 40px rgba(13, 52, 89, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '380px'
  },
  supportForm: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1.5rem'
  },
  formInput: {
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--outline-variant)',
    backgroundColor: 'var(--surface-container-lowest)',
    color: 'var(--on-surface)',
    fontSize: '1rem'
  },
  formTextarea: {
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--outline-variant)',
    backgroundColor: 'var(--surface-container-lowest)',
    color: 'var(--on-surface)',
    fontSize: '1rem',
    minHeight: '120px',
    resize: 'vertical'
  },
  formBtn: {
    padding: '1rem',
    borderRadius: '0.75rem',
    color: 'white',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    marginTop: '1rem'
  },
  contactAvatarWrap: {
    position: 'relative',
    width: '5rem',
    height: '5rem',
    margin: '0 auto 1.5rem',
    flexShrink: 0
  },
  avatarIconBox: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusDot: {
    position: 'absolute',
    bottom: '0.25rem',
    right: '0.25rem',
    width: '1.25rem',
    height: '1.25rem',
    backgroundColor: 'var(--tertiary)',
    borderRadius: '50%',
    border: '3px solid white'
  },
  cardDescriptionArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  },
  contactMeta: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)',
    lineHeight: '1.5'
  },
  contactBtn: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '9999px',
    backgroundColor: 'white',
    border: '2px solid',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: 'auto'
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: '5rem',
    backgroundColor: 'white',
    borderTop: '1px solid var(--surface-container-low)',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '1rem 2rem',
    zIndex: 50
  },
  navItemInactive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    color: '#94a3b8'
  },
  navItemActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    color: 'var(--primary)',
    marginTop: '-1.5rem'
  },
  activeIconCircle: {
     width: '3.5rem',
     height: '3.5rem',
     backgroundColor: 'var(--primary)',
     color: 'white',
     borderRadius: '50%',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     boxShadow: '0 8px 20px rgba(0, 85, 215, 0.3)',
     border: '4px solid white'
  },
  navText: {
    fontSize: '0.625rem',
    fontWeight: '800',
    textTransform: 'uppercase'
  }
};

export default SupportPage;
