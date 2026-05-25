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

const helpArticles = {
  getting_started: {
    icon: 'rocket_launch',
    color: 'var(--primary)',
    bg: 'rgba(0, 85, 215, 0.05)',
    title: 'Getting Started',
    desc: 'New to Smart Queue? Learn how to set up and join your first queue in under 5 minutes.',
    articles: [
      { title: "What is Smart Queue?", content: "Smart Queue is a digital queuing platform designed to help you join physical service lines remotely, track your wait time in real-time, and get notified when it is your turn." },
      { title: "How to join a queue remotely?", content: "Simply go to the Available Services page, find the service point you need, and click 'Join Queue'. A digital ticket will be generated for you instantly. You can track your real-time position directly from your dashboard." },
      { title: "Is it free to use?", content: "Yes! Smart Queue is completely free for customers. Services points subscribe to our platform to manage their waiting lines efficiently." }
    ]
  },
  tickets: {
    icon: 'confirmation_number',
    color: 'var(--secondary)',
    bg: 'rgba(116, 47, 229, 0.05)',
    title: 'Ticket Management',
    desc: 'Handling delays, transfers, and remote ticket status changes.',
    articles: [
      { title: "Can I pause my ticket?", content: "Yes! If you are running late or need a break, you can pause your ticket from the active ticket page. This temporarily holds your spot and lets other users pass ahead of you until you resume." },
      { title: "What is the grace period?", content: "Once your ticket is called, you have a 5-minute grace period to show up at the counter. If you do not arrive in time, your ticket will be marked as a no-show and cancelled." },
      { title: "Can I cancel my ticket?", content: "Yes, you can cancel your active ticket at any time if you change your mind. This frees up the slot immediately for other customers waiting in line." }
    ]
  },
  mobile: {
    icon: 'smartphone',
    color: 'var(--tertiary)',
    bg: 'rgba(235, 94, 40, 0.05)',
    title: 'Mobile & Tracking',
    desc: 'Push notifications and remote queue tracking on iOS & Android.',
    articles: [
      { title: "Do I need the app for notifications?", content: "No! While we have a progressive web app (PWA), our platform supports standard web push notifications and SMS alerts directly through your web browser." },
      { title: "How to enable location services?", content: "To view nearby service points and get accurate directions on the map, ensure you grant location permissions to your browser or device when prompted." }
    ]
  },
  security: {
    icon: 'security',
    color: 'var(--error)',
    bg: 'rgba(172, 49, 73, 0.05)',
    title: 'Account Security',
    desc: 'Managing user roles, 2FA setup, and privacy compliance.',
    articles: [
      { title: "How is my data protected?", content: "We use standard TLS encryption for all transit data and secure hashing algorithms for passwords. Your location data is processed locally in the browser to calculate distance and is never stored permanently on our servers." },
      { title: "How do I reset my password?", content: "Navigate to your Profile Settings, find the password reset section, enter your current password, and choose a new secure password." }
    ]
  }
};

