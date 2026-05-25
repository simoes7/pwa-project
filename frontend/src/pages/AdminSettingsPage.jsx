import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopBar from '../components/AdminTopBar';
import { apiPath, adminHeaders } from '../config';




const AdminSettingsPage = () => {
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('general');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [serviceCategory, setServiceCategory] = useState('Healthcare');

  // New persistent states
  const [businessName, setBusinessName] = useState('Smart Queue');
  const [gracePeriod, setGracePeriod] = useState(10);
  const [maxCapacity, setMaxCapacity] = useState(100);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(10);
  const [isOpen, setIsOpen] = useState(true);
  const [isFastTrackAvailable, setIsFastTrackAvailable] = useState(false);

  // Geographic and Branding states
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [website, setWebsite] = useState('');



  const defaultSchedule = [
    { day_of_week: 1, morning_open: '08:00', morning_close: '12:00', afternoon_open: '14:00', afternoon_close: '18:00', is_closed: false },
    { day_of_week: 2, morning_open: '08:00', morning_close: '12:00', afternoon_open: '14:00', afternoon_close: '18:00', is_closed: false },
    { day_of_week: 3, morning_open: '08:00', morning_close: '12:00', afternoon_open: '14:00', afternoon_close: '18:00', is_closed: false },
    { day_of_week: 4, morning_open: '08:00', morning_close: '12:00', afternoon_open: '14:00', afternoon_close: '18:00', is_closed: false },
    { day_of_week: 5, morning_open: '08:00', morning_close: '12:00', afternoon_open: '14:00', afternoon_close: '18:00', is_closed: false },
    { day_of_week: 6, morning_open: '09:00', morning_close: '14:00', afternoon_open: '', afternoon_close: '', is_closed: false },
    { day_of_week: 7, morning_open: '', morning_close: '', afternoon_open: '', afternoon_close: '', is_closed: true }
  ];
  const [schedules, setSchedules] = useState(defaultSchedule);

  const handleScheduleChange = (day, field, value) => {
    setSchedules(prev => prev.map(s => s.day_of_week === day ? { ...s, [field]: value } : s));
  };

  const fetchSettings = useCallback(async () => {
    if (!user?.serviceId) return;
    try {
      const response = await fetch(apiPath(`/settings?serviceId=${user.serviceId}`), { headers: adminHeaders(user, token) });
      if (response.ok) {
        const data = await response.json();
        data.forEach(s => {
          if (s.setting_key === 'business_name') setBusinessName(s.setting_value);
          if (s.setting_key === 'grace_period') setGracePeriod(parseInt(s.setting_value));
          if (s.setting_key === 'service_category') setServiceCategory(s.setting_value);
          if (s.setting_key === 'sms_enabled') setSmsEnabled(s.setting_value === 'true');
          if (s.setting_key === 'email_enabled') setEmailEnabled(s.setting_value === 'true');
        });
      }

      const servicesRes = await fetch(apiPath('/services'));
      if (servicesRes.ok) {
        const services = await servicesRes.json();
        const myService = services.find(s => s.id === user.serviceId);
        if (myService) {
          setMaxCapacity(myService.max_capacity || 100);
          setEstimatedWaitTime(myService.estimated_wait_time || 10);
          setIsOpen(!!myService.is_open);
          setIsFastTrackAvailable(!!myService.is_fast_track_available);
          setAddress(myService.address || '');
          setLogoUrl(myService.logo_url || '');
          setBannerUrl(myService.banner_url || '');
          setCoverImageUrl(myService.cover_image_url || '');
          setPhoneNumber(myService.phone_number || '');
          setEmailAddress(myService.email_address || '');
          setWebsite(myService.website || '');
        }
      }

      const schedulesRes = await fetch(apiPath(`/services/${user.serviceId}/schedules`));
      if (schedulesRes.ok) {
        const schedData = await schedulesRes.json();
        if (schedData && schedData.length > 0) {
          setSchedules(prev => prev.map(p => {
             const existing = schedData.find(s => s.day_of_week === p.day_of_week);
             if (existing) {
               return {
                 ...p,
                 morning_open: existing.morning_open ? existing.morning_open.substring(0, 5) : '',
                 morning_close: existing.morning_close ? existing.morning_close.substring(0, 5) : '',
                 afternoon_open: existing.afternoon_open ? existing.afternoon_open.substring(0, 5) : '',
                 afternoon_close: existing.afternoon_close ? existing.afternoon_close.substring(0, 5) : '',
                 is_closed: !!existing.is_closed
               };
             }
             return p;
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, [user]);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    const settings = [
      { key: 'business_name', value: businessName },
      { key: 'grace_period', value: gracePeriod },
      { key: 'service_category', value: serviceCategory },
      { key: 'sms_enabled', value: smsEnabled.toString() },
      { key: 'email_enabled', value: emailEnabled.toString() }
    ];

    try {
      await Promise.all(settings.map(s =>
        fetch(apiPath('/settings'), {
          method: 'POST',
          headers: adminHeaders(user, token),
          body: JSON.stringify({ serviceId: user.serviceId, ...s })
        })
      ));

      await fetch(apiPath(`/services/${user.serviceId}/operations`), {
        method: 'PUT',
        headers: adminHeaders(user, token),
        body: JSON.stringify({
          estimated_wait_time: estimatedWaitTime,
          max_capacity: maxCapacity,
          is_open: isOpen,
          is_fast_track_available: isFastTrackAvailable
        })
      });

      await fetch(apiPath(`/services/${user.serviceId}/schedules`), {
        method: 'PUT',
        headers: adminHeaders(user, token),
        body: JSON.stringify({ schedules })
      });

      await fetch(apiPath(`/services/${user.serviceId}/info`), {
        method: 'PUT',
        headers: adminHeaders(user, token),
        body: JSON.stringify({
          name: businessName,
          category: serviceCategory,
          address,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          cover_image_url: coverImageUrl,
          phone_number: phoneNumber,
          email_address: emailAddress,
          website
        })
      });

      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems = [
    { id: 'general', label: 'General', icon: 'business' },

    { id: 'notifications', label: 'Notifications', icon: 'notifications_active' },
    { id: 'queue-logic', label: 'Queue Logic', icon: 'auto_awesome' },
    { id: 'security', label: 'Security', icon: 'security' }
  ];

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
          placeholder="Search settings..."
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* Content Wrapper */}
        <div style={styles.contentPad}>
          <header style={styles.header}>
            <h1 className="headline" style={styles.pageTitle}>Settings</h1>
            <p style={styles.pageSubtitle}>Configure your service ecosystem and queue parameters.</p>
          </header>

          <div style={styles.settingsLayout}>
            {/* Left Nav */}
            <aside style={styles.subSidebar}>
              <nav style={styles.subSticky}>
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    style={activeSection === item.id ? styles.subNavLinkActive : styles.subNavLink}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content area */}
            <div style={styles.panelsArea}>

              {/* Section: General */}
              <section id="general" style={styles.sectionPanel}>
                <div style={styles.sectionHeader}>
                  <div style={{ ...styles.iconBox, backgroundColor: 'var(--primary-container)', color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined">business</span>
                  </div>
                  <div>
                    <h2 className="headline" style={styles.sectionTitle}>General</h2>
                    <p style={styles.sectionSub}>Core business identification and operation hours.</p>
                  </div>
                </div>

                <div style={styles.grid2}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      style={styles.inputText}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Service Category</label>
                    <select 
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value)}
                      style={styles.inputSelect}
                    >
                      <option>Healthcare</option>
                      <option>Banking</option>
                      <option>Retail</option>
                      <option>Government</option>
                    </select>
                  </div>
                </div>

                <div style={{ ...styles.grid2, marginTop: '1.5rem' }}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={styles.inputText}
                      placeholder="+212 5XX XX XX XX"
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      style={styles.inputText}
                      placeholder="contact@service.com"
                    />
                  </div>
                </div>
                <div style={{ ...styles.inputGroup, marginTop: '1.5rem' }}>
                  <label style={styles.label}>Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    style={styles.inputText}
                    placeholder="https://www.service.com"
                  />
                </div>

                <div style={styles.divider} />

                <h3 className="headline" style={styles.subTitle}>Operational Hours</h3>
                <div style={styles.hoursList}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName, idx) => {
                    const dayNum = idx + 1;
                    const sched = schedules.find(s => s.day_of_week === dayNum) || defaultSchedule[idx];
                    return (
                      <div key={dayNum} style={{ ...styles.hourRow, alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', width: '130px', marginTop: '0.5rem' }}>
                          <input 
                            type="checkbox" 
                            checked={!sched.is_closed} 
                            onChange={(e) => handleScheduleChange(dayNum, 'is_closed', !e.target.checked)}
                            style={{ marginRight: '8px', accentColor: 'var(--primary)' }}
                          />
                          <span style={{ ...styles.dayText, opacity: sched.is_closed ? 0.5 : 1 }}>{dayName}</span>
                        </div>
                        
                        {!sched.is_closed ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                            <div style={styles.timeInputs}>
                              <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', width: '70px', fontWeight: 'bold' }}>Morning</span>
                              <input type="time" value={sched.morning_open} onChange={e => handleScheduleChange(dayNum, 'morning_open', e.target.value)} style={styles.timeField} />
                              <span style={styles.toText}>to</span>
                              <input type="time" value={sched.morning_close} onChange={e => handleScheduleChange(dayNum, 'morning_close', e.target.value)} style={styles.timeField} />
                            </div>
                            <div style={styles.timeInputs}>
                              <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', width: '70px', fontWeight: 'bold' }}>Afternoon</span>
                              <input type="time" value={sched.afternoon_open} onChange={e => handleScheduleChange(dayNum, 'afternoon_open', e.target.value)} style={styles.timeField} />
                              <span style={styles.toText}>to</span>
                              <input type="time" value={sched.afternoon_close} onChange={e => handleScheduleChange(dayNum, 'afternoon_close', e.target.value)} style={styles.timeField} />
                            </div>
                          </div>
                        ) : (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: '40px' }}>
                            <span style={styles.closedTag}>Closed</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>



              {/* Section: Notifications */}
              <section id="notifications" style={styles.sectionPanel}>
                <div style={styles.sectionHeader}>
                  <div style={{ ...styles.iconBox, backgroundColor: 'var(--secondary-container)', color: 'var(--secondary)' }}>
                    <span className="material-symbols-outlined">notifications_active</span>
                  </div>
                  <div>
                    <h2 className="headline" style={styles.sectionTitle}>Notifications</h2>
                    <p style={styles.sectionSub}>Manage how customers are alerted of their status.</p>
                  </div>
                </div>

                <div style={styles.togglesList}>
                  <div style={styles.toggleRow}>
                    <div style={{ flex: 1 }}>
                      <p style={styles.toggleLabel}>SMS Alerts</p>
                      <p style={styles.toggleDesc}>Send a text message when customer is 3rd in line.</p>
                    </div>
                    <button
                      onClick={() => setSmsEnabled(!smsEnabled)}
                      style={smsEnabled ? styles.switchActive : styles.switch}
                    >
                      <div style={smsEnabled ? styles.switchKnobActive : styles.switchKnob}></div>
                    </button>
                  </div>
                  <div style={styles.toggleRow}>
                    <div style={{ flex: 1 }}>
                      <p style={styles.toggleLabel}>Email Confirmation</p>
                      <p style={styles.toggleDesc}>Send digital ticket immediately after joining the queue.</p>
                    </div>
                    <button
                      onClick={() => setEmailEnabled(!emailEnabled)}
                      style={emailEnabled ? styles.switchActive : styles.switch}
                    >
                      <div style={emailEnabled ? styles.switchKnobActive : styles.switchKnob}></div>
                    </button>
                  </div>
                </div>

                <div style={styles.infoBox}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>info</span>
                  <div>
                    <p style={styles.infoTitle}>Dynamic Placeholder Tags</p>
                    <p style={styles.infoText}>Use <code>{'{name}'}</code>, <code>{'{position}'}</code>, and <code>{'{wait_time}'}</code> in your custom message templates.</p>
                  </div>
                </div>
              </section>

              {/* Section: Queue Logic */}
              <section id="queue-logic" style={styles.sectionPanel}>
                <div style={styles.sectionHeader}>
                  <div style={{ ...styles.iconBox, backgroundColor: 'var(--tertiary-container)', color: 'var(--tertiary)' }}>
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <div>
                    <h2 className="headline" style={styles.sectionTitle}>Queue Logic</h2>
                    <p style={styles.sectionSub}>Define automation and grace periods for traffic flow.</p>
                  </div>
                </div>

                <div style={styles.grid2}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Wait Metric (Minutes per customer)</label>
                    <input
                      type="number"
                      value={estimatedWaitTime}
                      onChange={(e) => setEstimatedWaitTime(parseInt(e.target.value) || 0)}
                      style={styles.inputText}
                    />
                    <p style={styles.inputHint}>Estimated time to serve one customer.</p>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Max Capacity Limit</label>
                    <input
                      type="number"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 0)}
                      style={styles.inputText}
                    />
                    <p style={styles.inputHint}>Maximum number of tickets allowed in the queue.</p>
                  </div>
                </div>

                <div style={{ ...styles.grid2, marginTop: '2rem' }}>
                  <div style={styles.inputGroup}>
                    <div style={styles.labelValue}>
                      <label style={styles.label}>Grace Period (Minutes)</label>
                      <span style={styles.sliderVal}>{gracePeriod}m</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={gracePeriod}
                      onChange={(e) => setGracePeriod(e.target.value)}
                      style={styles.inputRange}
                    />
                    <p style={styles.inputHint}>Time a customer has to arrive after being called before auto-skip.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                      flex: 1, padding: '1rem', borderRadius: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      backgroundColor: isOpen ? 'var(--tertiary-container)' : 'var(--surface-container-high)',
                      color: isOpen ? 'var(--on-tertiary-container)' : 'var(--on-surface-variant)',
                      border: 'none', cursor: 'pointer', transition: 'all 0.3s'
                    }}>
                    <span className="material-symbols-outlined">{isOpen ? 'check_circle' : 'cancel'}</span>
                    {isOpen ? 'Hub Active' : 'Hub Offline'}
                  </button>
                  <button
                    onClick={() => setIsFastTrackAvailable(!isFastTrackAvailable)}
                    style={{
                      flex: 1, padding: '1rem', borderRadius: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      backgroundColor: isFastTrackAvailable ? 'var(--secondary-container)' : 'var(--surface-container-high)',
                      color: isFastTrackAvailable ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)',
                      border: 'none', cursor: 'pointer', transition: 'all 0.3s'
                    }}>
                    <span className="material-symbols-outlined">bolt</span>
                    Fast Track
                  </button>
                </div>
              </section>

              {/* Section: Security */}
              <section id="security" style={styles.sectionPanel}>
                <div style={styles.sectionHeader}>
                  <div style={{ ...styles.iconBox, backgroundColor: 'rgba(172, 49, 73, 0.1)', color: 'var(--error)' }}>
                    <span className="material-symbols-outlined">security</span>
                  </div>
                  <div>
                    <h2 className="headline" style={styles.sectionTitle}>Security</h2>
                    <p style={styles.sectionSub}>Access control and data protection policies.</p>
                  </div>
                </div>

                <div style={styles.secureList}>
                  <div style={styles.secureLink}>
                    <div style={styles.secureIcon}>
                      <span className="material-symbols-outlined">fingerprint</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={styles.secureTitle}>Two-Factor Authentication</p>
                      <p style={styles.secureDesc}>Add an extra layer of security to your admin login.</p>
                    </div>
                    <span className="material-symbols-outlined" style={{ opacity: 0.3 }}>chevron_right</span>
                  </div>
                  <div style={styles.secureLink}>
                    <div style={styles.secureIcon}>
                      <span className="material-symbols-outlined">history</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={styles.secureTitle}>Audit Logs</p>
                      <p style={styles.secureDesc}>Review all system changes made by staff members.</p>
                    </div>
                    <span className="material-symbols-outlined" style={{ opacity: 0.3 }}>chevron_right</span>
                  </div>

                  <div style={styles.dangerZone}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={styles.dangerIcon}>
                        <span className="material-symbols-outlined">delete_forever</span>
                      </div>
                      <div>
                        <p style={styles.dangerTitle}>Clear Historical Data</p>
                        <p style={styles.dangerDesc}>Wipe all queue history older than 365 days.</p>
                      </div>
                    </div>
                    <button style={styles.dangerBtn}>Execute Wipe</button>
                  </div>
                </div>
              </section>

              {/* Action Bar */}
              <div style={styles.actionBar}>
                <button style={styles.discardBtn}>Discard Changes</button>
                <button className="primary-gradient" style={styles.saveBtn} onClick={handleSave}>Save Changes</button>
                <button style={styles.resetBtn} onClick={fetchSettings}>Reset to Defaults</button>
              </div>

            </div>
          </div>
        </div>
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
  contentPad: {
    padding: '0 3rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '3rem'
  },
  pageTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    letterSpacing: '-0.025em'
  },
  pageSubtitle: {
    fontSize: '1.125rem',
    color: 'var(--on-surface-variant)',
    marginTop: '0.25rem'
  },
  settingsLayout: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    gap: '3rem',
    alignItems: 'flex-start'
  },
  subSidebar: {
    height: '100%'
  },
  subSticky: {
    position: 'sticky',
    top: '120px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  subNavLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '1rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--on-surface-variant)',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s'
  },
  subNavLinkActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '1rem',
    backgroundColor: 'var(--surface-container-low)',
    border: 'none',
    color: 'var(--primary)',
    fontSize: '0.875rem',
    fontWeight: '800',
    cursor: 'pointer',
    textAlign: 'left'
  },
  panelsArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4rem'
  },
  sectionPanel: {
    backgroundColor: 'white',
    borderRadius: '1.5rem',
    padding: '2.5rem',
    border: '1px solid var(--surface-container-low)',
    boxShadow: '0 4px 20px rgba(13, 52, 89, 0.03)'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '2.5rem'
  },
  iconBox: {
    width: '3.5rem',
    height: '3.5rem',
    borderRadius: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '800'
  },
  sectionSub: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    marginLeft: '0.25rem'
  },
  inputText: {
    padding: '0.875rem 1.25rem',
    borderRadius: '1rem',
    backgroundColor: 'var(--surface-container-low)',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '600',
    outline: 'none'
  },
  inputSelect: {
    padding: '0.875rem 1.25rem',
    borderRadius: '1rem',
    backgroundColor: 'var(--surface-container-low)',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '600',
    outline: 'none',
    appearance: 'none'
  },
  divider: {
    margin: '2rem 0',
    height: '1px',
    backgroundColor: 'var(--surface-container-low)'
  },
  subTitle: {
    fontSize: '1.125rem',
    fontWeight: '800',
    marginBottom: '1.5rem'
  },
  hoursList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  hourRow: {
    padding: '1.25rem',
    backgroundColor: 'rgba(239, 244, 255, 0.3)',
    borderRadius: '1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dayText: {
    fontWeight: '600'
  },
  timeInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  timeField: {
    backgroundColor: 'transparent',
    border: 'none',
    fontWeight: '800',
    color: 'var(--primary)',
    fontSize: '1rem'
  },
  toText: {
    color: 'var(--on-surface-variant)',
    fontSize: '0.8125rem'
  },
  closedTag: {
    color: 'var(--error)',
    fontSize: '0.75rem',
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  togglesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  toggleLabel: {
    fontWeight: '800'
  },
  toggleDesc: {
    fontSize: '0.8125rem',
    color: 'var(--on-surface-variant)'
  },
  switch: {
    width: '44px',
    height: '24px',
    backgroundColor: 'var(--surface-container-high)',
    borderRadius: '9999px',
    position: 'relative',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  switchActive: {
    width: '44px',
    height: '24px',
    backgroundColor: 'var(--primary)',
    borderRadius: '9999px',
    position: 'relative',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  switchKnob: {
    position: 'absolute',
    top: '4px',
    left: '4px',
    width: '16px',
    height: '16px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transition: 'transform 0.2s'
  },
  switchKnobActive: {
    position: 'absolute',
    top: '4px',
    left: '4px',
    width: '16px',
    height: '16px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transform: 'translateX(20px)',
    transition: 'transform 0.2s'
  },
  infoBox: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: 'var(--surface-container-low)',
    borderRadius: '1rem',
    display: 'flex',
    gap: '1rem'
  },
  infoTitle: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: 'var(--on-secondary-container)'
  },
  infoText: {
    fontSize: '0.75rem',
    color: 'var(--on-surface-variant)',
    marginTop: '0.25rem'
  },
  labelValue: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sliderVal: {
    padding: '0.25rem 0.75rem',
    backgroundColor: 'var(--primary-container)',
    color: 'var(--on-primary-container)',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '800'
  },
  inputRange: {
    width: '100%',
    height: '8px',
    borderRadius: '9999px',
    backgroundColor: 'var(--surface-container-low)',
    appearance: 'none',
    marginTop: '0.5rem'
  },
  inputHint: {
    fontSize: '11px',
    color: 'var(--on-surface-variant)',
    marginTop: '0.25rem'
  },
  secureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  secureLink: {
    padding: '1.25rem',
    backgroundColor: 'rgba(239, 244, 255, 0.4)',
    borderRadius: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  secureIcon: {
    width: '2.5rem',
    height: '2.5rem',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--on-surface-variant)'
  },
  secureTitle: {
    fontWeight: '800'
  },
  secureDesc: {
    fontSize: '0.75rem',
    color: 'var(--on-surface-variant)'
  },
  dangerZone: {
    marginTop: '2rem',
    padding: '1.5rem',
    border: '1px solid rgba(172, 49, 73, 0.1)',
    backgroundColor: 'rgba(172, 49, 73, 0.05)',
    borderRadius: '1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dangerIcon: {
    padding: '0.75rem',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    color: 'var(--error)'
  },
  dangerTitle: {
    fontWeight: '800',
    color: 'var(--error)'
  },
  dangerDesc: {
    fontSize: '0.75rem',
    color: 'rgba(172, 49, 73, 0.8)'
  },
  dangerBtn: {
    padding: '0.625rem 1rem',
    border: '1px solid rgba(172, 49, 73, 0.3)',
    color: 'var(--error)',
    borderRadius: '0.75rem',
    fontSize: '0.75rem',
    fontWeight: '800',
    backgroundColor: 'transparent',
    cursor: 'pointer'
  },
  actionBar: {
    padding: '2rem 0',
    borderTop: '1px solid var(--surface-container-low)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1.5rem'
  },
  discardBtn: {
    padding: '0.875rem 2rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--on-surface-variant)',
    fontWeight: '700',
    cursor: 'pointer',
    borderRadius: '1rem'
  },
  saveBtn: {
    padding: '0.875rem 2.5rem',
    color: 'white',
    border: 'none',
    borderRadius: '1rem',
    fontWeight: '700',
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(0, 85, 215, 0.15)'
  }
};

export default AdminSettingsPage;