const SupportPage = () => {
  const { user } = useAuth();
  const width = useWindowWidth();
  const isMobile = width <= 1024;
  const isSmallMobile = width <= 640;

  // Tabs: 'faq' | 'tickets' | 'admin'
  const [activeTab, setActiveTab] = useState('faq');
  const [faqs, setFaqs] = useState([]);
  const [activeFaq, setActiveFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create ticket form
  const [supportForm, setSupportForm] = useState({ subject: '', message: '', category: 'General Inquiry' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // User tickets history
  const [userRequests, setUserRequests] = useState([]);
  const [loadingUserRequests, setLoadingUserRequests] = useState(false);

  // Admin view
  const [adminRequests, setAdminRequests] = useState([]);
  const [replyText, setReplyText] = useState({}); // requestId -> text
  const [replyingTo, setReplyingTo] = useState(null); // active requestId to reply

  // Modal / Drawer article view
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Fetch FAQ from backend
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

  // Fetch User's support tickets
  const fetchUserRequests = useCallback(async () => {
    if (!user) return;
    setLoadingUserRequests(true);
    try {
      const response = await fetch(apiPath(`/support/user/${user.id}`));
      if (response.ok) {
        const data = await response.json();
        setUserRequests(data);
      }
    } catch (err) {
      console.error('Error fetching user requests:', err);
    } finally {
      setLoadingUserRequests(false);
    }
  }, [user]);

  // Fetch Admin's inbox tickets
  const fetchAdminRequests = useCallback(async () => {
    if (user?.role !== 'admin') return;
    try {
      const response = await fetch(apiPath(`/support${user.serviceId ? `?serviceId=${user.serviceId}` : ''}`));
      if (response.ok) {
        const data = await response.json();
        setAdminRequests(data);
      }
    } catch (err) {
      console.error('Error fetching admin requests:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void fetchUserRequests();
      if (user.role === 'admin') {
        void fetchAdminRequests();
      }
    }
  }, [user, fetchUserRequests, fetchAdminRequests]);

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportForm.subject.trim() || !supportForm.message.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(apiPath('/support'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          serviceId: user?.serviceId || null,
          subject: supportForm.subject,
          message: supportForm.message,
          category: supportForm.category
        })
      });
      if (response.ok) {
        setSubmitSuccess(true);
        setSupportForm({ subject: '', message: '', category: 'General Inquiry' });
        void fetchUserRequests(); // refresh list
        setTimeout(() => setSubmitSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error submitting support request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (reqId) => {
    const text = replyText[reqId];
    if (!text || !text.trim()) return;

    try {
      const response = await fetch(apiPath(`/support/${reqId}/reply`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: text })
      });
      if (response.ok) {
        setReplyText(prev => ({ ...prev, [reqId]: '' }));
        setReplyingTo(null);
        void fetchAdminRequests();
        void fetchUserRequests(); // update user list in case user is also viewer
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  const handleResolve = async (reqId) => {
    try {
      const response = await fetch(apiPath(`/support/${reqId}/resolve`), {
        method: 'PUT'
      });
      if (response.ok) {
        void fetchAdminRequests();
        void fetchUserRequests();
      }
    } catch (err) {
      console.error('Error resolving request:', err);
    }
  };

  // Search filter
  const filteredArticles = Object.entries(helpArticles).flatMap(([catKey, catValue]) => {
    return catValue.articles
      .filter(art => 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        art.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(art => ({ ...art, category: catValue.title, icon: catValue.icon, color: catValue.color }));
  });

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.pageWrap}>
      <main style={styles.main}>
        
        {/* Hero Section */}
        <section style={{
          ...styles.heroSection,
          padding: isSmallMobile ? '3rem 1rem' : isMobile ? '4rem 1.5rem' : '5rem 1.5rem',
        }}>
          <div style={styles.heroAccents}>
            <div style={styles.accentTop}></div>
            <div style={styles.accentBottom}></div>
          </div>
          
          <div style={styles.heroContent}>
            <h1 className="headline" style={styles.heroTitle}>How can we help?</h1>
            <p style={styles.heroSubtitle}>Search our support guide, submit an inquiry, or review active tickets.</p>
            
            <div style={styles.searchContainer}>
              <div style={styles.searchBar}>
                <span className="material-symbols-outlined" style={styles.searchIcon}>search</span>
                <input 
                  type="text" 
                  placeholder="Search questions, articles, guides..." 
                  style={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', marginRight: '0.5rem', color: 'var(--outline)' }}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
            </div>

            {searchQuery && (
              <div style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem' }}>
                Showing results for "{searchQuery}"
              </div>
            )}
          </div>
        </section>

        {/* Tab Navigation */}
        <div style={styles.tabNavContainer}>
          <div style={styles.tabBar}>
            <button 
              style={{ ...styles.tabButton, ...(activeTab === 'faq' ? styles.tabButtonActive : {}) }}
              onClick={() => setActiveTab('faq')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
              Help Center & Guides
            </button>
            <button 
              style={{ ...styles.tabButton, ...(activeTab === 'tickets' ? styles.tabButtonActive : {}) }}
              onClick={() => setActiveTab('tickets')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat_bubble</span>
              Support Tickets {userRequests.length > 0 && `(${userRequests.length})`}
            </button>
            {user?.role === 'admin' && (
              <button 
                style={{ ...styles.tabButton, ...(activeTab === 'admin' ? styles.tabButtonActive : {}), color: 'var(--primary)' }}
                onClick={() => setActiveTab('admin')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>admin_panel_settings</span>
                Support Inbox {adminRequests.filter(r => r.status !== 'resolved').length > 0 && `(${adminRequests.filter(r => r.status !== 'resolved').length})`}
              </button>
            )}
          </div>
        </div>

        {/* Search Results Override */}
        {searchQuery ? (
          <section style={styles.sectionWrap}>
            <h2 className="headline" style={{ ...styles.sectionTitle, textAlign: 'left', marginBottom: '2rem' }}>Search Results</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
              
              {/* Articles matching */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 className="headline" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>menu_book</span>
                  Matching Articles ({filteredArticles.length})
                </h3>
                {filteredArticles.length === 0 ? (
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>No articles found matching search criteria.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredArticles.map((art, idx) => (
                      <div 
                        key={idx} 
                        className="hover-card-bg"
                        style={styles.searchResultItem}
                        onClick={() => setSelectedArticle(art)}
                      >
                        <span className="material-symbols-outlined" style={{ color: art.color, fontSize: '20px' }}>{art.icon}</span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontWeight: '700', fontSize: '0.95rem', margin: '0 0 0.25rem 0', color: 'var(--on-surface)' }}>{art.title}</h4>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--outline)', textTransform: 'uppercase' }}>{art.category}</span>
                        </div>
                        <span className="material-symbols-outlined" style={{ color: 'var(--outline-variant)' }}>arrow_forward</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FAQs matching */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 className="headline" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>quiz</span>
                  Matching FAQs ({filteredFaqs.length})
                </h3>
                {filteredFaqs.length === 0 ? (
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>No FAQs found matching search criteria.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredFaqs.map((faq) => (
                      <div 
                        key={faq.id} 
                        style={{
                          backgroundColor: 'var(--surface-container-low)',
                          padding: '1.25rem',
                          borderRadius: '1rem',
                          border: activeFaq === faq.id ? '2px solid var(--secondary)' : '1px solid var(--outline-variant)'
                        }}
                        onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                          <h4 style={{ fontWeight: '700', margin: 0, fontSize: '0.95rem', color: activeFaq === faq.id ? 'var(--secondary)' : 'var(--on-surface)' }}>{faq.question}</h4>
                          <span className="material-symbols-outlined">{activeFaq === faq.id ? 'expand_less' : 'expand_more'}</span>
                        </div>
                        {activeFaq === faq.id && (
                          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: '1.6', margin: '0.75rem 0 0 0' }}>{faq.answer}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </section>
        ) : (
          <>
            {/* Tab 1: Help Center & Guides */}
            {activeTab === 'faq' && (
              <>
                {/* Bento Grid Categories */}
                <section style={styles.gridSection}>
                  <div style={{
                    ...styles.bentoGrid,
                    gridTemplateColumns: isSmallMobile ? '1fr' : 'repeat(2, 1fr)',
                  }}>
                    {Object.entries(helpArticles).map(([key, cat]) => (
                      <div 
                        key={key} 
                        className="help-card" 
                        style={{
                          '--card-color': cat.color,
                          '--card-hover-border': cat.color
                        }}
                      >
                        <div className="help-icon-box" style={{ backgroundColor: cat.color }}>
                          <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '1.5rem' }}>{cat.icon}</span>
                        </div>
                        <h3 className="headline" style={styles.cardTitleSmall}>{cat.title}</h3>
                        <p style={styles.cardDescSmall}>{cat.desc}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', width: '100%' }}>
                          {cat.articles.slice(0, 2).map((art, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => setSelectedArticle({ ...art, category: cat.title, icon: cat.icon, color: cat.color })}
                              className="help-article-link"
                              style={{ '--card-hover-border': cat.color }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: cat.color }}>article</span>
                                <span>{art.title}</span>
                              </span>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--outline-variant)' }}>chevron_right</span>
                            </button>
                          ))}
                        </div>
                        <button 
                          className="text-gradient" 
                          onClick={() => setSelectedArticle({ title: `${cat.title} Guides`, content: "", list: cat.articles, category: cat.title, icon: cat.icon, color: cat.color })}
                          style={styles.viewAllBtn}
                        >
                          View all articles <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Frequently Asked Questions */}
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
                          onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
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
              </>
            )}

            {/* Tab 2: Support Tickets */}
            {activeTab === 'tickets' && (
              <section style={styles.sectionWrap}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.25fr', gap: '3rem', alignItems: 'start' }}>
                  
                  {/* Submit Inquiry */}
                  <div className="glass-card" style={{ padding: '2.5rem' }}>
                    <h3 className="headline" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Submit a Ticket</h3>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                      Can't find what you need? Send a message directly to our admin panel.
                    </p>

                    {submitSuccess ? (
                      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--primary)', background: 'rgba(0, 85, 215, 0.05)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}>check_circle</span>
                        <h4 style={{ fontWeight: '800', marginBottom: '0.5rem' }}>Ticket Created Successfully</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>We will review your inquiry and reply as soon as possible.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSupportSubmit} style={styles.supportForm}>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Inquiry Category</label>
                          <select 
                            value={supportForm.category}
                            onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                            style={styles.formSelect}
                          >
                            <option>General Inquiry</option>
                            <option>Ticket & Queueing Issue</option>
                            <option>Account & Profile Settings</option>
                            <option>Developer & API Keys</option>
                            <option>Feedback & Suggestions</option>
                          </select>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Subject</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Queue number reset error" 
                            required
                            value={supportForm.subject}
                            onChange={e => setSupportForm({...supportForm, subject: e.target.value})}
                            style={styles.formInput} 
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Description</label>
                          <textarea 
                            placeholder="Provide details about your query or issue..." 
                            required
                            value={supportForm.message}
                            onChange={e => setSupportForm({...supportForm, message: e.target.value})}
                            style={styles.formTextarea}
                          ></textarea>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="primary-gradient" style={styles.formBtn}>
                          {isSubmitting ? 'Creating Ticket...' : 'Submit Inquiry'}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Tickets History */}
                  <div>
                    <h3 className="headline" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>history</span>
                      My Support History
                    </h3>
                    
                    {!user ? (
                      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--outline-variant)', marginBottom: '1rem' }}>login</span>
                        <h4 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Please Sign In</h4>
                        <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>You must be logged in to view your support tickets history.</p>
                        <Link to="/login" className="primary-gradient" style={{ ...styles.formBtn, padding: '0.75rem 2rem', textDecoration: 'none', display: 'inline-block' }}>Log In</Link>
                      </div>
                    ) : loadingUserRequests ? (
                      <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--outline)', fontWeight: '700' }}>Loading tickets...</p>
                      </div>
                    ) : userRequests.length === 0 ? (
                      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--outline-variant)', marginBottom: '1rem' }}>drafts</span>
                        <h4 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No Support Tickets Yet</h4>
                        <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>Any inquiries you submit will be displayed here in real-time.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {userRequests.map(req => (
                          <div key={req.id} className="glass-card" style={{ padding: '1.5rem', borderLeft: `5px solid ${req.status === 'resolved' ? 'var(--outline)' : req.status === 'replied' ? 'var(--primary)' : 'var(--secondary)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--outline)', textTransform: 'uppercase' }}>{req.category || 'General'}</span>
                                <h4 style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--on-surface)', marginTop: '0.25rem' }}>{req.subject}</h4>
                              </div>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '900', 
                                padding: '0.25rem 0.75rem', 
                                borderRadius: '99px',
                                textTransform: 'uppercase',
                                backgroundColor: req.status === 'resolved' ? 'var(--surface-container-high)' : req.status === 'replied' ? 'rgba(0, 85, 215, 0.1)' : 'rgba(116, 47, 229, 0.1)',
                                color: req.status === 'resolved' ? 'var(--outline)' : req.status === 'replied' ? 'var(--primary)' : 'var(--secondary)'
                              }}>
                                {req.status}
                              </span>
                            </div>
                            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{req.message}</p>
                            
                            {/* Admin Reply */}
                            {req.admin_reply && (
                              <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '1rem 1.25rem', borderRadius: '0.75rem', marginTop: '1rem', border: '1px solid var(--outline-variant)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>support_agent</span>
                                    Support Agent Reply
                                  </span>
                                  {req.reply_at && <span style={{ fontSize: '0.7rem', color: 'var(--outline)' }}>{new Date(req.reply_at).toLocaleString()}</span>}
                                </div>
                                <p style={{ color: 'var(--on-surface)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' }}>{req.admin_reply}</p>
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Submitted: {new Date(req.created_at).toLocaleDateString()}</span>
                              {req.status !== 'resolved' && (
                                <button 
                                  onClick={() => handleResolve(req.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                                  Mark as Resolved
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </section>
            )}

            {/* Tab 3: Admin Support Inbox */}
            {activeTab === 'admin' && user?.role === 'admin' && (
              <section style={styles.sectionWrap}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                  <h3 className="headline" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Support Inbox</h3>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', marginBottom: '2.5rem' }}>
                    Manage and respond to customer technical questions and system feedback.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {adminRequests.length === 0 ? (
                      <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--outline-variant)', marginBottom: '1.5rem' }}>inbox</span>
                        <p style={{ fontWeight: '700', color: 'var(--on-surface-variant)' }}>No active support requests found.</p>
                      </div>
                    ) : (
                      adminRequests.map(req => (
                        <div key={req.id} className="glass-card" style={{ padding: '2rem', borderLeft: `6px solid ${req.status === 'resolved' ? 'var(--outline)' : req.status === 'replied' ? 'var(--primary)' : 'var(--secondary)'}` }}>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--outline)', textTransform: 'uppercase' }}>{req.category || 'General'}</span>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--outline-variant)' }}></span>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--outline)' }}>ID: #{req.id}</span>
                              </div>
                              <h4 style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--on-surface)', margin: 0 }}>{req.subject}</h4>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '900', 
                                padding: '0.25rem 0.75rem', 
                                borderRadius: '99px',
                                textTransform: 'uppercase',
                                backgroundColor: req.status === 'resolved' ? 'var(--surface-container-high)' : req.status === 'replied' ? 'rgba(0, 85, 215, 0.1)' : 'rgba(116, 47, 229, 0.1)',
                                color: req.status === 'resolved' ? 'var(--outline)' : req.status === 'replied' ? 'var(--primary)' : 'var(--secondary)'
                              }}>
                                {req.status}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{new Date(req.created_at).toLocaleString()}</span>
                            </div>
                          </div>

                          <div style={{ backgroundColor: 'var(--surface-container-lowest)', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.5rem', border: '1px solid var(--outline-variant)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--outline)', fontWeight: '700' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                              Submitted by: {req.user_name || 'Guest User'} ({req.user_email || 'No email'})
                            </div>
                            <p style={{ color: 'var(--on-surface-variant)', fontSize: '1rem', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>{req.message}</p>
                          </div>

                          {/* Existing reply block */}
                          {req.admin_reply && (
                            <div style={{ backgroundColor: 'rgba(0,85,215,0.03)', padding: '1rem 1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px dashed var(--primary-container)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                <span style={{ fontWeight: '800', color: 'var(--primary)' }}>My Staff Reply</span>
                                {req.reply_at && <span style={{ color: 'var(--outline)' }}>{new Date(req.reply_at).toLocaleString()}</span>}
                              </div>
                              <p style={{ color: 'var(--on-surface)', fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap' }}>{req.admin_reply}</p>
                            </div>
                          )}

                          {/* Action panel */}
                          <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem' }}>
                            {req.status !== 'resolved' && replyingTo !== req.id && (
                              <button 
                                className="primary-gradient" 
                                onClick={() => setReplyingTo(req.id)}
                                style={{ ...styles.formBtn, marginTop: 0, padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '0.25rem' }}>reply</span>
                                Reply
                              </button>
                            )}

                            {req.status !== 'resolved' && (
                              <button 
                                onClick={() => handleResolve(req.id)}
                                style={{ backgroundColor: 'transparent', border: '1px solid var(--outline)', borderRadius: '0.75rem', padding: '0.5rem 1.5rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>

                          {/* Reply Form Overlay */}
                          {replyingTo === req.id && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem 0 0 0', borderTop: '1px dashed var(--outline-variant)' }}>
                              <textarea 
                                placeholder="Type your reply here..." 
                                style={{ ...styles.formTextarea, minHeight: '80px', marginBottom: '0.75rem' }}
                                value={replyText[req.id] || ''}
                                onChange={(e) => setReplyText({ ...replyText, [req.id]: e.target.value })}
                              ></textarea>
                              <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button 
                                  onClick={() => handleSendReply(req.id)}
                                  className="primary-gradient"
                                  style={{ ...styles.formBtn, marginTop: 0, padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                                >
                                  Submit Reply
                                </button>
                                <button 
                                  onClick={() => setReplyingTo(null)}
                                  style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--outline)', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

      </main>

      {/* Article Detail Modal / Lightbox */}
      {selectedArticle && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={{
            ...styles.modalContainer,
            maxWidth: isMobile ? '95%' : '600px',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ ...styles.iconBoxSmall, backgroundColor: selectedArticle.color, marginBottom: 0, width: '2.5rem', height: '2.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '1.25rem' }}>{selectedArticle.icon}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--outline)', textTransform: 'uppercase' }}>{selectedArticle.category}</span>
                  <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.15rem' }}>{selectedArticle.title}</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedArticle(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem', color: 'var(--on-surface)' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* List of articles or single article */}
            {selectedArticle.list ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {selectedArticle.list.map((art, idx) => (
                  <div key={idx} style={{ borderBottom: idx < selectedArticle.list.length - 1 ? '1px solid var(--surface-container-low)' : 'none', paddingBottom: '1.5rem' }}>
                    <h4 style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--on-surface)', margin: '0 0 0.5rem 0' }}>{art.title}</h4>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>{art.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '1rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
                {selectedArticle.content}
              </p>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem' }}>
              <button 
                onClick={() => setSelectedArticle(null)}
                className="primary-gradient" 
                style={{ ...styles.formBtn, marginTop: 0, padding: '0.5rem 2rem' }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
  pageWrap: {
    minHeight: '100vh',
    backgroundColor: 'var(--background)',
    paddingTop: '80px',
    paddingBottom: '4rem'
  },
  main: {
    width: '100%'
  },
  heroSection: {
    position: 'relative',
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
    backgroundColor: 'rgba(0, 85, 215, 0.04)',
    borderRadius: '50%',
    filter: 'blur(100px)'
  },
  accentBottom: {
    position: 'absolute',
    bottom: '0',
    left: '-6rem',
    width: '20rem',
    height: '20rem',
    backgroundColor: 'rgba(116, 47, 229, 0.04)',
    borderRadius: '50%',
    filter: 'blur(100px)'
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '56rem',
    margin: '0 auto',
    textAlign: 'center'
  },
  heroTitle: {
    fontSize: 'clamp(2.25rem, 6vw, 3.5rem)',
    fontWeight: '900',
    letterSpacing: '-0.04em',
    marginBottom: '1rem',
    color: 'var(--on-surface)',
    lineHeight: '1.1'
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 3vw, 1.15rem)',
    color: 'var(--on-surface-variant)',
    marginBottom: '2rem',
    fontWeight: '400'
  },
  searchContainer: {
    maxWidth: '38rem',
    margin: '0 auto'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.25rem 0.5rem 0.25rem 1.25rem',
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '1.25rem',
    border: '1px solid var(--outline-variant)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)'
  },
  searchIcon: {
    color: 'var(--outline)',
    fontSize: '1.35rem'
  },
  searchInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    padding: '0.85rem 1rem',
    fontSize: '1rem',
    outline: 'none',
    color: 'var(--on-surface)'
  },
  tabNavContainer: {
    display: 'flex',
    justifyContent: 'center',
    margin: '2rem 0 3rem 0',
    padding: '0 1.5rem'
  },
  tabBar: {
    display: 'flex',
    backgroundColor: 'var(--surface-container-high)',
    padding: '0.35rem',
    borderRadius: '1rem',
    gap: '0.25rem'
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    border: 'none',
    backgroundColor: 'transparent',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s'
  },
  tabButtonActive: {
    backgroundColor: 'var(--surface-container-lowest)',
    color: 'var(--on-surface)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  sectionWrap: {
    maxWidth: '80rem',
    margin: '0 auto 4rem',
    padding: '0 2rem'
  },
  gridSection: {
    maxWidth: '80rem',
    margin: '0 auto 4rem',
    padding: '0 2rem'
  },
  bentoGrid: {
    display: 'grid',
    gap: '1.5rem'
  },
  smallCard: {
    padding: '2rem',
    borderRadius: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid var(--outline-variant)'
  },
  iconBoxSmall: {
    width: '2.75rem',
    height: '2.75rem',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  },
  cardTitleSmall: {
    fontSize: '1.25rem',
    fontWeight: '800',
    marginBottom: '0.5rem',
    color: 'var(--on-surface)'
  },
  cardDescSmall: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)',
    lineHeight: '1.5',
    flex: 1,
    marginBottom: '1.5rem'
  },
  inlineArticleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--outline-variant)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.8rem',
    textAlign: 'left',
    color: 'var(--on-surface)'
  },
  viewAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem 0',
    backgroundColor: 'transparent',
    border: 'none',
    fontWeight: '800',
    cursor: 'pointer',
    marginTop: '1.5rem',
    fontSize: '0.85rem'
  },
  faqSection: {
    backgroundColor: 'var(--surface-container-low)',
    padding: '5rem 2rem',
    borderRadius: '2rem',
    maxWidth: '80rem',
    margin: '2rem auto 4rem'
  },
  faqInner: {
    maxWidth: '52rem',
    margin: '0 auto'
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    marginBottom: '0.5rem',
    color: 'var(--on-surface)'
  },
  sectionSubtitle: {
    fontSize: '1rem',
    color: 'var(--on-surface-variant)',
    fontWeight: '500'
  },
  accordionWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  accordionItem: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '1rem',
    padding: '1.25rem 1.5rem',
    cursor: 'pointer',
    border: '1px solid var(--outline-variant)',
    transition: 'all 0.2s'
  },
  accordionItemActive: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '1rem',
    padding: '1.25rem 1.5rem',
    cursor: 'pointer',
    border: '2px solid var(--primary)',
    boxShadow: '0 8px 24px rgba(0, 85, 215, 0.05)',
    transition: 'all 0.2s'
  },
  accordionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  faqQuest: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--on-surface)',
    margin: 0
  },
  faqQuestActive: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--primary)',
    margin: 0
  },
  faqIcon: {
    color: 'var(--primary)'
  },
  faqAnswer: {
    marginTop: '1rem',
    fontSize: '0.925rem',
    color: 'var(--on-surface-variant)',
    lineHeight: '1.6',
    borderTop: '1px solid var(--outline-variant)',
    paddingTop: '1rem'
  },
  supportForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  },
  formLabel: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: 'var(--outline)',
    textTransform: 'uppercase'
  },
  formSelect: {
    padding: '0.85rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--outline-variant)',
    backgroundColor: 'var(--surface-container-lowest)',
    color: 'var(--on-surface)',
    fontSize: '0.95rem',
    fontWeight: '600'
  },
  formInput: {
    padding: '0.85rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--outline-variant)',
    backgroundColor: 'var(--surface-container-lowest)',
    color: 'var(--on-surface)',
    fontSize: '0.95rem'
  },
  formTextarea: {
    padding: '0.85rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--outline-variant)',
    backgroundColor: 'var(--surface-container-lowest)',
    color: 'var(--on-surface)',
    fontSize: '0.95rem',
    minHeight: '120px',
    resize: 'vertical'
  },
  formBtn: {
    padding: '0.95rem',
    borderRadius: '0.75rem',
    color: 'white',
    fontWeight: '800',
    border: 'none',
    cursor: 'pointer',
    marginTop: '0.5rem',
    fontSize: '0.95rem',
    textAlign: 'center'
  },
  searchResultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--outline-variant)',
    backgroundColor: 'var(--surface-container-lowest)',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modalContainer: {
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '1.5rem',
    padding: '2rem',
    width: '100%',
    boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
    border: '1px solid var(--outline-variant)'
  }
};

export default SupportPage;
